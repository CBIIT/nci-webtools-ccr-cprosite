const express = require("express");
const getLogger = require("./services/logger");
const forkCluster = require("./services/cluster");
const { logErrors } = require("./services/middleware");

const serverPort = Number(process.env.PORT || process.env.SERVER_PORT || 10000);
const clientPath = process.env.CLIENT_PATH || "../client/build";
const production = process.env.NODE_ENV === "production";
const logger = getLogger("cprosite");

if (forkCluster()) return;

const app = express();
app.locals.logger = logger;

app.use(logErrors);
app.use("/api", require("./services/api"));

// serve public folder during local development
if (!production && clientPath) app.use(express.static(clientPath));

app.listen(serverPort, () => {
  logger.info(`Application is running on port: ${serverPort}`);
});

module.exports = app;
