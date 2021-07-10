# DynamoDB Schema

| Partition Key   | Sort Key                            | Attributes                                 |
| --------------- | ----------------------------------- | ------------------------------------------ |
| cancer#cancerId | cancer#cancerId                     | <ul><li>name</li><li>description</li></ul> |
| gene#geneId     | gene#geneId                         | <ul><li>name</li><li>description</li></ul> |
|                 | caseSummary#cancerId                | <ul><li>meanNormalProteinLogRatio</li><li>standardErrorNormalProteinLogRatio</li><li>meanTumorProteinLogRatio</li><li>standardErrorTumorProteinLogRatio</li><li>pValueProteinLogRatio</li><li>meanNormalPhosphoproteinLogRatio</li><li>standardErrorNormalPhosphoproteinLogRatio</li><li>meanTumorPhosphoproteinLogRatio</li><li>standardErrorTumorPhosphoproteinLogRatio</li><li>pValuePhosphoproteinLogRatio</li><li>meanNormalRnaValue</li><li>standardErrorNormalRnaValue</li><li>meanTumorRnaValue</li><li>standardErrorTumorRnaValue</li><li>pValueRnaValue</li><li>meanNormalTcgaRnaValue</li><li>standardErrorNormalTcgaRnaValue</li><li>meanTumorTcgaRnaValue</li><li>standardErrorTumorTcgaRnaValue</li><li>pValueTcgaRnaValue</li> |
|                 | case#cancerId#caseId                | <ul><li>name</li><li>normalProteinLogRatio</li><li>tumorProteinLogRatio</li><li>normalPhosphoproteinLogRatio</li><li>tumorPhosphoproteinLogRatio</li><li>normalRnaValue</li><li>tumorRnaValue</li><li>normalTcgaRnaValue</li><li>tumorTcgaRnaValue</li><li>accession</li><li>phosphorylationSite</li><li>phosphopeptide</li></ul> |
|                 | mutation#cancerId#caseId#mutationId | <ul><li>mutationType</li><li>cdnaMutation</li><li>proteinMutation</li><li>startPosition</li><li>endPosition</li></ul> |

# Import Process

1. A list of sources is specified in the `sources.json` file.
2. A temporary SQLite database is used to normalize, validate, and join source datasets in a unified view, as well as to calculate summary statistics (eg: mean, standard error, p-value)
3. This unified view is then imported into the DynamoDB table.

# Running DynamoDB Locally

1. Download and unzip [DynamoDB](https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.zip) to the database/localDynamoDB folder
2. Ensure that credentials have been set in the AWS CLI
3. Run `npm start` in the database folder