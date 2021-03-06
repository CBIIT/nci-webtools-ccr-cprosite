const express = require("express");
const compression = require("compression");
const sqlite = require("better-sqlite3");
const config = require("../config");
const { logRequests, publicCacheControl, withAsync } = require("./middleware");
const { query } = require("./query");

const database = new sqlite(config.database);

const lookup = {
  cancer: database.prepare("select id, name from cancer order by name").all(),
  gene: database.prepare("select id, name from gene order by name").all(),
};

const router = express.Router();
router.use(express.json());
router.use(compression());
router.use(logRequests());
router.use(publicCacheControl(60 * 60));

router.get("/ping", (request, response) => {
  response.json(1 === database.prepare(`select 1`).pluck().get());
});

router.get("/lookup", (request, response) => {
  response.json(lookup);
});

router.get("/query", (request, response) => {
  response.json(query(database, request.query));
});

module.exports = router;
