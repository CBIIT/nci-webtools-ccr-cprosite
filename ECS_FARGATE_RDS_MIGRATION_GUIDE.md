# CProSite Migration Guide: ECS Fargate + RDS (PostgreSQL)

## Goal

This runbook describes how to migrate this repository from EC2 + Docker Compose + SQLite to AWS ECS Fargate + RDS PostgreSQL using Terraform.

## Current State (Repository-Specific)

- Runtime deployment currently uses EC2 + SSM + Docker Compose in `.github/workflows/deploy-cprosite.yml`.
- Container definitions currently live in `docker/docker-compose.deploy.yml`.
- Backend currently uses SQLite (`better-sqlite3`) in `server/services/api.js`.
- Dynamic query building includes SQLite-specific metadata and pragmas in `server/services/query.js`.
- Database build/import pipeline creates and loads SQLite DB in `database/import.js`.

## Target State

- Compute: ECS Fargate services (frontend + backend).
- Database: RDS PostgreSQL.
- IaC: Terraform-managed networking, ECS, ALB, IAM, RDS, logs, and secrets.
- Delivery: GitHub Actions builds/pushes images and triggers ECS deployment.

## Migration Strategy

Use a phased migration to reduce risk:

1. Build Terraform infrastructure in parallel with current platform.
2. Migrate application DB layer from SQLite to PostgreSQL.
3. Rebuild/populate data into PostgreSQL.
4. Deploy to ECS Fargate in non-prod.
5. Validate and cut over traffic.
6. Decommission EC2 deployment path.

## Phase 0: Prerequisites

1. Confirm AWS account, region, and environment naming (`dev`, `qa`, `stage`, `prod`).
2. Confirm whether VPC/subnets are existing or managed by Terraform.
3. Decide RDS option:
   - `db.t4g.medium` Single-AZ for lower environments.
   - Multi-AZ for production.
4. Choose migration window and rollback criteria.
5. Confirm DNS ownership and certificate strategy for ALB (ACM).

## Phase 1: Terraform Foundation

Create Terraform structure under `infra/terraform`:

1. `providers.tf`: AWS provider, region, default tags.
2. `variables.tf`: environment, VPC IDs, subnet IDs, image tags, domain, etc.
3. `locals.tf`: naming conventions.
4. `network.tf`: security groups for ALB, ECS tasks, RDS.
5. `ecr.tf`: optional if ECR already managed elsewhere.
6. `iam.tf`:
   - ECS task execution role.
   - ECS task role.
   - IAM policy for Secrets Manager/CloudWatch access.
7. `rds.tf`:
   - PostgreSQL instance (or Aurora PostgreSQL).
   - DB subnet group.
   - Parameter group.
   - Backup retention and maintenance window.
8. `ecs.tf`:
   - ECS cluster.
   - Task definitions (frontend/backend).
   - ECS services.
9. `alb.tf`:
   - ALB.
   - Listener (80/443).
   - Target groups and routing.
10. `logs.tf`:
    - CloudWatch log groups for frontend and backend.
11. `secrets.tf`:
    - Store DB credentials and connection values in Secrets Manager.
12. `outputs.tf`:
    - ALB DNS, ECS service names, RDS endpoint, secret ARN.

### Networking Rules

1. ALB SG allows inbound 80/443 from approved CIDR.
2. ECS task SG allows inbound:
   - frontend container from ALB SG.
   - backend container only from frontend service SG (or same task if colocated).
3. RDS SG allows inbound 5432 only from backend task SG.

## Phase 2: Backend Conversion from SQLite to PostgreSQL

### Step 2.1: Add PostgreSQL client

1. In `server/package.json`, add dependencies:
   - `pg`
   - optional query builder (`knex` or `kysely`) if desired.

### Step 2.2: Add DB config abstraction

1. Introduce env-based DB config (host, port, db, user, password, ssl).
2. Keep backward-compatible local mode if needed.
3. Remove direct file-path assumption (`database/cprosite.db`) from runtime config for deployed environments.

### Step 2.3: Replace DB connection

1. Update `server/services/api.js`:
   - Replace `better-sqlite3` connection with a PostgreSQL pool/client.
2. Ensure readiness endpoint checks `SELECT 1` against PostgreSQL.

### Step 2.4: Rewrite dynamic query metadata access

