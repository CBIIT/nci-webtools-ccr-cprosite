const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const parseCsv = require("csv-parse");

module.exports = {
  getTimestamp,
  readFileAsIterable,
  importTable,
};

function readFileAsIterable(filePath, headers) {
  switch (path.extname(filePath)) {
    case ".csv":
      return fs.createReadStream(filePath).pipe(
        parseCsv({
          delimiter: ",",
          columns: headers || true,
          skip_empty_lines: true,
          from_line: headers ? 2 : 1,
        }),
      );

    case ".tsv":
      return fs.createReadStream(filePath).pipe(
        parseCsv({
          delimiter: "\t",
          columns: headers || true,
          skip_empty_lines: true,
          from_line: headers ? 2 : 1,
        }),
      );

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

async function importTable(
  database,
  tableName,
  headers,
  rows,
  createTable = false,
) {
  if (createTable) {
    database.exec(
      `drop table if exists "${tableName}";
      create table "${tableName}" (
          ${headers.map((header) => `"${header}" text`).join(",")}
      );`,
    );
  }

  const placeholders = headers.map(() => "?").join(",");
  const insertStatement = database.prepare(
    `insert into "${tableName}" values (${placeholders})`,
  );

  database.exec("begin transaction");

  for await (const row of rows) {
    const values = headers
      .map((header) => row[header])
      .map((value) => (value === "" ? null : value));

    insertStatement.run(values);
  }

  database.exec("commit");
}

function getTimestamp(formatter = (v) => v.join(", ")) {
  const start = new Date().getTime();
  return function () {
    this.previous = this.now || new Date().getTime();
    this.now = new Date().getTime();
    return formatter([now - start, now - previous]);
  };
}
