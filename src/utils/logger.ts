/**
 * Hyper Designer 统一日志工具
 * 
 * 提供统一的日志格式：[hyper-designer:模块名:日志级别] 消息内容 [上下文信息]
 * 
 * 日志级别定义：
 * - DEBUG: 详细调试信息，开发时使用
 * - INFO: 重要操作信息，用户应了解
 * - WARN: 警告信息，不影响功能但需要注意
 * - ERROR: 错误信息，需要立即处理
 */

/**
 * 日志上下文信息接口
 */
export interface LogContext {
  [key: string]: any;
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
   * 格式化上下文信息为字符串
   * @param context 上下文信息对象
   * @returns 格式化后的上下文字符串
   */
  private static formatContext(context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) {
      return '';
    }

    const parts: string[] = [];
    for (const [key, value] of Object.entries(context)) {
      if (value !== undefined && value !== null) {
        parts.push(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
      }
    }

    return parts.length > 0 ? ` [${parts.join(', ')}]` : '';
  }

  /**
   * 输出 DEBUG 级别日志
   * @param module 模块名称
   * @param message 日志消息
   * @param context 上下文信息（可选）
   */
  static debug(module: string, message: string, context?: LogContext): void {
    if (!this.debugEnabled) return;
    
    const contextStr = this.formatContext(context);
    console.debug(`[hyper-designer:${module}:DEBUG] ${message}${contextStr}`);
  }

  /**
   * 输出 INFO 级别日志
   * @param module 模块名称
   * @param message 日志消息
   * @param context 上下文信息（可选）
   */
  static info(module: string, message: string, context?: LogContext): void {
    const contextStr = this.formatContext(context);
    console.info(`[hyper-designer:${module}:INFO] ${message}${contextStr}`);
  }

  /**
   * 输出 WARN 级别日志
   * @param module 模块名称
   * @param message 日志消息
   * @param context 上下文信息（可选）
   */
  static warn(module: string, message: string, context?: LogContext): void {
    const contextStr = this.formatContext(context);
    console.warn(`[hyper-designer:${module}:WARN] ${message}${contextStr}`);
  }

  /**
   * 输出 ERROR 级别日志
   * @param module 模块名称
   * @param message 日志消息
   * @param error 错误对象（可选）
   * @param context 上下文信息（可选）
   */
  static error(module: string, message: string, error?: Error, context?: LogContext): void {
    const contextWithError: LogContext = { ...context };
    
    if (error) {
      contextWithError.error = error.message;
      if (error.stack) {
        contextWithError.stack = error.stack.split('\n').slice(0, 3).join(' | ');
      }
    }

    const contextStr = this.formatContext(contextWithError);
    console.error(`[hyper-designer:${module}:ERROR] ${message}${contextStr}`);
  }

  /**
   * 创建模块特定的日志器
   * @param module 模块名称
   * @returns 模块特定的日志函数对象
   */
  static forModule(module: string) {
    return {
      debug: (message: string, context?: LogContext) => this.debug(module, message, context),
      info: (message: string, context?: LogContext) => this.info(module, message, context),
      warn: (message: string, context?: LogContext) => this.warn(module, message, context),
      error: (message: string, error?: Error, context?: LogContext) => this.error(module, message, error, context),
    };
  }
}