import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as efs from "aws-cdk-lib/aws-efs";

interface StorageStackProps extends cdk.StackProps {
  tier: string;
  vpc: ec2.IVpc;
  ecsSecurityGroup: ec2.ISecurityGroup;
}

export class StorageStack extends cdk.Stack {
  public readonly fileSystem: efs.FileSystem;
  public readonly accessPoint: efs.AccessPoint;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // EFS security group: allow NFS only from ECS tasks
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

    // EFS filesystem — RETAIN on delete to protect database
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

    // Access point scoped to /data — maps to UID/GID 1001 (nodejs user in AL2023)
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
