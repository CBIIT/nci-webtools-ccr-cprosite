import * as fs from "fs";
import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as efs from "aws-cdk-lib/aws-efs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as appscaling from "aws-cdk-lib/aws-applicationautoscaling";
import { Construct } from "constructs";

// ---------------------------------------------------------------------------
// Microservice shape
// ---------------------------------------------------------------------------
export interface MicroserviceConfig {
  name: string;
  port: number;
  healthCheckPath: string;
  imageUrl: string;
  cpu: number;
  memory: number;
  path: string[];
  desiredCount: number;
  nonProdSchedule: boolean;
  enableAutoscaleCpu: boolean;
  enableAutoscaleMem: boolean;
}

/**
 * Parse a .env file into key-value pairs.
 * Skips blank lines, comments (#), and lines without '='.
 */
function parseEnvFile(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex < 1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    result[key] = value;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Stack props
// ---------------------------------------------------------------------------
export interface cprositeStackProps extends cdk.StackProps {
  env?: cdk.Environment;
  tier: string;
  appName: string;
  appNamespace: string;
  appService: string;
  appDomain: string;
  appPath: string;
  awslogsPrefix: string;

  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
  clusterArn: string;
  listenerArn: string;
  appRoleArn: string;

  healthCheckPath: string;
  gracePeriod: number;

  /** Web microservice */
  microservice: MicroserviceConfig;

  /** Schedule scaling capacities */
  scheduledMinCapacity: number;
  scheduledMaxCapacity: number;

  /** CPU auto-scaling bounds */
  autoscaleCpuMinCapacity: number;
  autoscaleCpuMaxCapacity: number;
  cpuTarget: number;

  /** Memory auto-scaling bounds */
  autoscaleMemMinCapacity: number;
  autoscaleMemMaxCapacity: number;
  memTarget: number;

  /** EFS */
  efsId: string;
  posixUid: number;
  posixGid: number;

  /** Priority for the ALB listener rule */
  listenerRulePriority: number;

  /** Path to the application .env file whose key-value pairs become SSM parameters */
  appEnvFile: string;
}

// ---------------------------------------------------------------------------
// Stack
// ---------------------------------------------------------------------------
// Main stack used by the current workflow: imports shared infra identifiers,
// deploys the ECS service, and publishes app/env settings to SSM.
export class cprositeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cprositeStackProps) {
    super(scope, id, props);

    const {
      tier,
      appName,
      appNamespace,
      appService,
      appDomain,
      appPath,
      awslogsPrefix,
      vpcId,
      subnetIds,
      securityGroupIds,
      clusterArn,
      listenerArn,
      appRoleArn,
      healthCheckPath,
      gracePeriod,
    } = props;

    // ------------------------------------------------------------------
    // Stack-level tags
    // ------------------------------------------------------------------
    const level = tier === "prod" ? "prod" : "nonprod";
    cdk.Tags.of(this).add("EnvironmentTier", tier);
    cdk.Tags.of(this).add("ResourceName", `${tier}-${appName}`);
    cdk.Tags.of(this).add("ManagedBy", "cdk");
    cdk.Tags.of(this).add("CreatedBy", "cdk");
    cdk.Tags.of(this).add("Project", "dceg-analysistools");
    cdk.Tags.of(this).add("Backup", level);
    cdk.Tags.of(this).add("PatchGroup", level);
    cdk.Tags.of(this).add("ApplicationName", appName);

    // ------------------------------------------------------------------
    // Import shared resources
    // ------------------------------------------------------------------
    // This stack assumes VPC/subnets/cluster/listener/roles already exist.
    const vpc = ec2.Vpc.fromLookup(this, "Vpc", { vpcId });

    const subnets = subnetIds.map((sid, i) =>
      ec2.Subnet.fromSubnetId(this, `Subnet${i}`, sid)
    );

    const securityGroups = securityGroupIds.map((sgId, i) =>
      ec2.SecurityGroup.fromSecurityGroupId(this, `SG${i}`, sgId)
    );

    const clusterName = cdk.Arn.split(
      clusterArn,
      cdk.ArnFormat.SLASH_RESOURCE_NAME
    ).resourceName!;
    const cluster = ecs.Cluster.fromClusterAttributes(this, "Cluster", {
      clusterName,
      clusterArn,
      vpc,
      securityGroups,
    });
    const executionRole = iam.Role.fromRoleArn(
      this,
      "ExecutionRole",
      appRoleArn
    );
    const taskRole = iam.Role.fromRoleArn(this, "TaskRole", appRoleArn);