1. Update `server/services/query.js` replacements:
   - `sqlite_master` validation -> `information_schema.tables`.
   - `pragma table_info` -> `information_schema.columns`.
   - Remove `database.pragma("query_only = ON")` (not applicable).
2. Keep strict sanitization for table/column/order inputs.
3. Re-validate pagination and filtering behavior.

## Phase 3: Schema and Data Migration

### Step 3.1: Convert DDL

1. Convert `database/schema/tables/main.sql` for PostgreSQL syntax and types.
2. Convert `database/schema/indexes/main.sql` for PostgreSQL.
3. Create a dedicated script set under `database/schema/postgres`.

### Step 3.2: Rework import pipeline

`database/import.js` currently registers SQLite-specific custom aggregates/functions.

Use one of these approaches:

1. Preferred: compute advanced stats in Node.js and write final rows to PostgreSQL tables.
2. Alternative: reimplement needed SQL functions/aggregates in PostgreSQL SQL/PLpgSQL.

### Step 3.3: Load data into PostgreSQL

1. Provision schema first.
2. Run import/export pipeline against PostgreSQL in non-prod.
3. Validate row counts and sample query outputs against existing SQLite environment.

## Phase 4: Container and Runtime Changes

1. Keep existing Dockerfiles initially (`docker/backend.dockerfile`, `docker/frontend.dockerfile`).
2. Remove runtime dependency on mounted SQLite database and host volumes.
3. Pass DB credentials from Secrets Manager into backend task definition.
4. Keep frontend reverse proxy behavior from `docker/httpd-cprosite.conf`.

## Phase 5: ECS Deployment Pipeline (GitHub Actions)

Update `.github/workflows/deploy-cprosite.yml`:

1. Keep build and push image steps to ECR.
2. Remove EC2/SSM steps:
   - instance lookup.
   - compose rendering and remote `docker compose` commands.
3. Add ECS deployment steps:
   - render task definition JSON with new image tags.
   - register task definition.
   - update ECS service with force new deployment.
   - wait for services stable.
4. Optional: split into two workflows:
   - `infra-apply.yml` for Terraform.
   - `deploy-ecs.yml` for app deployments.

## Phase 6: Testing and Verification

Run these checks in `dev` then `qa`:

1. Health checks:
   - frontend endpoint returns UI.
   - backend `/api/ping` returns success.
2. Functional checks:
   - lookup endpoints return expected payloads.
   - representative `api/query` filters and sorting work.
3. Data checks:
   - row counts per major table.
   - key summary values spot-checked.
4. Performance checks:
   - baseline latency for common API queries.
   - CPU/memory for backend task and DB.
5. Operational checks:
   - logs visible in CloudWatch.
   - alarms configured for service and DB errors.

## Phase 7: Cutover Plan

1. Freeze non-essential schema/data changes.
2. Execute final data refresh to RDS.
3. Deploy ECS release candidate.
4. Switch DNS/traffic to ALB target.
5. Monitor for 1-2 hours with rollback readiness.

## Phase 8: Rollback Plan

Define rollback before cutover:

1. Keep EC2 deployment path active until ECS is proven stable.
2. DNS rollback target should be ready and tested.
3. Keep previous app image tags available in ECR.
4. Restore old workflow trigger path if deployment fails.

## Suggested Terraform Module Layout

1. `infra/terraform/modules/network`
2. `infra/terraform/modules/ecs-service`
3. `infra/terraform/modules/rds-postgres`
4. `infra/terraform/modules/alb`
5. `infra/terraform/envs/dev`
6. `infra/terraform/envs/qa`
7. `infra/terraform/envs/stage`
8. `infra/terraform/envs/prod`

## Minimal Work Breakdown and Order

1. Terraform skeleton + non-prod ECS/RDS provisioning.
2. PostgreSQL schema conversion.
3. Backend DB client/query-layer conversion.
4. Import pipeline conversion.
5. Non-prod deployment and test cycle.
6. Production cutover with rollback protection.

## Risk Register (Top Items)

1. SQL behavior drift between SQLite and PostgreSQL.
2. Performance regression in dynamic query endpoint.
3. Data mismatch from custom aggregate migration.
4. Secret/config injection mistakes during task startup.
5. Incomplete rollback rehearsal.

## Completion Criteria

Migration is complete when all are true:

1. ECS services are stable in all target environments.
2. All API regression checks pass.
3. RDS backups/monitoring/alerts are enabled.
4. EC2 + compose deployment path is retired.
5. Runbook and on-call operational docs are updated.
