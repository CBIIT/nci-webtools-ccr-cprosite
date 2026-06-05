# nci-webtools-ccr-cptac-search

## Deployment process summary

This project uses three GitHub Actions workflows.

1. Deploy Infrastructure
	 - Workflow: `.github/workflows/deploy-infrastructure.yml`
	 - Purpose:
		 - downloads `{tier}-cdk.env` and `{tier}-app.env` from S3
		 - ensures `APP_ROLE_ARN` is present in `{tier}-app.env`
		 - deploys CDK stack
		 - publishes SSM parameters, including:
			 - explicit EFS params (`efs_id`, `efs_access_point_id`)
			 - app env-derived params (all app env keys lowercased)

2. Deploy CProSite
	 - Workflow: `.github/workflows/deploy-cprosite.yml`
	 - Purpose:
		 - reads required SSM parameters
		 - builds and pushes backend/frontend/data-import images
		 - renders and registers task definitions from:
			 - `.github/aws/web.yml`
			 - `.github/aws/data-import.yml`
		 - updates ECS web service

3. Import CProSite Data
	 - Workflow: `.github/workflows/import-db.yml`
	 - Purpose:
		 - reads `data_import_task`, `ecs_cluster`, `ecs_web_service` from SSM
		 - derives subnet/security group from existing web ECS service
		 - runs one Fargate import task

## Required env keys

### `{tier}-app.env` (minimum for current flow)

- `ECS_CLUSTER`
- `ECS_WEB_SERVICE`
- `ECS_WEB_TASK`
- `ECS_WEB_TASK_CPU_UNITS`
- `ECS_WEB_TASK_MEMORY_UNITS`
- `DATA_IMPORT_TASK`
- `APP_ROLE_ARN`
- `DATABASE_URL`

### `{tier}-cdk.env`

Must include standard CDK inputs (VPC/subnets/security groups/cluster/listener/EFS/etc.) required by `infrastructure/bin/app.ts`.

## Run order

1. Deploy Infrastructure
2. Deploy CProSite
3. Import CProSite Data

## Rerun guidance

- Infra or env key changes: run all 3 workflows.
- App/image/task template changes: run Deploy CProSite, then Import CProSite Data.
- DB reload only: run Import CProSite Data.