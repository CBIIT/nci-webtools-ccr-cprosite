const http = require("http");
const https = require("https");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const xlsx = require("xlsx");
const parseCsv = require("csv-parse/lib/sync");

module.exports = {
  downloadFile,
  readFileAsArray,
  importTable,
  importSourceTables,
};

function downloadFile(url, filePath, requestOptions) {
  return new Promise((resolve, reject) => {
    if (!(url instanceof URL)) url = new URL(url);

    if (!fs.existsSync(path.dirname(filePath)))
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

    const writeStream = fs.createWriteStream(filePath);
    const lib = url.protocol === "https:" ? https : http;
    const handleError = async (error) => {
      await fs.promises.unlink(filePath);
      reject(error);
    };

    const request = lib.request(url.href, { ...requestOptions }, (response) => {
      response.on("error", handleError);
      response.pipe(writeStream);
    });

    writeStream.on("finish", (_) => writeStream.close(resolve));
    writeStream.on("error", handleError);

    request.on("timeout", (_) => request.destroy());
    request.on("error", handleError);

    if (requestOptions && requestOptions.body) {
      request.write(requestOptions.body);
    }

    request.end();
  });
}

async function readFileAsArray(filePath, headers) {
  switch (path.extname(filePath)) {
    case ".tsv":
      const contents = await fsp.readFile(filePath, "utf-8");
      return parseCsv(contents, {
        delimiter: "\t",
        columns: headers || true,
        skip_empty_lines: true,
      }).slice(headers ? 1 : 0);

    case ".xlsx":
      const workbook = xlsx.readFile(filePath);
      const [sheetName] = workbook.SheetNames;
      return xlsx.utils
        .sheet_to_json(workbook.Sheets[sheetName], { header: headers })
        .slice(headers ? 1 : 0);

    default:
      return [];
  }
}

function importTable(database, tableName, headers, rows) {
  database.exec(`
        drop table if exists "${tableName}";
        create temporary table "${tableName}" (
            ${headers.map((header) => `"${header}" text`).join(",")}
        );
    `);

  const placeholders = headers.map((header) => "?").join(",");
  const insertStatement = database.prepare(`
        insert into "${tableName}" values (${placeholders});
    `);

  const insertRows = database.transaction((rows) => {
    for (const row of rows) {
      const values = headers
        .map((header) => row[header])
        .map((value) => (value === "" ? null : value));

      insertStatement.run(values);
    }
  });

  insertRows(rows);
}

async function importSourceTables(db, source, force) {
  for (const file of source.files) {
    const filePath = path.resolve(__dirname, file.filePath);

    // download file if needed
    if (file.url && (force || !fs.existsSync(filePath))) {
      console.log(`downloading ${file.name} file to ${filePath}`);
      await downloadFile(file.url, filePath, file.requestOptions);
    }

    // import file to stage table
    console.log(`importing ${file.name} file to table: ${file.table}`);
    const rows = await readFileAsArray(filePath, file.headers);
    const headers = Object.keys(rows[0]);
    importTable(db, file.table, headers, rows);
  }
}
