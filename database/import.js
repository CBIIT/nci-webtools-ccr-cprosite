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

  // create schema
  const database = sqlite(databaseFilePath);
  database.exec(await fsp.readFile("schema/tables/main.sql", "utf-8"));

  // import all sources into staging tables
  for (const source of sources) {
    await importSourceTables(database, source, args.force);

    // import global tables and proceed with study-specific imports
    if (source.name === "GLOBAL") {
      database.exec(`
                insert into gene(id, symbol, name) 
                select id, symbol, name 
                from stage_gene 
                where id is not null 
                order by id asc 
            `);
      continue;
    }

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
    const { lastInsertRowid: studyId } = database
      .prepare(
        `insert into study(name, cancer) 
                values (:name, :name)`,
      )
      .run({
        name: source.name,
        cancer: source.cancer,
      });

    // insert proteome and phosphoproteome entries
    const samples = database
      .prepare(`select * from "${stage.sample.table}" where type is not null`)
      .all();

    for (const sample of samples) {
      console.log(`importing sample ${sample.case_id}`);

      const logRatioColumn = `${sample.aliquot} Log Ratio`;
      const unsharedLogRatioColumn = `${sample.aliquot} Unshared Log Ratio`;
      const { lastInsertRowid: sampleId } = database
        .prepare(
          `insert into sample(study_id, case_id, is_tumor)
                    values (:study_id, :case_id, :is_tumor)`,
        )
        .run({
          study_id: studyId,
          case_id: sample.case_id,
          is_tumor: sample.type === "Tumor" ? 1 : 0,
        });

      if (
        stage.proteome.columns.includes(logRatioColumn) &&
        stage.proteome.columns.includes(unsharedLogRatioColumn)
      ) {
        database.exec(
          `insert into proteome 
                    (
                        study_id,
                        gene_id, 
                        sample_id,
                        log_ratio,
                        unshared_log_ratio
                    )
                    select
                        ${studyId},
                        g."id",
                        ${sampleId},
                        sp."${logRatioColumn}",
                        sp."${unsharedLogRatioColumn}"
                    from "${stage.proteome.table}" sp
                    join gene g on g.symbol = sp.Gene;`,
        );
      } else {
        console.warn(
          `Warning: proteome columns not found for sample: ${sample.case_id} (${sample.aliquot})`,
        );
      }

      if (stage.phosphosite.columns.includes(logRatioColumn)) {
        database.exec(`
                    insert into phosphoproteome
                    (
                        study_id,
                        gene_id, 
                        sample_id,
                        peptide,
                        phosphorylation_site,
                        log_ratio
                    )
                    select
                        ${studyId},
                        g."id",
                        ${sampleId},
                        sp."Peptide",
                        sp."Phosphosite",
                        sp."${logRatioColumn}"
                    from "${stage.phosphosite.table}" sp
                    join gene g on g.symbol = sp.Gene;
                `);
      } else {
        console.warn(
          `Warning: phosphosite columns not found for sample: ${sample.case_id} (${sample.aliquot})`,
        );
      }
    }
  }

  console.log("Generating indexes");
  database.exec(await fsp.readFile("schema/indexes/main.sql", "utf-8"));
  database.close();
})();
