const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { importSourceTables } = require("./utils");
const sqlite = require("better-sqlite3");
const sources = require("./sources.json");
const args = require("minimist")(process.argv.slice(2));

(async function main() {
  const databaseFilePath = args.db || "data.db";

  if (fs.existsSync(databaseFilePath)) fs.unlinkSync(databaseFilePath);

  const mainSql = await fsp.readFile("schema/tables/main.sql", "utf-8");
  const templateSql = await fsp.readFile("schema/tables/template.sql", "utf-8");

  // create schema
  const database = sqlite(databaseFilePath);
  database.exec(mainSql);
  database.function(
    "extract",
    (string, delimiter, index) => string.split(delimiter)[index],
  );

  // import all sources into staging tables
  for (const source of sources) {
    await importSourceTables(database, source, args.force);

    // import global tables and proceed with study-specific imports
    if (source.name === "GLOBAL") {
      database.exec(
        `insert into gene(id, name, description) 
        select id, symbol, name 
        from stage_gene 
        where id is not null 
        order by id asc`,
      );
      continue;
    }

    // otherwise, continue importing sources
    const tablePrefix = source.name;
    const tableSql = templateSql.replace(/TABLE_PREFIX/g, tablePrefix);
    const caseTable = `${tablePrefix}_case`;
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

    // insert study entry
    const { lastInsertRowid: cancerId } = database
      .prepare(`insert into cancer(name, study) values (:cancer, :study)`)
      .run({
        study: source.study,
        cancer: source.cancer,
      });

    // insert proteome and phosphoproteome entries
    const samples = database
      .prepare(`select * from "${stage.sample.table}" where type is not null`)
      .all();

    for (const sample of samples) {
      console.log(`importing sample for case: ${sample.case_id}`);

      const logRatioColumn = `${sample.aliquot} Log Ratio`;
      const unsharedLogRatioColumn = `${sample.aliquot} Unshared Log Ratio`;
      let stageProteomeLogRatioColumn = null;
      let stagePhosphoproteomeLogRatioColumn = null;

      if (stage.proteome.columns.includes(unsharedLogRatioColumn)) {
        stageProteomeLogRatioColumn = unsharedLogRatioColumn;
      } else if (stage.proteome.columns.includes(logRatioColumn)) {
        stageProteomeLogRatioColumn = logRatioColumn;
      }

      if (stage.phosphoproteome.columns.includes(unsharedLogRatioColumn)) {
        stagePhosphoproteomeLogRatioColumn = unsharedLogRatioColumn;
      } else if (stage.phosphoproteome.columns.includes(logRatioColumn)) {
        stagePhosphoproteomeLogRatioColumn = logRatioColumn;
      }

      const caseTableProteinLogRatioColumn =
        sample.type === "Normal"
          ? "proteinLogRatioControl"
          : "proteinLogRatioCase";

      const caseTablePhosphoproteinLogRatioColumn =
        sample.type === "Normal"
          ? "phosphoproteinLogRatioControl"
          : "phosphoproteinLogRatioCase";

      if (stageProteomeLogRatioColumn) {
        database.exec(
          `insert into "${caseTable}"
          (
            geneId,
            cancerId,
            name,
            ${caseTableProteinLogRatioColumn}
          )
          select
            g."id",
            ${cancerId},
            '${sample.case_id}',
            sp."${stageProteomeLogRatioColumn}" as logRatio
          from "${stage.proteome.table}" sp
          join gene g on g.name = sp.Gene
          on conflict("geneId", "cancerId", "name") do update set
            "${caseTableProteinLogRatioColumn}" = excluded."${caseTableProteinLogRatioColumn}"`,
        );
      }

      if (stagePhosphoproteomeLogRatioColumn) {
        database.exec(
          `insert into "${caseTable}"
          (
            geneId,
            cancerId,
            name,
            ${caseTablePhosphoproteinLogRatioColumn},
            accession,
            phosphorylationSite,
            phosphopeptide
          )
          select
            g."id",
            ${cancerId},
            '${sample.case_id}',
            sp."${stagePhosphoproteomeLogRatioColumn}",
            extract(sp."Phosphosite", ':', 0),
            extract(sp."Phosphosite", ':', 1),
            sp."Peptide"
          from "${stage.phosphoproteome.table}" sp
          join gene g on g.name = sp.Gene
          on conflict("geneId", "cancerId", "name") do update set
            "${caseTablePhosphoproteinLogRatioColumn}" = excluded."${caseTablePhosphoproteinLogRatioColumn}",
            "accession" = excluded."accession",
            "phosphorylationSite" = excluded."phosphorylationSite",
            "phosphopeptide" = excluded."phosphopeptide"`,
        );
      }
    }

    database.exec(
      `update "${caseTable}" 
        set proteinLogRatioChange = proteinLogRatioCase - proteinLogRatioControl
        where proteinLogRatioCase is not null and proteinLogRatioControl is not null`,
    );

    database.exec(
      `update "${caseTable}" 
        set phosphoproteinLogRatioChange = phosphoproteinLogRatioCase - phosphoproteinLogRatioControl
        where phosphoproteinLogRatioCase is not null and phosphoproteinLogRatioControl is not null`,
    );

    database.exec("commit");
  }

  console.log("Generating indexes");
  database.exec(await fsp.readFile("schema/indexes/main.sql", "utf-8"));
  database.close();
})();
