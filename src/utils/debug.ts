import { appendFileSync, existsSync, mkdirSync } from "fs"
import { join, dirname } from "path"

const DEBUG_LOG_PATH = join(process.cwd(), ".hyper-designer", "debug.log")

// Check if debug mode is enabled via environment variable
const isDebugEnabled = (): boolean => {
  return process.env.HYPER_DESIGNER_DEBUG === "1" || 
         process.env.HYPER_DESIGNER_DEBUG === "true" ||
         process.env.DEBUG === "hyper-designer" ||
         process.env.DEBUG === "*"
}

// Ensure log directory exists (only called when actually writing)
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

// Format data for logging
const formatData = (data: unknown): string => {
  if (data === undefined) return ""
  if (typeof data === "string") return ` ${data}`
  try {
    return ` ${JSON.stringify(data, null, 2)}`
  } catch {
    return ` [Unable to serialize data]`
  }
}

/**
 * Debug logger for hyper-designer plugin
 * 
 * To enable debug logging, set one of these environment variables:
 * - HYPER_DESIGNER_DEBUG=1
 * - HYPER_DESIGNER_DEBUG=true
 * - DEBUG=hyper-designer
 * - DEBUG=*
 * 
 * Logs are written to: .hyper-designer/debug.log
 */
export const debug = {
  /**
   * Log a debug message
   * @param message - The message to log
   * @param data - Optional data to include (will be JSON serialized)
   */
  log(message: string, data?: unknown): void {
    if (!isDebugEnabled()) return
    if (!ensureLogDirectory()) return

    const timestamp = new Date().toISOString()
    const logLine = `[${timestamp}] [DEBUG] ${message}${formatData(data)}\n`

    try {
      appendFileSync(DEBUG_LOG_PATH, logLine)
    } catch {
      // Silently ignore write errors
    }
  },

  /**
   * Log an info message
   */
  info(message: string, data?: unknown): void {
    if (!isDebugEnabled()) return
    if (!ensureLogDirectory()) return

    const timestamp = new Date().toISOString()
    const logLine = `[${timestamp}] [INFO] ${message}${formatData(data)}\n`

    try {
      appendFileSync(DEBUG_LOG_PATH, logLine)
    } catch {
      // Silently ignore write errors
    }
  },

  /**
   * Log a warning message
   */
  warn(message: string, data?: unknown): void {
    if (!isDebugEnabled()) return
    if (!ensureLogDirectory()) return

    const timestamp = new Date().toISOString()
    const logLine = `[${timestamp}] [WARN] ${message}${formatData(data)}\n`

    try {
      appendFileSync(DEBUG_LOG_PATH, logLine)
    } catch {
      // Silently ignore write errors
    }
  },

  /**
   * Log an error message
   */
  error(message: string, data?: unknown): void {
    if (!isDebugEnabled()) return
    if (!ensureLogDirectory()) return

    const timestamp = new Date().toISOString()
    const logLine = `[${timestamp}] [ERROR] ${message}${formatData(data)}\n`

    try {
      appendFileSync(DEBUG_LOG_PATH, logLine)
    } catch {
      // Silently ignore write errors
    }
  },

  /**
   * Check if debug mode is currently enabled
   */
  isEnabled(): boolean {
    return isDebugEnabled()
  },

  /**
   * Get the log file path
   */
  getLogPath(): string {
    return DEBUG_LOG_PATH
  }
}

export default debug
