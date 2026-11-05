const express = require("express");
const getLogger = require("./services/logger");
const forkCluster = require("./services/cluster");
const { logErrors } = require("./services/middleware");

const serverPort = Number(process.env.PORT || process.env.SERVER_PORT || 10000);
const clientPath = process.env.CLIENT_PATH || "../client/build";
const production = process.env.NODE_ENV === "production";
const logger = getLogger("cprosite");

// route any error that bypasses express (uncaught exceptions/unhandled
// rejections) through the JSON logger instead of Node's raw multi-line
// stderr stack trace, so log shippers never split one event into many lines
process.on("uncaughtException", (error) => logger.error(error));
process.on("unhandledRejection", (error) => logger.error(error));

if (forkCluster()) return;

const app = express();
app.locals.logger = logger;

// backend is only reachable via the frontend httpd container on the docker
// network (see docker/httpd-cprosite.conf), so trust that single proxy hop;
// this also stops express-rate-limit's X-Forwarded-For ValidationError
app.set("trust proxy", 1);

app.use(logErrors);
app.use("/api", require("./services/api"));

// serve public folder during local development
if (!production && clientPath) app.use(express.static(clientPath));

app.listen(serverPort, () => {
  logger.info(`Application is running on port: ${serverPort}`);
});

module.exports = app;
