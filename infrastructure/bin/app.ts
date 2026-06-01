#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { pimixtureStack } from "../lib/app-stack";

const app = new cdk.App();

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function parseNumber(name: string): number {
  const value = Number(required(name));
  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${name} must be a valid number.`);
  }
  return value;
}

function parseBoolean(name: string): boolean {
  return required(name).toLowerCase() === "true";
}

const tier = process.env.TIER || app.node.tryGetContext("tier") || "dev";

const env: cdk.Environment = {
  account: process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || "us-east-1",
};

new pimixtureStack(app, `cprosite-app-${tier}`, {
  env,
  tier,
  appName: required("APP_NAME"),
  appNamespace: required("APP_NAMESPACE"),
  appService: required("APP_SERVICE"),
  appDomain: required("APP_DOMAIN"),
  appPath: process.env.APP_PATH || "",
  awslogsPrefix: required("AWSLOGS_PREFIX"),
  vpcId: required("VPC_ID"),
  subnetIds: parseCsv(required("SUBNET_IDS")),
  securityGroupIds: parseCsv(required("SECURITY_GROUP_IDS")),
  clusterArn: required("CLUSTER_ARN"),
  listenerArn: required("LISTENER_ARN"),
  appRoleArn: required("APP_ROLE_ARN"),
  healthCheckPath: required("HEALTH_CHECK_PATH"),
  gracePeriod: parseNumber("GRACE_PERIOD"),
  microservice: {
    name: required("WEB_CONTAINER_NAME"),
    port: parseNumber("WEB_CONTAINER_PORT"),
    healthCheckPath: required("HEALTH_CHECK_PATH"),
    imageUrl: required("WEB_IMAGE_URL"),
    cpu: parseNumber("WEB_CPU"),
    memory: parseNumber("WEB_MEMORY"),
    path: parseCsv(process.env.WEB_PATH || "/"),
    desiredCount: parseNumber("WEB_DESIRED_COUNT"),
    nonProdSchedule: parseBoolean("WEB_NON_PROD_SCHEDULE"),
    enableAutoscaleCpu: parseBoolean("WEB_ENABLE_AUTOSCALE_CPU"),
    enableAutoscaleMem: parseBoolean("WEB_ENABLE_AUTOSCALE_MEM"),
  },
  scheduledMinCapacity: parseNumber("SCHEDULED_MIN_CAPACITY"),
  scheduledMaxCapacity: parseNumber("SCHEDULED_MAX_CAPACITY"),
  autoscaleCpuMinCapacity: parseNumber("AUTOSCALE_CPU_MIN_CAPACITY"),
  autoscaleCpuMaxCapacity: parseNumber("AUTOSCALE_CPU_MAX_CAPACITY"),
  cpuTarget: parseNumber("CPU_TARGET"),
  autoscaleMemMinCapacity: parseNumber("AUTOSCALE_MEM_MIN_CAPACITY"),
  autoscaleMemMaxCapacity: parseNumber("AUTOSCALE_MEM_MAX_CAPACITY"),
  memTarget: parseNumber("MEM_TARGET"),
  efsId: required("EFS_ID"),
  posixUid: parseNumber("POSIX_UID"),
  posixGid: parseNumber("POSIX_GID"),
  listenerRulePriority: parseNumber("LISTENER_RULE_PRIORITY"),
  appEnvFile: required("APP_ENV_FILE"),
});
