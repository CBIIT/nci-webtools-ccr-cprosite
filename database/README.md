# DynamoDB Schema

| Partition Key        | Sort Key                         | Attributes                                                                                                                                                                                             |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| gene#geneId          | gene#geneId                      | <ul><li>name</li><li>description</li></ul>                                                                                                                                                             |
| cancer#cancerId      | cancer#cancerId                  | <ul><li>name</li><li>description</li></ul>                                                                                                                                                             |
| case#geneId#cancerId | proteinDataSummary#caseId        | <ul><li>name</li><li>normalValueCount</li><li>normalValueMean</li><li>normalValueStandardError</li><li>tumorValueCount</li><li>tumorValueMean</li><li>tumorValueStandardError</li><li>pValue</li></ul> |
|                      | phosphoproteinDataSummary#caseId | <ul><li>name</li><li>normalValueCount</li><li>normalValueMean</li><li>normalValueStandardError</li><li>tumorValueCount</li><li>tumorValueMean</li><li>tumorValueStandardError</li><li>pValue</li></ul> |
|                      | rnaDataSummary#caseId            | <ul><li>name</li><li>normalValueCount</li><li>normalValueMean</li><li>normalValueStandardError</li><li>tumorValueCount</li><li>tumorValueMean</li><li>tumorValueStandardError</li><li>pValue</li></ul> |
|                      | tcgaRnaDataSummary#caseId        | <ul><li>name</li><li>normalValueCount</li><li>normalValueMean</li><li>normalValueStandardError</li><li>tumorValueCount</li><li>tumorValueMean</li><li>tumorValueStandardError</li><li>pValue</li></ul> |
|                      | proteinData#caseId               | <ul><li>name</li><li>normalValue</li><li>tumorValue</li></ul>                                                                                                                                          |
|                      | phosphoproteinData#caseId        | <ul><li>name</li><li>normalValue</li><li>tumorValue</li><li>accession</li><li>phosphorylationSite</li><li>phosphopeptide</li></ul>                                                                     |
|                      | rnaData#caseId                   | <ul><li>name</li><li>normalValue</li><li>tumorValue</li></ul>                                                                                                                                          |
|                      | tcgaRnaData#caseId               | <ul><li>name</li><li>normalValue</li><li>tumorValue</li></ul>                                                                                                                                          |

# Import Process

1. A list of sources is specified in the `sources.json` file.
2. A temporary SQLite database is used to normalize, validate, and join source datasets in a unified view, as well as to calculate summary statistics (eg: mean, standard error, p-value)
3. This unified view is then imported into the DynamoDB table.

# Running DynamoDB Locally

1. Download and unzip [DynamoDB](https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.zip) to the database/localDynamoDB folder
2. Ensure that credentials have been set in the AWS CLI
3. Run `npm start` in the database folder
