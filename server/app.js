const express = require("express");
const config = require("./config.json");
const getLogger = require("./services/logger");
const forkCluster = require("./services/cluster");
const { logErrors } = require("./services/middleware");
const production = process.env.NODE_ENV === "production";
const logger = getLogger("cprosite");

if (forkCluster()) return;

const app = express();
app.locals.logger = logger;

app.use(logErrors);
app.use("/api", require("./services/api"));

// serve public folder during local development
if (!production && config.server.client) app.use(express.static(config.server.client));

app.listen(config.server.port, () => {
  logger.info(`Application is running on port: ${config.server.port}`);
});

module.exports = app;
