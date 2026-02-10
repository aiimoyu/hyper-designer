import { appendFileSync, existsSync, mkdirSync } from "fs"
import { join, dirname } from "path"

const DEBUG_LOG_PATH = join(process.cwd(), ".hyper-designer", "debug.log")

const isDebugEnabled = (): boolean => {
  return process.env.HYPER_DESIGNER_DEBUG === "1" || 
         process.env.HYPER_DESIGNER_DEBUG === "true" ||
         process.env.DEBUG === "hyper-designer" ||
         process.env.DEBUG === "*"
}

const ensureLogDirectory = (): boolean => {
  try {
    const dir = dirname(DEBUG_LOG_PATH)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    return true
  } catch {
    return false
  }
}

const formatData = (data: unknown): string => {
  if (data === undefined) return ""
  if (typeof data === "string") return ` ${data}`
  try {
    return ` ${JSON.stringify(data, null, 2)}`
  } catch {
    return ` [Unable to serialize data]`
  }
}

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR"

function writeLog(level: LogLevel, message: string, data?: unknown): void {
  if (!isDebugEnabled()) return
  if (!ensureLogDirectory()) return
  const timestamp = new Date().toISOString()
  const logLine = `[${timestamp}] [${level}] ${message}${formatData(data)}\n`
  try {
    appendFileSync(DEBUG_LOG_PATH, logLine)
  } catch {
    // Silently ignore write errors
  }
}

export const debug = {
  log: (message: string, data?: unknown) => writeLog("DEBUG", message, data),
  info: (message: string, data?: unknown) => writeLog("INFO", message, data),
  warn: (message: string, data?: unknown) => writeLog("WARN", message, data),
  error: (message: string, data?: unknown) => writeLog("ERROR", message, data),
  isEnabled: () => isDebugEnabled(),
  getLogPath: () => DEBUG_LOG_PATH,
}

export default debug
