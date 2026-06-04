import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

interface NetworkStackProps extends cdk.StackProps {
  tier: string;
  existingVpcId?: string;
  existingAlbSecurityGroupId?: string;
  existingEcsSecurityGroupId?: string;
}

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

      // ALB: accepts HTTP traffic from the internet
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

      // ECS tasks: only accept traffic from the ALB
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
