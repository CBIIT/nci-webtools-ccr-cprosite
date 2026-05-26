import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as efs from "aws-cdk-lib/aws-efs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";

interface EcsStackProps extends cdk.StackProps {
  tier: string;
  vpc: ec2.Vpc;
  albSecurityGroup: ec2.SecurityGroup;
  ecsSecurityGroup: ec2.SecurityGroup;
  fileSystem: efs.FileSystem;
  accessPoint: efs.AccessPoint;
}

export class EcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    // ── ECR Repositories ───────────────────────────────────────────────────
    const backendRepo = new ecr.Repository(this, "BackendRepo", {
      repositoryName: `cprosite-backend-${props.tier}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [{ maxImageCount: 5 }],
    });

    const frontendRepo = new ecr.Repository(this, "FrontendRepo", {
      repositoryName: `cprosite-frontend-${props.tier}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [{ maxImageCount: 5 }],
    });

    // ── ECS Cluster ────────────────────────────────────────────────────────
    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc: props.vpc,
      clusterName: `cprosite-${props.tier}`,
      containerInsights: true,
    });

    // ── IAM Roles ──────────────────────────────────────────────────────────
    const executionRole = new iam.Role(this, "TaskExecutionRole", {
      roleName: `cprosite-${props.tier}-ecs-execution`,
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonECSTaskExecutionRolePolicy"
        ),
      ],
    });

    const taskRole = new iam.Role(this, "TaskRole", {
      roleName: `cprosite-${props.tier}-ecs-task`,
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    // Grant the task read/write access to EFS via IAM auth
    props.fileSystem.grantReadWrite(taskRole);

    // ── CloudWatch Logs ────────────────────────────────────────────────────
    const logGroup = new logs.LogGroup(this, "LogGroup", {
      logGroupName: `/ecs/cprosite-${props.tier}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── Fargate Task Definition ────────────────────────────────────────────
    const taskDef = new ecs.FargateTaskDefinition(this, "TaskDef", {
      family: `cprosite-${props.tier}`,
      cpu: 1024,
      memoryLimitMiB: 2048,
      executionRole,
      taskRole,
      // EFS volume — mounted into the backend container
      volumes: [
        {
          name: "database",
          efsVolumeConfiguration: {
            fileSystemId: props.fileSystem.fileSystemId,
            transitEncryption: "ENABLED",
            authorizationConfig: {
              accessPointId: props.accessPoint.accessPointId,
              iam: "ENABLED",
            },
          },
        },
      ],
    });

    // Backend container (Express + SQLite)
    const backendContainer = taskDef.addContainer("backend", {
      containerName: "backend",
      // On first deploy the image tag may not exist yet; use a placeholder
      // that gets overwritten by the deploy-cprosite workflow.
      image: ecs.ContainerImage.fromEcrRepository(
        backendRepo,
        `${props.tier}-latest`
      ),
      environment: {
        NODE_ENV: "production",
        // Overrides config.database path at runtime to point at EFS mount
        DATABASE: "/deploy/database/cprosite.db",
      },
      portMappings: [{ containerPort: 10000, protocol: ecs.Protocol.TCP }],
      logging: ecs.LogDriver.awsLogs({
        logGroup,
        streamPrefix: "backend",
      }),
      healthCheck: {
        command: [
          "CMD-SHELL",
          "curl -sf http://localhost:10000/api/ping || exit 1",
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    // Mount EFS at /deploy/database inside the backend container
    backendContainer.addMountPoints({
      containerPath: "/deploy/database",
      sourceVolume: "database",
      readOnly: false,
    });

    // Frontend container (Apache httpd — proxies /api to backend via localhost)
    taskDef.addContainer("frontend", {
      containerName: "frontend",
      image: ecs.ContainerImage.fromEcrRepository(
        frontendRepo,
        `${props.tier}-latest`
      ),
      environment: {
        // Containers in the same Fargate task share the network namespace,
        // so localhost:10000 reaches the backend container directly.
        API_HOST: "http://localhost:10000",
      },
      portMappings: [{ containerPort: 80, protocol: ecs.Protocol.TCP }],
      logging: ecs.LogDriver.awsLogs({
        logGroup,
        streamPrefix: "frontend",
      }),
      dependsOn: [
        {
          containerName: "backend",
          condition: ecs.ContainerDependencyCondition.HEALTHY,
        },
      ],
    });

    // ── Application Load Balancer ──────────────────────────────────────────
    const alb = new elbv2.ApplicationLoadBalancer(this, "Alb", {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      loadBalancerName: `cprosite-${props.tier}`,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, "TargetGroup", {
      vpc: props.vpc,
      targetGroupName: `cprosite-${props.tier}`,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: "/",
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        healthyHttpCodes: "200-399",
      },
    });

    alb.addListener("HttpListener", {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // ── Fargate Service ────────────────────────────────────────────────────
    const service = new ecs.FargateService(this, "Service", {
      cluster,
      taskDefinition: taskDef,
      serviceName: `cprosite-${props.tier}`,
      desiredCount: 1,
      securityGroups: [props.ecsSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      // VERSION1_4 is required for EFS mounts on Fargate
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
      enableECSManagedTags: true,
      propagateTags: ecs.PropagatedTagSource.SERVICE,
    });

    service.attachToApplicationTargetGroup(targetGroup);

    // Allow the ECS service security group to reach EFS (port 2049)
    props.fileSystem.connections.allowDefaultPortFrom(service.connections);

    // ── Outputs ────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "LoadBalancerDns", {
      value: alb.loadBalancerDnsName,
      description: "Application Load Balancer DNS name",
      exportName: `cprosite-${props.tier}-alb-dns`,
    });

    new cdk.CfnOutput(this, "BackendRepoUri", {
      value: backendRepo.repositoryUri,
      exportName: `cprosite-${props.tier}-backend-repo`,
    });

    new cdk.CfnOutput(this, "FrontendRepoUri", {
      value: frontendRepo.repositoryUri,
      exportName: `cprosite-${props.tier}-frontend-repo`,
    });

    new cdk.CfnOutput(this, "ClusterName", {
      value: cluster.clusterName,
      exportName: `cprosite-${props.tier}-cluster`,
    });

    new cdk.CfnOutput(this, "ServiceName", {
      value: service.serviceName,
      exportName: `cprosite-${props.tier}-service`,
    });
  }
}
