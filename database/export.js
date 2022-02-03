const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { template } = require("lodash");
const { getTimestamp } = require("./utils");
const exportSources = require("./exportSources.json");
const importSources = require("./importSources.json");
const timestamp = getTimestamp(
  ([absolute, relative]) => `${absolute / 1000}s, ${relative / 1000}s`,
);

if (require.main === module) {
  const args = require("minimist")(process.argv.slice(2));
  exportData(args)
    .then(() => {
      console.log(`[${timestamp()}] finished exporting data`);
      process.exit(0);
    })
    .catch((err) => {
      console.log(`[${timestamp()}] error exporting data`);
      console.error(err);
      process.exit(1);
    });
}

async function exportData({ host, port, user, password, database }) {
  host = host || "localhost";
  port = port || 3306;
  user = user || "root";
  password = password || "";
  database = database || "cprosite";

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });

  // generate tables
  console.log(`[${timestamp()}] started generating export tables`);
  const exportSqlStatements = generateExportSqlStatements(exportSources);
  for (const { label, sql } of exportSqlStatements) {
    console.log(`[${timestamp()}] started generating export for: ${label}`);
    await connection.query(sql);
    console.log(`[${timestamp()}] finished generating export for: ${label}`);
  }

  // export tables to files
  for (const { filePath, table, headers } of importSources) {
    console.log(`[${timestamp()}] started exporting table: ${table}`);

    const csvFilePath = path.resolve(filePath);

    if (fs.existsSync(csvFilePath)) {
      fs.unlinkSync(csvFilePath);
    }

    const sql = `
      SELECT ${headers.map((h) => `'${h}'`).join(",")}
      UNION ALL
      SELECT ${headers.join(",")} FROM ${table}
        INTO OUTFILE '${csvFilePath.replace(/\\/g, "/")}'
      FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' ESCAPED BY '"'
      LINES TERMINATED BY '\r\n'`;

    await connection.query(sql);
    console.log(`[${timestamp()}] finished exporting table: ${table}`);
  }
}

function generateExportSqlStatements(sources) {
  const mainTableTemplate = template(
    fs.readFileSync("./schema/exportTemplates/main.sql", "utf8"),
  );
  const proteinDataTemplate = template(
    fs.readFileSync("./schema/exportTemplates/proteinData.sql", "utf8"),
  );
  const proteinSinglePoolDataTemplate = template(
    fs.readFileSync(
      "./schema/exportTemplates/proteinSinglePoolData.sql",
      "utf8",
    ),
  );
  const phosphoproteinDataTemplate = template(
    fs.readFileSync("./schema/exportTemplates/phosphoproteinData.sql", "utf8"),
  );
  const phosphoproteinSinglePoolDataTemplate = template(
    fs.readFileSync(
      "./schema/exportTemplates/phosphoproteinSinglePoolData.sql",
      "utf8",
    ),
  );
  const rnaDataTemplate = template(
    fs.readFileSync("./schema/exportTemplates/rnaData.sql", "utf8"),
  );
  const tcgaRnaDataTemplate = template(
    fs.readFileSync("./schema/exportTemplates/tcgaRnaData.sql", "utf8"),
  );

  let sqlStatements = [{ label: "main", sql: mainTableTemplate() }];

  for (const {
    cancer,
    cancerId,
    proteinTable,
    phosphoproteinTable,
    proteinSinglePoolTable,
    phosphoproteinSinglePoolTable,
    rnaTable,
    tcgaRnaTable,
  } of sources) {
    if (proteinTable) {
      let label = `${cancer}_protein_data`;
      let sql = proteinDataTemplate({
        sourceTable: proteinTable,
        tempTable: `${proteinTable}_temp`,
        cancerId,
      });
      sqlStatements.push({ label, sql });
    }

    if (phosphoproteinTable) {
      let label = `${cancer}_phosphoprotein_data`;
      let sql = phosphoproteinDataTemplate({
        sourceTable: phosphoproteinTable,
        tempTable: `${phosphoproteinTable}_temp`,
        cancerId,
      });
      sqlStatements.push({ label, sql });
    }

    if (proteinSinglePoolTable) {
      let label = `${cancer}_protein_single_pool_data`;
      let sql = proteinSinglePoolDataTemplate({
        sourceTable: proteinSinglePoolTable,
        tempTable: `${proteinSinglePoolTable}_temp`,
        cancerId,
      });
      sqlStatements.push({ label, sql });
    }

    if (phosphoproteinSinglePoolTable) {
      let label = `${cancer}_phosphoprotein_single_pool_data`;
      let sql = phosphoproteinSinglePoolDataTemplate({
        sourceTable: phosphoproteinSinglePoolTable,
        tempTable: `${phosphoproteinSinglePoolTable}_temp`,
        cancerId,
      });
      sqlStatements.push({ label, sql });
    }

    if (rnaTable) {
      let label = `${cancer}_rna_data`;
      let sql = rnaDataTemplate({
        sourceTable: rnaTable,
        tempTable: `${rnaTable}_temp`,
        cancerId,
      });
      sqlStatements.push({ label, sql });
    }

    if (tcgaRnaTable) {
      let label = `${cancer}_tcga_rna_data`;
      let sql = tcgaRnaDataTemplate({
        sourceTable: tcgaRnaTable,
        tempTable: `${tcgaRnaTable}_temp`,
        cancerId,
      });
      sqlStatements.push({ label, sql });
    }
  }

  return sqlStatements;
}

module.exports = { exportData };
