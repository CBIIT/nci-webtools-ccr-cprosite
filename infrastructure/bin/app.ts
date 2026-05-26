#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/network-stack";
import { StorageStack } from "../lib/storage-stack";
import { EcsStack } from "../lib/ecs-stack";

const app = new cdk.App();

const tier = app.node.tryGetContext("tier") || "dev";

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || "us-east-1",
};

const networkStack = new NetworkStack(app, `cprosite-network-${tier}`, {
  env,
  tier,
});

const storageStack = new StorageStack(app, `cprosite-storage-${tier}`, {
  env,
  tier,
  vpc: networkStack.vpc,
  ecsSecurityGroup: networkStack.ecsSecurityGroup,
});

new EcsStack(app, `cprosite-app-${tier}`, {
  env,
  tier,
  vpc: networkStack.vpc,
  albSecurityGroup: networkStack.albSecurityGroup,
  ecsSecurityGroup: networkStack.ecsSecurityGroup,
  fileSystem: storageStack.fileSystem,
  accessPoint: storageStack.accessPoint,
});