    const listener =
      elbv2.ApplicationListener.fromApplicationListenerAttributes(
        this,
        "Listener",
        {
          listenerArn,
          securityGroup: securityGroups[0],
        }
      );

    // ==================================================================
    // 1. ECS Web Service
    // ==================================================================
    const ms = props.microservice;

    const logGroup = new logs.LogGroup(this, "WebLogGroup", {
      logGroupName: `/${appNamespace}/${tier}/${appName}/web`,
      retention: logs.RetentionDays.SIX_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const taskDef = new ecs.FargateTaskDefinition(this, "WebTaskDef", {
      family: `${tier}-${appName}-${appService}`,
      cpu: ms.cpu,
      memoryLimitMiB: ms.memory,
      executionRole,
      taskRole,
    });

    // Container image is provided via env config so each tier can pin or roll independently.
    taskDef.addContainer("WebContainer", {
      containerName: ms.name,
      image: ecs.ContainerImage.fromRegistry(ms.imageUrl),
      essential: true,
      portMappings: [
        {
          containerPort: ms.port,
          hostPort: ms.port,
          protocol: ecs.Protocol.TCP,
        },
      ],
      logging: ecs.LogDrivers.awsLogs({
        logGroup,
        streamPrefix: awslogsPrefix,
      }),
    });

    const tg = new elbv2.ApplicationTargetGroup(this, "WebTG", {
      targetGroupName: `${tier}-${appName}-${appService}`,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      vpc,
      healthCheck: {
        enabled: true,
        path: healthCheckPath,
        port: "80",
      },
    });

    const conditions: elbv2.ListenerCondition[] = [
      elbv2.ListenerCondition.hostHeaders([appDomain]),
    ];
    if (appPath) {
      conditions.push(elbv2.ListenerCondition.pathPatterns([`${appPath}/*`]));
    } else {
      conditions.push(elbv2.ListenerCondition.pathPatterns(["/*"]));
    }

    listener.addTargetGroups("WebListenerRule", {
      targetGroups: [tg],
      conditions,
      priority: props.listenerRulePriority,
    });

    const service = new ecs.FargateService(this, "WebService", {
      serviceName: `${tier}-${appName}-${appService}`,
      cluster,
      taskDefinition: taskDef,
      desiredCount: ms.desiredCount,
      securityGroups,
      vpcSubnets: { subnets },
      assignPublicIp: false,
      enableECSManagedTags: true,
      enableExecuteCommand: true,
      circuitBreaker: { rollback: true },
      healthCheckGracePeriod: cdk.Duration.seconds(gracePeriod),
      propagateTags: ecs.PropagatedTagSource.TASK_DEFINITION,
    });

    service.attachToApplicationTargetGroup(tg);

    // Use family name only (no revision) so CFN resolves to the latest active revision,
    // preventing revert of task definitions registered by CI/CD deploy workflows.
    // Remove DesiredCount so CFN preserves the current running value.
    const cfnService = service.node.defaultChild as ecs.CfnService;
    cfnService.addPropertyOverride(
      "TaskDefinition",
      `${tier}-${appName}-${appService}`
    );
    cfnService.addPropertyDeletionOverride("DesiredCount");

    // --- Auto-scaling (single ScalableTarget shared by all policies) ---
    // Keep one scalable target to avoid conflicting min/max settings across policies.
    const needsScaling =
      ms.nonProdSchedule ||
      (ms.enableAutoscaleCpu && props.cpuTarget > 0) ||
      (ms.enableAutoscaleMem && props.memTarget > 0);

    if (needsScaling) {
      const maxCaps = [
        ms.nonProdSchedule ? props.scheduledMaxCapacity : 0,
        ms.enableAutoscaleCpu && props.cpuTarget > 0
          ? props.autoscaleCpuMaxCapacity
          : 0,
        ms.enableAutoscaleMem && props.memTarget > 0
          ? props.autoscaleMemMaxCapacity
          : 0,
      ];
      const minCaps = [
        ms.nonProdSchedule ? props.scheduledMinCapacity : undefined,
        ms.enableAutoscaleCpu && props.cpuTarget > 0
          ? props.autoscaleCpuMinCapacity
          : undefined,
        ms.enableAutoscaleMem && props.memTarget > 0
          ? props.autoscaleMemMinCapacity
          : undefined,
      ].filter((v): v is number => v !== undefined);

      const scalable = service.autoScaleTaskCount({
        minCapacity: Math.min(...minCaps),
        maxCapacity: Math.max(...maxCaps),
      });

      if (ms.nonProdSchedule) {
        scalable.scaleOnSchedule("WebScaleOut", {
          schedule: appscaling.Schedule.cron({
            hour: "7",
            minute: "0",
            weekDay: "MON-FRI",
          }),
          minCapacity: props.scheduledMinCapacity,
          maxCapacity: props.scheduledMaxCapacity,
          timeZone: cdk.TimeZone.AMERICA_NEW_YORK,
        });
        scalable.scaleOnSchedule("WebScaleIn", {
          schedule: appscaling.Schedule.cron({
            hour: "19",
            minute: "0",
            weekDay: "MON-FRI",
          }),
          minCapacity: 0,
          maxCapacity: 0,
          timeZone: cdk.TimeZone.AMERICA_NEW_YORK,
        });
      }

      if (ms.enableAutoscaleCpu && props.cpuTarget > 0) {
        scalable.scaleOnCpuUtilization("WebCpuScale", {
          targetUtilizationPercent: props.cpuTarget,
          scaleInCooldown: cdk.Duration.seconds(60),
          scaleOutCooldown: cdk.Duration.seconds(60),
        });
      }

      if (ms.enableAutoscaleMem && props.memTarget > 0) {
        scalable.scaleOnMemoryUtilization("WebMemScale", {
          targetUtilizationPercent: props.memTarget,
          scaleInCooldown: cdk.Duration.seconds(60),
          scaleOutCooldown: cdk.Duration.seconds(60),
        });
      }
    }

    new cdk.CfnOutput(this, "WebServiceName", { value: service.serviceName });
    new cdk.CfnOutput(this, "WebTaskDefArn", {
      value: taskDef.taskDefinitionArn,
    });

    // ==================================================================
    // 2. EFS Access Point + SSM params for EFS IDs
    // ==================================================================
    const cfnAccessPoint = new efs.CfnAccessPoint(this, "EfsAccessPoint", {
      fileSystemId: props.efsId,
      posixUser: {
        uid: props.posixUid.toString(),
        gid: props.posixGid.toString(),
      },
      rootDirectory: {
        path: `/${appName}`,
        creationInfo: {
          ownerUid: props.posixUid.toString(),
          ownerGid: props.posixGid.toString(),
          permissions: "0755",
        },
      },
      accessPointTags: [
        { key: "Name", value: `${tier}-${appName}-efs-access-point` },
        { key: "ApplicationName", value: appName },
        { key: "Project", value: "dceg-analysistools" },
        { key: "CreatedBy", value: "cdk" },
        { key: "EnvironmentTier", value: tier.toUpperCase() },
        { key: "ResourceFunction", value: "efs" },
        { key: "ResourceName", value: `${tier}-${appName}-${appService}` },
      ],
    });

    new ssm.StringParameter(this, "SsmEfsAccessPointId", {
      parameterName: `/${appNamespace}/${tier}/${appName}/efs_access_point_id`,
      stringValue: cfnAccessPoint.attrAccessPointId,
      description: `EFS Access Point ID for ${appName} in ${tier}`,
    });

    new ssm.StringParameter(this, "SsmEfsFilesystemId", {
      parameterName: `/${appNamespace}/${tier}/${appName}/efs_filesystem_id`,
      stringValue: props.efsId,
      description: `EFS File System ID for ${appName} in ${tier}`,
    });

    new cdk.CfnOutput(this, "EfsAccessPointId", {
      value: cfnAccessPoint.attrAccessPointId,
    });

    // ==================================================================
    // 3. SSM Parameters (from app.env file)
    // ==================================================================
    // Publish all runtime keys from tier app env into SSM parameter paths.
    const appEnvVars = parseEnvFile(props.appEnvFile);
    for (const [key, value] of Object.entries(appEnvVars)) {
      const paramName = key.toLowerCase();
      new ssm.StringParameter(this, `SsmParam-${paramName}`, {
        parameterName: `/${appNamespace}/${tier}/${appName}/${paramName}`,
        stringValue: value,
      });
    }
  }
}

interface NetworkStackProps extends cdk.StackProps {
  env?: cdk.Environment;
  tier: string;
  existingVpcId?: string;
  existingAlbSecurityGroupId?: string;
  existingEcsSecurityGroupId?: string;
}

// Compatibility stack: supports either importing existing networking or creating a default VPC layout.
export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly albSecurityGroup: ec2.ISecurityGroup;
  public readonly ecsSecurityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const hasAnyExistingNetworkId =
      !!props.existingVpcId ||
      !!props.existingAlbSecurityGroupId ||
      !!props.existingEcsSecurityGroupId;
    const hasAllExistingNetworkIds =
      !!props.existingVpcId &&
      !!props.existingAlbSecurityGroupId &&
      !!props.existingEcsSecurityGroupId;

