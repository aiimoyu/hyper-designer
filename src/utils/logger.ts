/**
 * Hyper Designer 统一日志工具
 *
 * 提供统一的日志格式：[hyper-designer:模块名:日志级别] 消息内容 [上下文信息]
 *
 * 特性：
 * - 日志写入文件，避免污染stdout（保护TUI显示）
 * - 支持日志级别控制
 * - 支持模块化日志器
 *
 * 日志级别定义：
 * - DEBUG: 详细调试信息，开发时使用
 * - INFO: 重要操作信息，用户应了解
 * - WARN: 警告信息，不影响功能但需要注意
 * - ERROR: 错误信息，需要立即处理
 */

import { existsSync, mkdirSync, appendFileSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * 日志级别
 */
export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

/**
 * 日志上下文信息接口
 */
export interface LogContext {
  [key: string]: any;
}

/**
 * 日志选项
 */
export interface LogOptions {
  /** 是否输出到stderr（调试用，默认false） */
  print?: boolean;
  /** 日志级别 */
  level?: LogLevel;
  /** 日志文件目录 */
  logDir?: string;
}

// 日志级别优先级
const levelPriority: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// 全局状态
let currentLevel: LogLevel = "INFO";
let printToStderr = false;
let logFilePath: string | null = null;
let lastTimestamp = Date.now();
let initialized = false;

function getDefaultLevelFromEnv(): LogLevel {
  const envLevel = process.env.HYPER_DESIGNER_LOG_LEVEL || process.env.LOG_LEVEL;
  if (envLevel) {
    const upper = envLevel.toUpperCase();
    if (["DEBUG", "INFO", "WARN", "ERROR"].includes(upper)) {
      return upper as LogLevel;
    }
  }
  return "INFO";
}

function getPrintFromEnv(): boolean {
  return process.env.HYPER_DESIGNER_LOG_PRINT === "true" || process.env.LOG_PRINT === "true";
}

/**
 * 确保日志目录存在
 */
function ensureLogDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * 获取日志文件路径
 */
function getLogFilePath(logDir: string): string {
  const timestamp = new Date().toISOString().split(".")[0].replace(/:/g, "");
  return join(logDir, `${timestamp}.log`);
}

/**
 * 格式化错误信息
 */
function formatError(error: Error, depth = 0): string {
  if (depth >= 10) return "...";
  const cause =
    error.cause instanceof Error
      ? " Caused by: " + formatError(error.cause, depth + 1)
      : "";
  return error.message + cause;
}

/**
 * 格式化日志消息
 */
function formatLogMessage(
  level: LogLevel,
  module: string,
  message: string,
  context?: LogContext
): string {
  const now = new Date();
  const diff = now.getTime() - lastTimestamp;
  lastTimestamp = now.getTime();

  // 格式化上下文
  const contextParts: string[] = [];
  if (context && Object.keys(context).length > 0) {
    for (const [key, value] of Object.entries(context)) {
      if (value !== undefined && value !== null) {
        if (value instanceof Error) {
          contextParts.push(`${key}=${formatError(value)}`);
        } else if (typeof value === "object") {
          contextParts.push(`${key}=${JSON.stringify(value)}`);
        } else {
          contextParts.push(`${key}=${value}`);
        }
      }
    }
  }

  const contextStr = contextParts.length > 0 ? " " + contextParts.join(" ") : "";

  return `${now.toISOString().split(".")[0]} +${diff}ms [hyper-designer:${module}:${level}] ${message}${contextStr}\n`;
}

/**
 * 写入日志
 */
function writeLog(_level: LogLevel, formattedMessage: string): void {
  if (!initialized) {
    initLogger();
  }

  if (logFilePath) {
    try {
      appendFileSync(logFilePath, formattedMessage);
    } catch {
      // 文件写入失败时静默处理
    }
  }

  if (printToStderr) {
    process.stderr.write(formattedMessage);
  }
}

/**
 * 检查是否应该记录该级别日志
 */
function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[currentLevel];
}

/**
 * 初始化日志系统
 */
export function initLogger(options: LogOptions = {}): void {
  if (initialized) return;

  currentLevel = options.level ?? getDefaultLevelFromEnv();
  printToStderr = options.print ?? getPrintFromEnv();

  const logDir = options.logDir || join(process.cwd(), ".hyper-designer", "logs");
  ensureLogDir(logDir);
  logFilePath = getLogFilePath(logDir);

  try {
    writeFileSync(logFilePath, "");
    initialized = true;
  } catch {
    logFilePath = null;
  }
}

/**
 * 获取当前日志文件路径
 */
export function getCurrentLogFilePath(): string | null {
  return logFilePath;
}

/**
 * Hyper Designer 统一日志类
 */
export class HyperDesignerLogger {
  /**
   * 是否启用调试日志
   * 在生产环境中可设置为 false 以减少日志输出
   */
  private static debugEnabled = true;

  /**
   * 设置调试日志启用状态
   * @param enabled 是否启用调试日志
   */
  static setDebugEnabled(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  /**
   * 设置日志级别
   * @param level 日志级别
   */
  static setLevel(level: LogLevel): void {
    currentLevel = level;
  }

  /**
   * 设置是否输出到stderr
   * @param print 是否输出
   */
  static setPrint(print: boolean): void {
    printToStderr = print;
  }

  /**
   * 输出 DEBUG 级别日志
   * @param module 模块名称
   * @param message 日志消息
   * @param context 上下文信息（可选）
   */
  static debug(module: string, message: string, context?: LogContext): void {
    if (!this.debugEnabled) return;
    if (!shouldLog("DEBUG")) return;

    const formatted = formatLogMessage("DEBUG", module, message, context);
    writeLog("DEBUG", formatted);
  }

  /**
   * 输出 INFO 级别日志
   * @param module 模块名称
   * @param message 日志消息
   * @param context 上下文信息（可选）
   */
  static info(module: string, message: string, context?: LogContext): void {
    if (!shouldLog("INFO")) return;

    const formatted = formatLogMessage("INFO", module, message, context);
    writeLog("INFO", formatted);
  }

  /**
   * 输出 WARN 级别日志
   * @param module 模块名称
   * @param message 日志消息
   * @param context 上下文信息（可选）
   */
  static warn(module: string, message: string, context?: LogContext): void {
    if (!shouldLog("WARN")) return;

    const formatted = formatLogMessage("WARN", module, message, context);
    writeLog("WARN", formatted);
  }

  /**
   * 输出 ERROR 级别日志
   * @param module 模块名称
   * @param message 日志消息
   * @param error 错误对象（可选）
   * @param context 上下文信息（可选）
   */
  static error(
    module: string,
    message: string,
    error?: Error,
    context?: LogContext
  ): void {
    if (!shouldLog("ERROR")) return;

    const contextWithError: LogContext = { ...context };

    if (error) {
      contextWithError.error = error.message;
      if (error.stack) {
        contextWithError.stack = error.stack.split("\n").slice(0, 3).join(" | ");
      }
    }

    const formatted = formatLogMessage("ERROR", module, message, contextWithError);
    writeLog("ERROR", formatted);
  }

  /**
   * 创建模块特定的日志器
   * @param module 模块名称
   * @returns 模块特定的日志函数对象
   */
  static forModule(module: string) {
    return {
      debug: (message: string, context?: LogContext) =>
        this.debug(module, message, context),
      info: (message: string, context?: LogContext) =>
        this.info(module, message, context),
      warn: (message: string, context?: LogContext) =>
        this.warn(module, message, context),
      error: (message: string, error?: Error, context?: LogContext) =>
        this.error(module, message, error, context),
    };
  }
}