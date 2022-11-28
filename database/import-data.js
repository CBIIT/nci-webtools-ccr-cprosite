const fs = require("fs");
const fsp = require("fs/promises");
const { readFileAsIterable, importTable, getTimestamp } = require("./utils");
const sqlite = require("better-sqlite3");
const incrstdev = require("@stdlib/stats/incr/stdev");
const wilcoxon = require("@stdlib/stats/wilcoxon");
const ttest2 = require("@stdlib/stats/ttest2");
const { zip } = require("lodash");
//const { exportData } = require("./export.js");
const sources = require("./import-data.json");
const args = require("minimist")(process.argv.slice(2));
const timestamp = getTimestamp(([absolute, relative]) => `${absolute / 1000}s, ${relative / 1000}s`);
const _ = require("lodash");

(async function main() {
  const databaseFilePath = args.output || "cprosite_temp.db";

  const mainTablesSql = await fsp.readFile("schema/tables/main.sql", "utf-8");
  const brainProtainSql = _.template(await fsp.readFile("schema/tables/brainProtain.sql", "utf-8"));
  const brainPhosphoProtainSql = _.template(await fsp.readFile("schema/tables/brainPhosphoprotein.sql", "utf-8"));
  const mainIndexesSql = await fsp.readFile("schema/indexes/main.sql", "utf-8");

  // recreate database
  if (fs.existsSync(databaseFilePath)) fs.unlinkSync(databaseFilePath);

  const database = sqlite(databaseFilePath);
  const nanToNull = (value) => (isNaN(value) ? null : value);
  database.exec(mainTablesSql);

  // define functions
  database.function("extract", (string, delimiter, index) => string.split(delimiter)[index]);
  database.function("sqrt", (v) => nanToNull(Math.sqrt(v)));
  database.aggregate("stdev", {
    start: () => incrstdev(),
    step: (accumulator, value) => {
      accumulator(value);
    },
    result: (accumulator) => nanToNull(accumulator()),
  });
  database.aggregate("median", {
    start: () => [],
    step: (values, value) => {
      values.push(value);
    },
    result: (values) => {
      values.sort();
      const midpoint = (values.length - 1) / 2;
      const ceilValue = +values[Math.ceil(midpoint)];
      const floorValue = +values[Math.floor(midpoint)];
      return nanToNull((ceilValue + floorValue) / 2);
    },
  });
  database.aggregate("wilcoxon", {
    start: () => ({ x: [], y: [] }),
    step: ({ x, y }, xValue, yValue) => {
      if (xValue !== null && yValue !== null) {
        x.push(xValue);
        y.push(yValue);
      }
    },
    result: ({ x, y }) =>
      x.length > 1 && zip(x, y).some(([x, y]) => x - y !== 0) ? nanToNull(wilcoxon(x, y).pValue) : null,
  });
  database.aggregate("ttest2", {
    start: () => ({ x: [], y: [] }),
    step: ({ x, y }, xValue, yValue) => {
      if (xValue !== null) x.push(xValue);
      if (yValue !== null) y.push(yValue);
    },
    result: ({ x, y }) => (x.length > 1 && y.length > 1 ? nanToNull(ttest2(x, y).pValue) : null),
  });



  // prepare data folder
  console.log(`[${timestamp()}] preparing data directory`);
  //await exportData(args);
  //console.log(`[${timestamp()}] finished preparing data directory`);

  // import sources
  for (const { filePath, table, headers } of sources) {
    console.log(`[${timestamp()}] started importing ${table}`);
    const rows = readFileAsIterable(filePath, headers);
    console.log(rows)
    //await importTable(database, table, headers, rows);
    await importTable(database, table, headers, rows,true);
    console.log(`[${timestamp()}] finished importing ${table}`);
  }

  console.log("begin to create brain protain")
  
  database.exec(brainProtainSql({ 
        'tempTable': 'brainProtain_temp',
        'cancerId':"12"
      }));
   database.exec(brainPhosphoProtainSql({
     tempTable: `brainProtainPhospho_temp`,
         cancerId:"12"
  }));

  //run convert brain table to related tables
  //parse case_id: 
  //case_id: last two charactors: if Tu: is tummer; if No, is normal
  //A1BG	GTEX-Y8DK-0011-R10A-SM-HAKY1-No	-0.8782370354085390
  //A1BG	C3N-03183-Tu	0.02527919416672740
  //gene name will map with geneName.csv, geneName.name = brainTable.gene


//  generate ratios table
  database.exec(
    `insert into phosphoproteinRatioData
    (
        cancerId,
        geneId,
        participantId,
        normalValue,
        tumorValue,
        accession,
        phosphorylationSite,
        phosphopeptide
    ) select
        pd.cancerId,
        pd.geneId,
        pd.participantId,
        ppd.normalValue - pd.normalValue as normalValue,
        ppd.tumorValue - pd.tumorValue as tumorValue,
        ppd.accession,
        ppd.phosphorylationSite,
        ppd.phosphopeptide
    from proteinData pd
        inner join phosphoproteinData ppd on
            pd.cancerId = ppd.cancerId and
            pd.geneId = ppd.geneId and
            pd.participantId = ppd.participantId`,
  );

  // create indexes
  console.log(`[${timestamp()}] started generating indexes`);
  
    database.exec(mainIndexesSql);
  console.log(`[${timestamp()}] finished generating indexes`);

  for (const [dataTable, dataSummaryTable] of [
    ["proteinData", "proteinDataSummary"],
    ["phosphoproteinData", "phosphoproteinDataSummary"],
    ["phosphoproteinRatioData", "phosphoproteinRatioDataSummary"],
    ["rnaData", "rnaDataSummary"],
    ["tcgaRnaData", "tcgaRnaDataSummary"],
  ]) {
    // import phosphorylation site-specific summaries
    if (["phosphoproteinData", "phosphoproteinRatioData"].includes(dataTable)) {
      console.log(
        `[${timestamp()}] started generating normal sample statistics for phosphorylation sites: ${dataSummaryTable}`,
      );
      database.exec(
        `insert into "${dataSummaryTable}" (
            cancerId,
            geneId,
            accession,
            phosphorylationSite,
            phosphopeptide,
            normalSampleCount,
            normalSampleMean,
            normalSampleMedian,
            normalSampleStandardError
        )
        select
            cancerId,
            geneId,
            accession,
            phosphorylationSite,
            phosphopeptide,
            count(normalValue) as normalSampleCount,
            avg(normalValue) as normalSampleMean,
            median(normalValue) as normalSampleMedian,
            stdev(normalValue) / sqrt(count(normalValue))
        from "${dataTable}"
        where normalValue is not null and phosphorylationSite is not null
        group by cancerId, geneId, accession, phosphorylationSite, phosphopeptide
        on conflict do update set
            "normalSampleCount" = excluded."normalSampleCount",
            "normalSampleMean" = excluded."normalSampleMean",
            "normalSampleMedian" = excluded."normalSampleMedian",
            "normalSampleStandardError" = excluded."normalSampleStandardError"`,
      );

      database.exec(
        `insert into "${dataSummaryTable}" (
            cancerId,
            geneId,
            accession,
            phosphorylationSite,
            phosphopeptide,
            normalSampleCount,
            normalSampleMean,
            normalSampleMedian,
            normalSampleStandardError
        )
        select
            cancerId,
            geneId,
            accession,
            'all',
            'all',
            count(normalValue) as normalSampleCount,
            avg(normalValue) as normalSampleMean,
            median(normalValue) as normalSampleMedian,
            stdev(normalValue) / sqrt(count(normalValue))
        from "${dataTable}"
        where normalValue is not null and phosphorylationSite is not null
        group by cancerId, geneId, accession
        on conflict do update set
            "normalSampleCount" = excluded."normalSampleCount",
            "normalSampleMean" = excluded."normalSampleMean",
            "normalSampleMedian" = excluded."normalSampleMedian",
            "normalSampleStandardError" = excluded."normalSampleStandardError"`,
      );
      console.log(
        `[${timestamp()}] finished generating normal sample statistics for phosphorylation sites: ${dataSummaryTable}`,
      );

      console.log(
        `[${timestamp()}] finished generating tumor sample statistics for phosphorylation sites: ${dataSummaryTable}`,
      );
      database.exec(
        `insert into "${dataSummaryTable}" (
            cancerId,
            geneId,
            accession,
            phosphorylationSite,
            phosphopeptide,
            tumorSampleCount,
            tumorSampleMean,
            tumorSampleMedian,
            tumorSampleStandardError
        )
        select
            cancerId,
            geneId,
            accession,
            phosphorylationSite,
            phosphopeptide,
            count(tumorValue) as tumorSampleCount,
            avg(tumorValue) as tumorSampleMean,
            median(tumorValue) as tumorSampleMedian,
            stdev(tumorValue) / sqrt(count(tumorValue)) as tumorSampleStandardError
        from "${dataTable}"
        where tumorValue is not null and phosphorylationSite is not null
        group by cancerId, geneId, accession, phosphorylationSite, phosphopeptide
        on conflict do update set
            "tumorSampleCount" = excluded."tumorSampleCount",
            "tumorSampleMean" = excluded."tumorSampleMean",
            "tumorSampleMedian" = excluded."tumorSampleMedian",
            "tumorSampleStandardError" = excluded."tumorSampleStandardError"`,
      );

      database.exec(
        `insert into "${dataSummaryTable}" (
            cancerId,
            geneId,
            accession,
            phosphorylationSite,
            phosphopeptide,
            tumorSampleCount,
            tumorSampleMean,
            tumorSampleMedian,
            tumorSampleStandardError
        )
        select
            cancerId,
            geneId,
            accession,
            'all',
            'all',
            count(tumorValue) as tumorSampleCount,
            avg(tumorValue) as tumorSampleMean,
            median(tumorValue) as tumorSampleMedian,
            stdev(tumorValue) / sqrt(count(tumorValue)) as tumorSampleStandardError
        from "${dataTable}"
        where tumorValue is not null and phosphorylationSite is not null
        group by cancerId, geneId, accession
        on conflict do update set
            "tumorSampleCount" = excluded."tumorSampleCount",
            "tumorSampleMean" = excluded."tumorSampleMean",
            "tumorSampleMedian" = excluded."tumorSampleMedian",
            "tumorSampleStandardError" = excluded."tumorSampleStandardError"`,
      );

      console.log(
        `[${timestamp()}] finished generating tumor sample statistics for phosphorylation sites: ${dataSummaryTable}`,
      );

      console.log(`[${timestamp()}] started generating p-values for phosphorylation sites: ${dataSummaryTable}`);
      database.exec(
        `insert into "${dataSummaryTable}" (
          cancerId,
          geneId,
          accession,
          phosphorylationSite,
          phosphopeptide,
          pValuePaired,
          pValueUnpaired
        )
        select
            cancerId,
            geneId,
            accession,
            phosphorylationSite,
            phosphopeptide,
            wilcoxon(normalValue, tumorValue) as pValuePaired,
            ttest2(normalValue, tumorValue) as pValueUnpaired
        from "${dataTable}" 
        where phosphorylationSite is not null
        group by cancerId, geneId, accession, phosphorylationSite, phosphopeptide
        on conflict do update set
          "pValuePaired" = excluded."pValuePaired",
          "pValueUnpaired" = excluded."pValueUnpaired"`,
      );

      database.exec(
        `insert into "${dataSummaryTable}" (
          cancerId,
          geneId,
          accession,
          phosphorylationSite,
          phosphopeptide,
          pValuePaired,
          pValueUnpaired
        )
        select
            cancerId,
            geneId,
            accession,
            'all',
            'all',
            wilcoxon(normalValue, tumorValue) as pValuePaired,
            ttest2(normalValue, tumorValue) as pValueUnpaired
        from "${dataTable}" 
        where phosphorylationSite is not null
        group by cancerId, geneId, accession
        on conflict do update set
          "pValuePaired" = excluded."pValuePaired",
          "pValueUnpaired" = excluded."pValueUnpaired"`,
      );

      console.log(`[${timestamp()}] finished generating p-values for phosphorylation sites: ${dataSummaryTable}`);
    } else {
      // insert normal values
      console.log(`[${timestamp()}] started generating normal sample statistics: ${dataSummaryTable}`);
      database.exec(
        `insert into "${dataSummaryTable}" (
            geneId,
            cancerId,
            normalSampleCount,
            normalSampleMean,
            normalSampleMedian,
            normalSampleStandardError
        )
        select
            geneId,
            cancerId,
            count(normalValue) as normalSampleCount,
            avg(normalValue) as normalSampleMean,
            median(normalValue) as normalSampleMedian,
            stdev(normalValue) / sqrt(count(normalValue))
        from "${dataTable}"
        where normalValue is not null
        group by cancerId, geneId
        on conflict do update set
            "normalSampleCount" = excluded."normalSampleCount",
            "normalSampleMean" = excluded."normalSampleMean",
            "normalSampleMedian" = excluded."normalSampleMedian",
            "normalSampleStandardError" = excluded."normalSampleStandardError"`,
      );
      console.log(`[${timestamp()}] finished generating normal sample statistics: ${dataSummaryTable}`);

      console.log(`[${timestamp()}] finished generating tumor sample statistics: ${dataSummaryTable}`);
      database.exec(
        `insert into "${dataSummaryTable}" (
            cancerId,
            geneId,
            tumorSampleCount,
            tumorSampleMean,
            tumorSampleMedian,
            tumorSampleStandardError
        )
        select
            cancerId,
            geneId,
            count(tumorValue) as tumorSampleCount,
            avg(tumorValue) as tumorSampleMean,
            median(tumorValue) as tumorSampleMedian,
            stdev(tumorValue) / sqrt(count(tumorValue)) as tumorSampleStandardError
        from "${dataTable}"
        where tumorValue is not null
        group by cancerId, geneId
        on conflict do update set
            "tumorSampleCount" = excluded."tumorSampleCount",
            "tumorSampleMean" = excluded."tumorSampleMean",
            "tumorSampleMedian" = excluded."tumorSampleMedian",
            "tumorSampleStandardError" = excluded."tumorSampleStandardError"`,
      );
      console.log(`[${timestamp()}] finished generating tumor sample statistics: ${dataSummaryTable}`);

      console.log(`[${timestamp()}] started generating p-values: ${dataSummaryTable}`);
      database.exec(
        `insert into "${dataSummaryTable}" (
          cancerId,
          geneId,
          pValuePaired,
          pValueUnpaired
        )
        select
            cancerId,
            geneId,
            wilcoxon(normalValue, tumorValue) as pValuePaired,
            ttest2(normalValue, tumorValue) as pValueUnpaired
        from "${dataTable}"
        group by cancerId, geneId
        on conflict do update set
          "pValuePaired" = excluded."pValuePaired",
          "pValueUnpaired" = excluded."pValueUnpaired"`,
      );

      console.log(`[${timestamp()}] finished generating p-values: ${dataSummaryTable}`);
    }
  }


// let destDB = 'cprosite.db';
// await database.exec(`ATTACH '${destDB}' AS destDB`);
//   //insert into cprosite db
//   database.exec(`INSERT INTO destDB.cancer(id,name) VALUES(12,'Brain Cancer');
//   INSERT INTO destDB.proteinData(cancerId, geneId, participantId,normalValue, tumorValue) SELECT cancerId, geneId, participantId,normalValue, tumorValue FROM proteinData;
//   INSERT INTO destDB.proteinDataSummary(cancerId, geneId, normalSampleCount,normalSampleMean,normalSampleMedian,normalSampleStandardError,tumorSampleCount,tumorSampleMean,tumorSampleMedian,tumorSampleStandardError,pValuePaired,pValueUnpaired) SELECT cancerId, geneId, normalSampleCount,normalSampleMean,normalSampleMedian,normalSampleStandardError,tumorSampleCount,tumorSampleMean,tumorSampleMedian,tumorSampleStandardError,pValuePaired,pValueUnpaired FROM proteinDataSummary;
//   INSERT INTO destDB.phosphoproteinData(cancerId, geneId, participantId,normalValue, tumorValue,accession,phosphorylationSite,phosphopeptide) SELECT cancerId, geneId, participantId,normalValue, tumorValue,accession,phosphorylationSite,phosphopeptide FROM phosphoproteinData;
//   INSERT INTO destDB.phosphoproteinDataSummary(cancerId, geneId, accession,phosphorylationSite,phosphopeptide,normalSampleCount,normalSampleMean,normalSampleMedian,normalSampleStandardError,tumorSampleCount,tumorSampleMean,tumorSampleMedian,tumorSampleStandardError,pValuePaired,pValueUnpaired) SELECT cancerId, geneId, accession,phosphorylationSite,phosphopeptide,normalSampleCount,normalSampleMean,normalSampleMedian,normalSampleStandardError,tumorSampleCount,tumorSampleMean,tumorSampleMedian,tumorSampleStandardError,pValuePaired,pValueUnpaired FROM phosphoproteinDataSummary;
//   INSERT INTO destDB.phosphoproteinRatioData(cancerId, geneId, participantId,normalValue, tumorValue,accession,phosphorylationSite,phosphopeptide) SELECT cancerId, geneId, participantId,normalValue, tumorValue,accession,phosphorylationSite,phosphopeptide FROM phosphoproteinRatioData;
//   INSERT INTO destDB.phosphoproteinRatioDataSummary(cancerId, geneId, accession,phosphorylationSite,phosphopeptide,normalSampleCount,normalSampleMean,normalSampleMedian,normalSampleStandardError,tumorSampleCount,tumorSampleMean,tumorSampleMedian,tumorSampleStandardError,pValuePaired,pValueUnpaired) SELECT cancerId, geneId, accession,phosphorylationSite,phosphopeptide,normalSampleCount,normalSampleMean,normalSampleMedian,normalSampleStandardError,tumorSampleCount,tumorSampleMean,tumorSampleMedian,tumorSampleStandardError,pValuePaired,pValueUnpaired FROM phosphoproteinRatioDataSummary;
//  `)
 
  database.close();
})();
