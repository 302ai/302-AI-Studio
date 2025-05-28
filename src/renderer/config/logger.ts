import chalk from "chalk";
import log from "electron-log/renderer";

log.transports.console.level = "info";

const levelStyles = {
  info: { color: chalk.cyan, icon: "ℹ️" },
  debug: { color: chalk.gray, icon: "🐛" },
  warn: { color: chalk.yellow, icon: "⚠️" },
  error: { color: chalk.red, icon: "❌" },
  verbose: { color: chalk.magenta, icon: "🔍" },
};

log.transports.console.format = (msg) => {
  const style = levelStyles[msg.level] || { color: chalk.white, icon: "📄" };
  const timestamp = chalk.dim(`[${new Date().toLocaleTimeString()}]`);
  const level = style.color(`${style.icon} ${msg.level.toUpperCase()}`);
  return [timestamp, level, ...msg.data];
};

export const Logger = log;
