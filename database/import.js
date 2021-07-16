const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const AWS = require('aws-sdk');
const { importSourceTables, importDynamoDBTable, getTimestamp } = require("./utils");
const sqlite = require("better-sqlite3");
const incrstdev = require( '@stdlib/stats/incr/stdev' );
const wilcoxon = require( '@stdlib/stats/wilcoxon' );
const { template } = require('lodash');
const sources = require("./sources.json");
const config = require('./config.json');
const args = require("minimist")(process.argv.slice(2));
const timestamp = getTimestamp(([absolute, relative]) => 
  `${absolute / 1000}s, ${relative / 1000}s`
);

if (config.aws) {
  AWS.config.update(config.aws);
}

(async function main() {
  const databaseFilePath = args.db || "data.db";
  const dynamoDB = new AWS.DynamoDB();

  if (fs.existsSync(databaseFilePath)) fs.unlinkSync(databaseFilePath);

  const mainSql = await fsp.readFile("schema/tables/main.sql", "utf-8");
  const templateSql = template(await fsp.readFile("schema/tables/template.sql", "utf-8"));

  // create schema
  const database = sqlite(databaseFilePath);
  database.exec(mainSql);
  database.function(
    "extract",
    (string, delimiter, index) => string.split(delimiter)[index],
  );
  database.function(
    "sqrt",
    v => Math.sqrt(v)
  )
  database.aggregate(
    "stdev",
    {
      start: () => incrstdev(),
      step: (accumulator, value) => { accumulator(value) },
      result: (accumulator) => accumulator()
    }
  )
  database.aggregate(
    "wilcoxon",
    {
      start: () => ({x: [], y: []}),
      step: ({x, y}, xValue, yValue) => { 
        if (xValue !== null && yValue !== null) {
          x.push(xValue);
          y.push(yValue);
        }
       },
      result: ({x, y}) => x.length > 1
       ? wilcoxon(x, y).pValue
       : null
    }
  );

  // import all sources into staging tables
  for (const source of sources) {
    console.log(`[${timestamp()}] importing source tables`);
    await importSourceTables(database, source, args.force);
    console.log(`[${timestamp()}] finished importing source tables`);

    // import global tables and proceed with study-specific imports
    if (source.name === "GLOBAL") {
      database.exec(
        `insert into gene(id, name, description) 
        select id, name, description
        from stage_gene
        order by id asc`,
      );
      continue;
    }

    // otherwise, continue importing source
    const tablePrefix = source.files[0].table;
    const caseTable = `${tablePrefix}_case`;
    const caseSummaryTable = `${tablePrefix}_case_summary`;
    const proteinDataTable = `${tablePrefix}_protein_data`;
    const phosphoproteinDataTable = `${tablePrefix}_phosphoprotein_data`;
    const rnaDataTable = `${tablePrefix}_rna_data`;
    const tcgaRnaDataTable = `${tablePrefix}_tcga_rna_data`;
    const tableSql = templateSql({
      caseTable,
      caseSummaryTable,
      proteinDataTable,
      phosphoproteinDataTable,
      rnaDataTable,
      tcgaRnaDataTable
    });

    database.exec(tableSql);
    database.exec("begin transaction");

    // retrieve stage table names and columns
    const stage = source.files.reduce(
      (tables, file) => ({
        ...tables,
        [file.name]: {
          table: file.table,
          columns: database
            .pragma(`table_info("${file.table}")`)
            .map((row) => row.name),
        },
      }),
      {},
    );

    // insert cancer entry
    const { lastInsertRowid: cancerId } = database
      .prepare(`insert into cancer(name, study) values (:cancer, :study)`)
      .run({
        cancer: source.cancer,
        study: source.study || '',
      });


    console.log(`[${timestamp()}] importing protein data`);
    database.exec(
      `insert into "${proteinDataTable}" (
        geneId,
        cancerId,
        name,
        normalValue,
        tumorValue
      ) select
          geneId,
          ${cancerId},
          caseId,
          normalProteinLogRatio,
          tumorProteinLogRatio
      from "${stage.source.table}"`
    );
    
    console.log(`[${timestamp()}] importing phosphoprotein data`);
    database.exec(
      `insert into "${phosphoproteinDataTable}" (
        geneId,
        cancerId,
        name,
        normalValue,
        tumorValue,
        accession,
        phosphorylationSite,
        phosphopeptide
      ) select
          geneId,
          ${cancerId},
          caseId,
          normalPhosphoproteinLogRatio,
          tumorPhosphoproteinLogRatio,
          accession,
          phosphorylationSite,
          phosphopeptide
      from "${stage.source.table}"`
    );

    console.log(`[${timestamp()}] importing rna data`);
    database.exec(
      `insert into "${rnaDataTable}" (
        geneId,
        cancerId,
        name,
        normalValue,
        tumorValue
      ) select
          geneId,
          ${cancerId},
          caseId,
          normalRnaValue,
          tumorRnaValue
      from "${stage.source.table}"`
    );


    console.log(`[${timestamp()}] importing tcga rna data`);
    database.exec(
      `insert into "${tcgaRnaDataTable}" (
        geneId,
        cancerId,
        name,
        normalValue,
        tumorValue,
        normalTcgaBarcode,
        tumorTcgaBarcode
      ) select
          geneId,
          ${cancerId},
          caseId,
          normalTcgaRnaValue,
          tumorTcgaRnaValue,
          normalTcgaBarcode,
          tumorTcgaBarcode
      from "${stage.source.table}"`
    );
      
    database.exec('commit');
    return;
    // insert cases
    // database.exec(
    //   `insert into "${caseTable}" (
    //       geneId,
    //       cancerId,
    //       name,
    //       normalProteinLogRatio,
    //       tumorProteinLogRatio,
    //       normalPhosphoproteinLogRatio,
    //       tumorPhosphoproteinLogRatio,
    //       normalRnaValue,
    //       tumorRnaValue,
    //       normalTcgaBarcode,
    //       normalTcgaRnaValue,
    //       tumorTcgaBarcode,
    //       tumorTcgaRnaValue,
    //       accession,
    //       phosphorylationSite,
    //       phosphopeptide
    //   )
    //   select
    //       geneId,
    //       ${cancerId},
    //       caseId,
    //       normalProteinLogRatio,
    //       tumorProteinLogRatio,
    //       normalPhosphoproteinLogRatio,
    //       tumorPhosphoproteinLogRatio,
    //       normalRnaValue,
    //       tumorRnaValue,
    //       normalTcgaBarcode,
    //       normalTcgaRnaValue,
    //       tumorTcgaBarcode,
    //       tumorTcgaRnaValue,
    //       accession,
    //       phosphorylationSite,
    //       phosphopeptide
    //   from "${stage.source.table}"`
    // );

    

    // update normalProteinLogRatio summary
    for (const type of [
      'normalProteinLogRatio', 
      'tumorProteinLogRatio', 
      'normalPhosphoproteinLogRatio', 
      'tumorPhosphoproteinLogRatio', 
      'normalRnaLevel', 
      'tumorRnaLevel'
    ]) {
      


      console.log(`updating summary statistics: ${type}`)
      database.exec(
        `insert into "${caseSummaryTable}" (
            geneId,
            cancerId,
            ${type}Count,
            ${type}Mean,
            ${type}StandardError
        )
        select
            geneId,
            cancerId,
            count(*),
            avg(${type}),
            stdev(${type}) / sqrt(count(*))
        from "${caseTable}"
        where ${type} is not null
        group by geneId, cancerId
        on conflict("geneId", "cancerId") do update set
            "${type}Count" = excluded."${type}Count",
            "${type}Mean" = excluded."${type}Mean",
            "${type}StandardError" = excluded."${type}StandardError"`
      );
    }

    for (const [type, normalColumn, tumorColumn] of [
      ['proteinLogRatio', 'normalProteinLogRatio', 'tumorProteinLogRatio'],
      ['phosphoproteinLogRatio', 'normalPhosphoproteinLogRatio', 'tumorPhosphoproteinLogRatio'],
      ['rnaValue', 'normalRnaValue', 'tumorRnaValue'],
      ['tcgaRnaValue', 'normalTcgaRnaValue', 'tumorTcgaRnaValue'],
    ]) {
      console.log(`updating p-value: ${type}`)
      database.exec(
        `insert into "${caseSummaryTable}" (
            geneId,
            cancerId,
            ${type}P
        )
        select
            geneId,
            cancerId,
            wilcoxon(${normalColumn}, ${tumorColumn})
        from "${caseTable}"
        group by geneId, cancerId
        on conflict("geneId", "cancerId") do update set
            ${type}PValue = excluded."${type}PValue"`
      );
    }

    database.exec("commit");
    console.log("Generating indexes");
    database.exec(await fsp.readFile("schema/indexes/main.sql", "utf-8"));
  
    // BEGIN IMPORTING TO DYNAMODB
  
    // load cancers
    // console.log(`[${timestamp()}] importing cancers`);
    // await importDynamoDBTable(
    //   dynamoDB,
    //   config.dynamoDB.tableName,
    //   database.prepare(
    //     `select
    //       'cancer#' || id as partitionKey,
    //       'cancer#' || id as sortKey,
    //       'cancer' as entityType,
    //       *
    //     from cancer;`
    //   ).all()
    // );
    // console.log(`[${timestamp()}] finished importing cancers`);
  
    // // load genes
    // console.log(`[${timestamp()}] importing genes`);
    // await importDynamoDBTable(
    //   dynamoDB,
    //   config.dynamoDB.tableName,
    //   database.prepare(
    //     `select
    //       'gene#' || id as partitionKey,
    //       'gene#' || id as sortKey,
    //       'gene' as entityType,
    //       *
    //     from gene`
    //   ).all()
    // );
    // console.log(`[${timestamp()}] finished importing genes`);
  
    // // load case summaries
    // console.log(`[${timestamp()}] importing case summaries`);
    // await importDynamoDBTable(
    //   dynamoDB,
    //   config.dynamoDB.tableName,
    //   database.prepare(
    //     `select
    //       'gene#' || geneId as partitionKey,
    //       'cancerCaseSummary#' || cancerId as sortKey,
    //       'cancerCaseSummary' as entityType,
    //       *
    //     from ${tablePrefix}_case_summary`
    //   ).all()
    // );
    // console.log(`[${timestamp()}] finished importing case summaries`);
  
    // // load cases
    // console.log(`[${timestamp()}] importing cases`);
    // await importDynamoDBTable(
    //   dynamoDB,
    //   config.dynamoDB.tableName,
    //   database.prepare(
    //     `select
    //       'gene#' || geneId as partitionKey,
    //       'cancerCase#' || cancerId || '#' || id as sortKey,
    //       'cancerCase' as entityType,
    //       *
    //     from ${tablePrefix}_case`
    //   ).all()
    // );
    // console.log(`[${timestamp()}] finished importing cases`);
  
    // // load mutations
    // console.log(`[${timestamp()}] importing mutations`);
    // await importDynamoDBTable(
    //   dynamoDB,
    //   config.dynamoDB.tableName,
    //   database.prepare(
    //     `select
    //       'gene#' || geneId as partitionKey,
    //       'cancerCaseMutation#' || cancerId || '#' || caseId || '#' || id as sortKey,
    //       'cancerCaseMutation' as entityType,
    //       *
    //     from ${tablePrefix}_mutation`
    //   ).all()
    // );
    // console.log(`[${timestamp()}] finished importing mutations`);
  
  }

  database.close();
})();
