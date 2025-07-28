export interface ErrorInfo {
  title: string;
  message: string;
  suggestions?: string[];
  actionable?: boolean;
  retryable?: boolean;
}

export class ErrorHandler {
  static parseError(error: unknown): ErrorInfo {
    const errorStr = String(error);

    return {
      title: "操作失败",
      message: errorStr,
      suggestions: [
        "检查设备连接状态",
        "重试操作",
        "查看详细错误信息"
      ],
      actionable: true,
      retryable: true
    };
  }

  static handleError(error: unknown, context?: string): ErrorInfo {
    const errorInfo = this.parseError(error);

    if (context) {
      errorInfo.message = context + ": " + errorInfo.message;
    }

    return errorInfo;
  }

  static showErrorDialog(error: unknown, context?: string): ErrorInfo {
    const errorInfo = this.parseError(error);

    if (context) {
      errorInfo.message = context + ": " + errorInfo.message;
    }

    return errorInfo;
  }
}

export default ErrorHandler;