    if (hasAnyExistingNetworkId && !hasAllExistingNetworkIds) {
      throw new Error(
        "When using existing network, set EXISTING_VPC_ID, EXISTING_ALB_SG_ID, and EXISTING_ECS_SG_ID together."
      );
    }

    if (hasAllExistingNetworkIds) {
      // Reuse an existing network footprint managed outside this stack.
      this.vpc = ec2.Vpc.fromLookup(this, "ExistingVpc", {
        vpcId: props.existingVpcId,
      });
      this.albSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
        this,
        "ExistingAlbSecurityGroup",
        props.existingAlbSecurityGroupId,
        { mutable: false }
      );
      this.ecsSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
        this,
        "ExistingEcsSecurityGroup",
        props.existingEcsSecurityGroupId,
        { mutable: false }
      );
    } else {
      // Create a standalone network when no existing IDs are provided.
      this.vpc = new ec2.Vpc(this, "Vpc", {
        vpcName: `cprosite-${props.tier}`,
        maxAzs: 2,
        natGateways: 1,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: "Public",
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: "Private",
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
        ],
      });

      this.albSecurityGroup = new ec2.SecurityGroup(this, "AlbSecurityGroup", {
        vpc: this.vpc,
        securityGroupName: `cprosite-${props.tier}-alb`,
        description: "Allow HTTP/HTTPS inbound to ALB",
        allowAllOutbound: true,
      });
      this.albSecurityGroup.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(80),
        "HTTP from internet"
      );
      this.albSecurityGroup.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(443),
        "HTTPS from internet"
      );

      this.ecsSecurityGroup = new ec2.SecurityGroup(this, "EcsSecurityGroup", {
        vpc: this.vpc,
        securityGroupName: `cprosite-${props.tier}-ecs`,
        description: "Allow traffic from ALB to ECS tasks",
        allowAllOutbound: true,
      });
      this.ecsSecurityGroup.addIngressRule(
        this.albSecurityGroup,
        ec2.Port.tcp(80),
        "Frontend port from ALB"
      );
    }

    new cdk.CfnOutput(this, "VpcId", {
      value: this.vpc.vpcId,
      exportName: `cprosite-${props.tier}-vpc-id`,
    });
  }
}

