/**
 * 错误边界组件
 * 捕获React组件树中的JavaScript错误，防止白屏问题
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Button,
  MessageBar,
  tokens,
} from '@fluentui/react-components';
import {
  ErrorCircle24Regular,
  ArrowClockwise24Regular,
  Bug24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  errorCard: {
    maxWidth: '600px',
    width: '100%',
  },
  content: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    textAlign: 'center',
  },
  icon: {
    fontSize: '48px',
    color: tokens.colorPaletteRedForeground1,
    margin: '0 auto 16px auto',
  },
  errorDetails: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: '12px',
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    textAlign: 'left',
    maxHeight: '200px',
    overflow: 'auto',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginTop: '16px',
  },
});

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 更新state以显示错误UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary捕获到错误:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 保存错误信息到本地存储以便调试
    try {
      const errorData = {
        timestamp: new Date().toISOString(),
        errorId: this.state.errorId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      
      localStorage.setItem(`hout_error_${this.state.errorId}`, JSON.stringify(errorData));
    } catch (storageError) {
      console.warn('无法保存错误信息到本地存储:', storageError);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    const errorReport = {
      errorId,
      timestamp: new Date().toISOString(),
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : null,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // 复制错误报告到剪贴板
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2)).then(() => {
      alert('错误报告已复制到剪贴板');
    }).catch(() => {
      // 如果剪贴板API不可用，显示错误信息
      const reportWindow = window.open('', '_blank');
      if (reportWindow) {
        reportWindow.document.write(`
          <html>
            <head><title>错误报告</title></head>
            <body>
              <h1>HOUT 错误报告</h1>
              <pre>${JSON.stringify(errorReport, null, 2)}</pre>
            </body>
          </html>
        `);
      }
    });
  };

  render() {
    if (this.state.hasError) {
      const styles = useStyles();
      
      return (
        <div className={styles.container}>
          <Card className={styles.errorCard}>
            <CardHeader
              header={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ErrorCircle24Regular style={{ color: tokens.colorPaletteRedForeground1 }} />
                  <Text size={500} weight="bold">应用程序遇到错误</Text>
                </div>
              }
            />
            
            <CardPreview>
              <div className={styles.content}>
                <ErrorCircle24Regular className={styles.icon} />
                
                <Text size={400}>
                  很抱歉，HOUT工具箱遇到了一个意外错误。这可能是由于以下原因造成的：
                </Text>

                <MessageBar intent="error">
                  <Text weight="semibold">错误ID: {this.state.errorId}</Text>
                </MessageBar>

                <ul style={{ textAlign: 'left', margin: '0', paddingLeft: '20px' }}>
                  <li>组件渲染过程中的JavaScript错误</li>
                  <li>网络连接问题</li>
                  <li>数据格式不兼容</li>
                  <li>浏览器兼容性问题</li>
                </ul>

                {this.state.error && (
                  <details>
                    <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                      <Text weight="semibold">查看错误详情</Text>
                    </summary>
                    <div className={styles.errorDetails}>
                      <Text size={200}>
                        <strong>错误类型:</strong> {this.state.error.name}
                      </Text>
                      <br />
                      <Text size={200}>
                        <strong>错误信息:</strong> {this.state.error.message}
                      </Text>
                      {this.state.error.stack && (
                        <>
                          <br />
                          <br />
                          <Text size={200}>
                            <strong>错误堆栈:</strong>
                          </Text>
                          <pre style={{ fontSize: '11px', margin: '4px 0' }}>
                            {this.state.error.stack}
                          </pre>
                        </>
                      )}
                    </div>
                  </details>
                )}

                <div className={styles.buttonGroup}>
                  <Button
                    appearance="primary"
                    icon={<ArrowClockwise24Regular />}
                    onClick={this.handleReload}
                  >
                    重新加载应用
                  </Button>
                  
                  <Button
                    appearance="secondary"
                    onClick={this.handleReset}
                  >
                    尝试恢复
                  </Button>
                  
                  <Button
                    appearance="outline"
                    icon={<Bug24Regular />}
                    onClick={this.handleReportError}
                  >
                    复制错误报告
                  </Button>
                </div>

                <MessageBar intent="info">
                  如果问题持续存在，请尝试清除浏览器缓存或联系技术支持。
                </MessageBar>
              </div>
            </CardPreview>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
