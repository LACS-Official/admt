import React, { useState } from 'react';
import { consoleLogger, installConsoleWrapper, restoreConsole } from '@/utils/consoleLogger';
import { enhancedLogService } from '@/services/enhancedLogService';
import {
  Button,
  Card,
  CardHeader,
  Divider,
  Switch,
  Text,
  Input,
  Field,
  Textarea
} from "@fluentui/react-components";
import {
  Document24Regular,
  Warning24Regular,
  ErrorCircle24Regular,
  Info24Regular,
  Bug24Regular,
} from "@fluentui/react-icons";

/**
 * ConsoleLogger示例组件
 * 
 * 这个组件展示了如何使用consoleLogger将系统级别的日志记录与日志管理系统集成
 */
export const ConsoleLoggerExample: React.FC = () => {
  const [message, setMessage] = useState('这是一条测试日志消息');
  const [logLevel, setLogLevel] = useState<'info' | 'debug' | 'warn' | 'error'>('info');
  const [customSource, setCustomSource] = useState('ConsoleLoggerExample');
  const [customData, setCustomData] = useState('{ "key": "value" }');
  const [isConsoleWrapped, setIsConsoleWrapped] = useState(false);
  const [directConsoleMessage, setDirectConsoleMessage] = useState('直接使用console.log的测试消息');

  // 创建带有自定义上下文的日志记录器
  const customLogger = consoleLogger.withContext(customSource, 'example');

  // 处理日志记录
  const handleLog = () => {
    try {
      // 解析自定义数据
      const data = customData ? JSON.parse(customData) : undefined;
      
      // 根据选择的日志级别记录日志
      switch (logLevel) {
        case 'info':
          customLogger.info(message, data);
          break;
        case 'debug':
          customLogger.debug(message, data);
          break;
        case 'warn':
          customLogger.warn(message, data);
          break;
        case 'error':
          customLogger.error(message, data);
          break;
      }
    } catch (error) {
      consoleLogger.error('解析自定义数据失败', error);
    }
  };

  // 处理用户操作日志记录
  const handleUserAction = () => {
    customLogger.userAction('点击了用户操作日志按钮', { 
      buttonName: 'logUserAction',
      timestamp: new Date().toISOString() 
    });
  };

  // 处理console包装器
  const toggleConsoleWrapper = () => {
    if (isConsoleWrapped) {
      restoreConsole();
      setIsConsoleWrapped(false);
    } else {
      installConsoleWrapper('GlobalConsole', 'system');
      setIsConsoleWrapped(true);
    }
  };

  // 处理直接console调用
  const handleDirectConsole = () => {
    if (directConsoleMessage) {
      console.log(directConsoleMessage);
    }
  };

  // 清空日志
  const handleClearLogs = async () => {
    try {
      await enhancedLogService.clearLogs();
      customLogger.info('日志已清空');
    } catch (error) {
      customLogger.error('清空日志失败', error);
    }
  };

  return (
    <Card style={{ maxWidth: 800, margin: '20px auto' }}>
      <CardHeader
        header={
          <Text size={500} weight="semibold">
            ConsoleLogger 示例
          </Text>
        }
      />
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <Text>
          这个示例展示了如何使用consoleLogger将系统级别的日志记录与日志管理系统集成。
          所有的日志会同时输出到控制台和LogsPanel中。
        </Text>

        <Divider />

        {/* 基本日志记录 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Text size={400} weight="semibold">基本日志记录</Text>
          <Field label="日志消息">
            <Input
              value={message}
              onChange={(e, data) => setMessage(data.value)}
            />
          </Field>
          <Field label="日志来源">
            <Input
              value={customSource}
              onChange={(e, data) => setCustomSource(data.value)}
            />
          </Field>
          <Field label="自定义数据 (JSON格式)">
            <Textarea
              value={customData}
              onChange={(e, data) => setCustomData(data.value)}
              rows={3}
            />
          </Field>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              appearance={logLevel === 'info' ? 'primary' : 'secondary'}
              onClick={() => setLogLevel('info')}
            >
              Info
            </Button>
            <Button
              appearance={logLevel === 'debug' ? 'primary' : 'secondary'}
              onClick={() => setLogLevel('debug')}
            >
              Debug
            </Button>
            <Button
              appearance={logLevel === 'warn' ? 'primary' : 'secondary'}
              onClick={() => setLogLevel('warn')}
            >
              Warn
            </Button>
            <Button
              appearance={logLevel === 'error' ? 'primary' : 'secondary'}
              onClick={() => setLogLevel('error')}
            >
              Error
            </Button>
            <Button onClick={handleLog} appearance="primary">
              记录日志
            </Button>
          </div>
        </div>

        <Divider />

        {/* 用户操作日志 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Text size={400} weight="semibold">用户操作日志</Text>
          <Text>
            用户操作日志会以"user"分类记录，并显示在LogsPanel中。
          </Text>
          <Button onClick={handleUserAction} appearance="primary">
            记录用户操作
          </Button>
        </div>

        <Divider />

        {/* Console包装器 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Text size={400} weight="semibold">Console包装器</Text>
          <Text>
            启用Console包装器后，所有的console.log、console.error等调用会自动同时输出到控制台和LogsPanel。
          </Text>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Switch
              label="启用Console包装器"
              checked={isConsoleWrapped}
              onChange={toggleConsoleWrapper}
            />
            <Text>{isConsoleWrapped ? '已启用' : '已禁用'}</Text>
          </div>
          <Field label="Console消息">
            <Input
              value={directConsoleMessage}
              onChange={(e, data) => setDirectConsoleMessage(data.value)}
            />
          </Field>
          <Button 
            onClick={handleDirectConsole} 
            appearance="primary"
            disabled={!isConsoleWrapped}
          >
            使用console.log
          </Button>
        </div>

        <Divider />

        {/* 其他操作 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Text size={400} weight="semibold">其他操作</Text>
          <Button onClick={handleClearLogs} appearance="secondary">
            清空日志
          </Button>
        </div>

        <Divider />

        {/* 使用说明 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Text size={400} weight="semibold">使用说明</Text>
          <Text>
            1. 基本使用：直接替换console.log为consoleLogger.log
          </Text>
          <Text>
            2. 带上下文：使用consoleLogger.withContext('组件名')创建带上下文的记录器
          </Text>
          <Text>
            3. 用户操作：使用consoleLogger.userAction记录用户操作
          </Text>
          <Text>
            4. 全局包装：调用installConsoleWrapper()包装全局console对象
          </Text>
        </div>
      </div>
    </Card>
  );
};