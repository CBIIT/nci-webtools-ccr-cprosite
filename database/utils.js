const http = require("http");
const https = require("https");
const fs = require("fs");
const fsp = require("fs/promises");
const readline = require("readline");
const path = require("path");
const xlsx = require("xlsx");
const AWS = require("aws-sdk");
const parseCsv = require("csv-parse");
const config = require("./config.json");

if (config.aws) {
  AWS.config.update(config.aws);
}

module.exports = {
  getTimestamp,
  downloadFile,
  readFileAsIterable,
  importTable,
  importSourceTables,
  importDynamoDBTable,
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

async function getFileHeaders(filePath) {
  let headerRows;
  switch (path.extname(filePath)) {
    case ".csv":
      headerRows = fs.createReadStream(filePath).pipe(
        parseCsv({
          delimiter: ",",
          to_line: 1,
        }),
      );

      for await (const row of headerRows) {
        return row;
      }

    case ".tsv":
      headerRows = fs.createReadStream(filePath).pipe(
        parseCsv({
          delimiter: "\t",
          to_line: 1,
        }),
      );

      for await (const row of headerRows) {
        return row;
      }

    case ".xlsx":
      const workbook = xlsx.readFile(filePath);
      const [sheetName] = workbook.SheetNames; // first sheet
      return Object.keys(
        xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
          header: headers,
        })[0],
      );

    default:
      return [];
  }
}

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

async function importTable(database, tableName, headers, rowIterator) {
  database.exec(
    `drop table if exists "${tableName}";
    create table "${tableName}" (
        ${headers.map((header) => `"${header}" text`).join(",")}
    );`,
  );

  const placeholders = headers.map((header) => "?").join(",");
  const insertStatement = database.prepare(
    `insert into "${tableName}" values (${placeholders})`,
  );

  database.exec("begin transaction");

  for await (const row of rowIterator) {
    const values = headers
      .map((header) => row[header])
      .map((value) => (value === "" ? null : value));

    insertStatement.run(values);
  }

  database.exec("commit");
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
    const headers = file.headers || (await getFileHeaders(file.filePath));
    const rows = readFileAsIterable(filePath, file.headers);
    await importTable(db, file.table, Array.from(headers), rows);
  }
}

async function importDynamoDBTable(service, tableName, data) {
  const documentClient = new AWS.DynamoDB.DocumentClient({ service });
  const insertBatch = async (batch) => {
    if (!batch.length) return;
    const { UnprocessedItems: unprocessedItems } = await documentClient
      .batchWrite({
        RequestItems: {
          [tableName]: batch.map((Item) => ({
            PutRequest: { Item },
          })),
        },
      })
      .promise();

    if (unprocessedItems && unprocessedItems.length) {
      await sleep(400);
      console.log(
        `WARNING: batch write did not succeed, retrying: ${unprocessedItems}`,
      );
      await insertBatch(unprocessedItems);
    }
  };

  const maxBufferSize = 25;
  const maxParallelBuffers = 40;
  let buffer = [];
  let parallelBuffers = [];
  let count = 0;

  for (const item of data) {
    buffer.push(item);
    count++;
    if (buffer.length >= maxBufferSize) {
      const bufferItems = buffer.splice(0, buffer.length);
      parallelBuffers.push(bufferItems);

      if (parallelBuffers.length >= maxParallelBuffers) {
        await Promise.all(parallelBuffers.map(insertBatch));
        parallelBuffers.splice(0, parallelBuffers.length);
        console.log(`Inserted ${count} records`);
      }
    }
  }

  // insert last batches
  parallelBuffers.push(buffer);
  count += parallelBuffers.reduce((acc, curr) => (acc += curr.length), 0);
  await Promise.all(parallelBuffers.map(insertBatch));
  console.log(`Inserted ${count} records`);
}

function getTimestamp(formatter = (v) => v.join(", ")) {
  const start = new Date().getTime();
  return function () {
    this.previous = this.now || new Date().getTime();
    this.now = new Date().getTime();
    return formatter([now - start, now - previous]);
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
