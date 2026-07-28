// ============================================================
// Logger maison : Date Heure [NIVEAU] fichier:ligne - message
// ============================================================

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

interface CallerInfo {
  file: string;
  line: string;
}

// Codes ANSI natifs, aucune dépendance nécessaire
const COLORS = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  white: "\x1b[39m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
} as const;

const LEVEL_COLORS: Record<LogLevel, string> = {
  DEBUG: COLORS.gray,
  INFO: COLORS.white,
  WARN: COLORS.yellow,
  ERROR: COLORS.red,
};

/**
 * Récupère fichier + ligne de l'appelant réel, en sautant toutes
 * les frames internes à ce fichier logger.ts lui-même (peu importe
 * la profondeur d'appel : log() -> debug()/info()/... -> logger.ts).
 */
function getCallerInfo(): CallerInfo {
  const err = new Error();
  const stack = err.stack?.split("\n") ?? [];

  const callerLine = stack.slice(1).find((l) => !l.includes("logger.ts")) ?? "";

  // Format typique: "    at functionName (/path/to/file.ts:42:15)"
  const match = callerLine.match(/\(?([^()]+):(\d+):(\d+)\)?$/);
  if (!match) return { file: "unknown", line: "?" };

  const fullPath = match[1];
  const line = match[2];
  const file = fullPath?.split(/[\\/]/).pop() ?? fullPath;

  return { file: file ?? "<unknown>", line: line ?? "?" };
}

function formatDate(date: Date): string {
  const pad = (n: number, size = 2) => String(n).padStart(size, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

function log(level: LogLevel, message: string, ...args: unknown[]): void {
  const timestamp = formatDate(new Date());
  const { file, line } = getCallerInfo();
  const fileAndLine = `${file}:${line}`.padEnd(23, " ");
  const levelPadded = `[${level}]`.padEnd(7, " ");
  const color = LEVEL_COLORS[level];
  const prefix = `${COLORS.reset}${color}${timestamp} ${levelPadded} ${fileAndLine} `;

  switch (level) {
    case "ERROR":
      console.error(prefix, message, ...args);
      break;
    case "WARN":
      console.warn(prefix, message, ...args);
      break;
    default:
      console.log(prefix, message, ...args);
  }
}

export const logger = {
  debug: (message: string, ...args: unknown[]) =>
    log("DEBUG", message, ...args),
  info: (message: string, ...args: unknown[]) => log("INFO", message, ...args),
  warn: (message: string, ...args: unknown[]) => log("WARN", message, ...args),
  error: (message: string, ...args: unknown[]) =>
    log("ERROR", message, ...args),
};

// ============================================================
// Exemple d'utilisation
// ============================================================
// logger.info("Serveur démarré sur le port 3000");
// -> 2026-07-27 14:32:05 [INFO] server.ts:87 - Serveur démarré sur le port 3000
//
// logger.error("Échec de connexion à la base", err);
// -> 2026-07-27 14:32:06 [ERROR] db.ts:15 - Échec de connexion à la base
