import React from 'react';
import { Button } from '@fluentui/react-components';
import { enhancedLogService } from '@/services/enhancedLogService';

/**
 * 示例组件：展示如何在其他页面记录用户操作日志
 * 
 * 使用方法：
 * 1. 导入 enhancedLogService
 * 2. 在用户操作事件中调用 enhancedLogService.logUserAction() 方法
 * 3. 日志会自动显示在 LogsPanel 中
 */
const ExampleComponent: React.FC = () => {
  // 示例1：记录按钮点击
  const handleButtonClick = () => {
    // 记录用户操作
    enhancedLogService.logUserAction("点击示例按钮", "ExampleComponent", {
      buttonId: "exampleButton",
      timestamp: new Date().toISOString()
    });
    
    // 执行按钮的实际功能...
    console.log("按钮被点击了");
  };

  // 示例2：记录表单提交
  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    // 获取表单数据
    const formData = new FormData(event.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    // 记录表单提交操作
    enhancedLogService.logUserAction("提交表单", "ExampleComponent", {
      formId: "exampleForm",
      formData: data, // 注意：敏感数据应该被过滤
      timestamp: new Date().toISOString()
    });
    
    // 执行表单提交逻辑...
    console.log("表单已提交:", data);
  };

  // 示例3：记录设置更改
  const handleSettingChange = (settingName: string, value: any) => {
    // 记录设置更改操作
    enhancedLogService.logUserAction(`更改设置: ${settingName}`, "ExampleComponent", {
      settingName,
      oldValue: "previousValue", // 实际应用中应该保存旧值
      newValue: value,
      timestamp: new Date().toISOString()
    });
    
    // 执行设置更改逻辑...
    console.log(`设置 ${settingName} 已更改为:`, value);
  };

  // 示例4：记录页面访问
  React.useEffect(() => {
    // 记录页面访问
    enhancedLogService.logUserAction("访问示例页面", "ExampleComponent", {
      pageUrl: window.location.pathname,
      timestamp: new Date().toISOString()
    });
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>用户操作日志记录示例</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>按钮点击示例</h3>
        <Button onClick={handleButtonClick}>点击我记录日志</Button>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          点击此按钮会记录一条用户操作日志，可在LogsPanel中查看
        </p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>表单提交示例</h3>
        <form onSubmit={handleFormSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '4px' }}>
              用户名:
            </label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              style={{ padding: '8px', width: '200px' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '4px' }}>
              邮箱:
            </label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              style={{ padding: '8px', width: '200px' }}
            />
          </div>
          <Button type="submit">提交表单</Button>
        </form>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          提交表单会记录表单数据到日志中
        </p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>设置更改示例</h3>
        <div style={{ marginBottom: '12px' }}>
          <label htmlFor="theme" style={{ display: 'block', marginBottom: '4px' }}>
            主题:
          </label>
          <select 
            id="theme" 
            onChange={(e) => handleSettingChange('theme', e.target.value)}
            style={{ padding: '8px', width: '200px' }}
          >
            <option value="light">浅色</option>
            <option value="dark">深色</option>
            <option value="auto">自动</option>
          </select>
        </div>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          更改主题会记录设置变更到日志中
        </p>
      </div>
      
      <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h4>使用说明：</h4>
        <ol style={{ paddingLeft: '20px', fontSize: '14px' }}>
          <li>在组件中导入 enhancedLogService</li>
          <li>在用户操作事件中调用 enhancedLogService.logUserAction() 方法</li>
          <li>提供操作描述、来源组件和相关上下文信息</li>
          <li>日志会自动显示在 LogsPanel 中</li>
        </ol>
        
        <h4 style={{ marginTop: '16px' }}>最佳实践：</h4>
        <ul style={{ paddingLeft: '20px', fontSize: '14px' }}>
          <li>为每个用户操作添加有意义的描述</li>
          <li>提供足够的上下文信息，但避免记录敏感数据</li>
          <li>在页面加载时记录页面访问</li>
          <li>在表单提交时记录表单数据</li>
          <li>在设置更改时记录新旧值</li>
        </ul>
      </div>
    </div>
  );
};

export default ExampleComponent;