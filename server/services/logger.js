const path = require("path");
const fs = require("fs");
const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");

const logConfig = {
  folder: process.env.LOG_FOLDER || "logs",
  level: process.env.LOG_LEVEL || "info",
};

function getLogger(name, config = logConfig) {
  const { folder, level } = config;
  fs.mkdirSync(folder, { recursive: true });

  return new createLogger({
    level: level || "info",
    format: format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.label({ label: name }),
      format.errors({ stack: true }),
      // always emit exactly one JSON line per event (message may be a string, array,
      // object, or Error) so log shippers (Fluent Bit/Datadog) never split one logical
      // event into multiple lines - JSON.stringify escapes embedded newlines instead
      // of printing them raw, unlike the previous util.format()-based formatter
      format.printf(({ label, timestamp, level, message, stack }) =>
        JSON.stringify({ label, pid: process.pid, timestamp, level, message: stack || message }),
      ),
    ),
    transports: [
      new transports.Console(),
      new transports.DailyRotateFile({
        filename: path.resolve(folder, `${name}-%DATE%.log`),
        datePattern: "YYYY-MM-DD-HH",
        zippedArchive: false,
        maxSize: "1024m",
        timestamp: true,
        maxFiles: "1d",
        prepend: true,
      }),
    ],
    exitOnError: false,
  });
}

module.exports = getLogger;