interface StorageStackProps extends cdk.StackProps {
  env?: cdk.Environment;
  tier: string;
  vpc: ec2.IVpc;
  ecsSecurityGroup: ec2.ISecurityGroup;
}

// Compatibility stack: provisions EFS and an access point for SQLite persistence.
export class StorageStack extends cdk.Stack {
  public readonly fileSystem: efs.FileSystem;
  public readonly accessPoint: efs.AccessPoint;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const efsSecurityGroup = new ec2.SecurityGroup(this, "EfsSecurityGroup", {
      vpc: props.vpc,
      securityGroupName: `cprosite-${props.tier}-efs`,
      description: "Allow NFS from ECS tasks",
      allowAllOutbound: false,
    });
    efsSecurityGroup.addIngressRule(
      props.ecsSecurityGroup,
      ec2.Port.tcp(2049),
      "NFS from ECS tasks"
    );

    this.fileSystem = new efs.FileSystem(this, "Database", {
      vpc: props.vpc,
      fileSystemName: `cprosite-db-${props.tier}`,
      securityGroup: efsSecurityGroup,
      encrypted: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.accessPoint = this.fileSystem.addAccessPoint("DataAccessPoint", {
      path: "/data",
      createAcl: {
        ownerGid: "1001",
        ownerUid: "1001",
        permissions: "750",
      },
      posixUser: {
        gid: "1001",
        uid: "1001",
      },
    });

    new cdk.CfnOutput(this, "FileSystemId", {
      value: this.fileSystem.fileSystemId,
      exportName: `cprosite-${props.tier}-efs-id`,
    });

    new cdk.CfnOutput(this, "AccessPointId", {
      value: this.accessPoint.accessPointId,
      exportName: `cprosite-${props.tier}-efs-ap-id`,
    });
  }
}

interface EcsStackProps extends cdk.StackProps {
  env?: cdk.Environment;
  tier: string;
  vpc: ec2.IVpc;
  albSecurityGroup: ec2.ISecurityGroup;
  ecsSecurityGroup: ec2.ISecurityGroup;
  efsFileSystemId: string;
  efsAccessPointId: string;
}

// Compatibility stack: full ECS/ALB deployment path for earlier split-stack workflows.
export class EcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    // Single shared ECR repository; backend/frontend are separated by tags.
    const appRepo = ecr.Repository.fromRepositoryName(this, "AppRepo", "cprosite");

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc: props.vpc,
      clusterName: `cprosite-${props.tier}`,
      containerInsights: true,
    });

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

    const fileSystemArn = cdk.Arn.format(
      {
        service: "elasticfilesystem",
        resource: "file-system",
        resourceName: props.efsFileSystemId,
        arnFormat: cdk.ArnFormat.SLASH_RESOURCE_NAME,
      },
      this
    );
    const accessPointArn = cdk.Arn.format(
      {
        service: "elasticfilesystem",
        resource: "access-point",
        resourceName: props.efsAccessPointId,
        arnFormat: cdk.ArnFormat.SLASH_RESOURCE_NAME,
      },
      this
    );

    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "elasticfilesystem:ClientMount",
          "elasticfilesystem:ClientWrite",
          "elasticfilesystem:ClientRootAccess",
        ],
        resources: [fileSystemArn],
        conditions: {
          StringEquals: {
            "elasticfilesystem:AccessPointArn": accessPointArn,
          },
        },
      })
    );

    const logGroup = new logs.LogGroup(this, "LogGroup", {
      logGroupName: `/ecs/cprosite-${props.tier}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const taskDef = new ecs.FargateTaskDefinition(this, "TaskDef", {
      family: `cprosite-${props.tier}`,
      cpu: 1024,
      memoryLimitMiB: 2048,
      executionRole,
      taskRole,
      volumes: [
        {
          name: "database",
          efsVolumeConfiguration: {
            fileSystemId: props.efsFileSystemId,
            transitEncryption: "ENABLED",
            authorizationConfig: {
              accessPointId: props.efsAccessPointId,
              iam: "ENABLED",
            },
          },
        },
      ],
    });

    const backendContainer = taskDef.addContainer("backend", {
      containerName: "backend",
      image: ecs.ContainerImage.fromEcrRepository(
        appRepo,
        `backend-${props.tier}-latest`
      ),
      environment: {
        NODE_ENV: "production",
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

    backendContainer.addMountPoints({
      containerPath: "/deploy/database",
      sourceVolume: "database",
      readOnly: false,
    });

    taskDef.addContainer("frontend", {
      containerName: "frontend",
      image: ecs.ContainerImage.fromEcrRepository(
        appRepo,
        `frontend-${props.tier}-latest`
      ),
      environment: {
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

    const service = new ecs.FargateService(this, "Service", {
      cluster,
      taskDefinition: taskDef,
      serviceName: `cprosite-${props.tier}`,
      desiredCount: 1,
      securityGroups: [props.ecsSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
      enableECSManagedTags: true,
      propagateTags: ecs.PropagatedTagSource.SERVICE,
    });

    service.attachToApplicationTargetGroup(targetGroup);

    new cdk.CfnOutput(this, "LoadBalancerDns", {
      value: alb.loadBalancerDnsName,
      description: "Application Load Balancer DNS name",
      exportName: `cprosite-${props.tier}-alb-dns`,
    });

    new cdk.CfnOutput(this, "BackendRepoUri", {
      value: appRepo.repositoryUri,
      exportName: `cprosite-${props.tier}-backend-repo`,
    });

    new cdk.CfnOutput(this, "FrontendRepoUri", {
      value: appRepo.repositoryUri,
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
