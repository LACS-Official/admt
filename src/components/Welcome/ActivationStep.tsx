import React, { useState } from "react";
import {
  makeStyles,
  Text,
  Input,
  Button,
  Card,
  Spinner,
  Field,
  Tab,
  TabList,
  TabValue,
} from "@fluentui/react-components";
import {
  Key24Regular,
  Shield24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  Info24Regular,
  QuestionCircle24Regular,
} from "@fluentui/react-icons";
import { useWelcomeStore, useAppConfigStore } from "../../stores/welcomeStore";
import { invoke } from "@tauri-apps/api/core";
import { ActivationStatus } from "../../types/welcome";
import { activationService, ActivationValidationResult } from "../../services/activationService";
import UserConfigPreserver, { getPreservedUserConfig, clearPreservedUserConfig } from "../Common/UserConfigPreserver";
import ActivationStatusCard from "./ActivationStatusCard";
import ActivationHelp from "./ActivationHelp";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    padding: "16px",
  },
  header: {
    textAlign: "center",
    marginBottom: "16px",
  },
  icon: {
    fontSize: "48px",
    color: "var(--colorBrandBackground)",
    marginBottom: "16px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxWidth: "400px",
    margin: "0 auto",
    width: "100%",
  },
  activationInput: {
    fontFamily: "monospace",
    fontSize: "16px",
    textAlign: "center",
    textTransform: "uppercase",
  },
  validateButton: {
    alignSelf: "center",
  },
  statusCard: {
    padding: "16px",
    textAlign: "center",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  statusSuccess: {
    backgroundColor: "var(--colorPaletteGreenBackground1)",
    borderColor: "var(--colorPaletteGreenBorder1)" as any,
  },
  statusError: {
    backgroundColor: "var(--colorPaletteRedBackground1)",
    borderColor: "var(--colorPaletteRedBorder1)" as any,
  },
  statusIcon: {
    fontSize: "32px",
    marginBottom: "8px",
  },
  infoCard: {
    padding: "16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  infoTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  codeList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "12px",
  },
  codeItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "14px",
  },
  codeType: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
});

const ActivationStep: React.FC = () => {
  const styles = useStyles();
  const {
    activationCode,
    setActivationCode,
    activationStatus,
    setActivationStatus,
    setLoading,
    isLoading,
    nextStep,
  } = useWelcomeStore();

  const { setActivated, setConfig, config, isExpired } = useAppConfigStore();

  // 检查是否是重新激活（之前有激活码但已过期）
  const isReactivation = config.isActivated && isExpired();

  // 检查是否是过期后的重新激活
  const isExpiredReactivation = config.activationStatus === 'expired' ||
                                (config.expiryDate && new Date() > new Date(config.expiryDate));

  // 新增状态
  const [currentTab, setCurrentTab] = useState<TabValue>("activation");
  const [activationResponse, setActivationResponse] = useState<{
    expiryDate?: Date;
    features?: string[];
  } | null>(null);

  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    type?: 'format' | 'api' | 'network' | 'expired' | 'used';
    details?: string;
  } | null>(null);

  // 验证激活码格式
  const validateFormat = async (code: string) => {
    if (!code.trim()) {
      setValidationResult(null);
      return;
    }

    try {
      // 使用新的激活服务进行格式验证
      const result = await activationService.validateActivationCodeFormat(code);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: "格式验证失败",
        type: 'network',
        details: `验证过程中出现错误: ${error}`
      });
    }
  };

  // 处理激活码输入
  const handleActivationCodeChange = (value: string) => {
    // 根据新的API格式更新：{timestamp}-{random}-{uuid}
    const formattedValue = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setActivationCode(formattedValue);

    // 实时验证格式 - 新格式最小长度：1K2L3M4N-ABC123-DEF45678 (约20字符)
    if (formattedValue.length >= 15) {
      validateFormat(formattedValue);
    } else {
      setValidationResult(null);
    }
  };

  // 执行激活
  const handleActivate = async () => {
    if (!activationCode.trim()) return;

    setLoading(true);
    setActivationStatus(ActivationStatus.ACTIVATING);
    setValidationResult({
      isValid: true,
      message: "正在验证激活码，请稍候...",
      type: 'api'
    });

    try {
      // 使用新的激活服务
      const response = await activationService.activateApplication({
        activationCode: activationCode.trim(),
        userConfig: {
          username: 'HOUT用户',
          language: 'zh-CN',
          theme: 'light',
          autoStart: false,
          checkUpdates: true,
          enableTelemetry: false,
        },
        deviceInfo: {
          platform: 'Windows',
          version: '1.0.0',
          deviceId: 'device-' + Date.now(),
        },
      });

      if (response.success) {
        setActivationStatus(ActivationStatus.ACTIVATED);

        // 保存激活响应数据，优先使用API验证的过期时间
        let expiryDate: Date | undefined;
        if (response.apiValidation?.expiresAt) {
          expiryDate = new Date(response.apiValidation.expiresAt);
          console.log('ActivationStep: 使用API验证过期时间:', response.apiValidation.expiresAt);
        } else if (response.expiryDate) {
          expiryDate = new Date(response.expiryDate);
          console.log('ActivationStep: 使用响应过期时间:', response.expiryDate);
        }

        setActivationResponse({
          expiryDate,
          features: response.features
        });

        setValidationResult({
          isValid: true,
          message: response.message,
          type: 'api',
          details: response.features ? `已激活功能: ${response.features.join(', ')}` : undefined
        });

        // 更新全局应用配置状态，清除之前的过期状态
        setActivated(true);
        setConfig({
          isActivated: true,
          activationStatus: ActivationStatus.ACTIVATED,
          activationDate: new Date(),
          expiryDate: response.expiryDate ? new Date(response.expiryDate) : undefined,
          features: response.features || [],
          // 重置用户配置为当前配置
          userConfig: {
            username: 'HOUT用户',
            language: 'zh-CN',
            theme: 'light',
            autoStart: false,
            checkUpdates: true,
            enableTelemetry: false,
          },
        });

        // 切换到状态显示标签页
        setCurrentTab("status");

        // 延迟跳转到完成步骤，让用户看到成功消息
        setTimeout(() => {
          nextStep();
        }, 3000);
      } else {
        setActivationStatus(ActivationStatus.ACTIVATION_FAILED);

        // 根据错误消息类型提供更具体的错误处理
        let errorType: 'api' | 'expired' | 'used' | 'network' = 'api';
        let details = '';

        if (response.message.includes('已过期')) {
          errorType = 'expired';
          details = '请联系客服获取新的激活码';
        } else if (response.message.includes('已被使用') || response.message.includes('已使用')) {
          errorType = 'used';
          details = '每个激活码只能使用一次，请联系客服';
        } else if (response.message.includes('不存在') || response.message.includes('无效')) {
          errorType = 'api';
          details = '请检查激活码是否正确输入';
        } else if (response.message.includes('网络') || response.message.includes('连接')) {
          errorType = 'network';
          details = '请检查网络连接后重试';
        }

        setValidationResult({
          isValid: false,
          message: response.message,
          type: errorType,
          details: details
        });
      }
    } catch (error) {
      setActivationStatus(ActivationStatus.ACTIVATION_FAILED);
      setValidationResult({
        isValid: false,
        message: "激活过程中发生错误",
        type: 'network',
        details: `错误详情: ${error}`
      });
    } finally {
      setLoading(false);
    }
  };

  // 示例激活码（根据新API格式更新）
  const exampleCodes = [
    { code: "1K2L3M4N-ABC123-DEF45678", type: "演示版" },
    { code: "2M3N4O5P-XYZ789-GHI12345", type: "试用版" },
    { code: "3O5P6Q7R-RST456-JKL67890", type: "完整版" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Key24Regular className={styles.icon} />
        <Text size={600} weight="bold">
          {isExpiredReactivation ? '重新激活应用' :
           isReactivation ? '重新激活应用' : '激活应用'}
        </Text>
        <Text size={300} style={{ color: "var(--colorNeutralForeground2)", marginTop: "8px" }}>
          {isExpiredReactivation
            ? `您的激活码已过期，请输入新的激活码以继续使用完整功能。您的用户配置已保留。`
            : isReactivation
            ? `您的激活码已于 ${config.expiryDate ? new Date(config.expiryDate).toLocaleDateString('zh-CN') : '未知日期'} 过期，请输入新的激活码`
            : '请输入您的激活码以继续使用HOUT工具箱'
          }
        </Text>
      </div>

      {/* 标签页导航 */}
      <TabList selectedValue={currentTab} onTabSelect={(_, data) => setCurrentTab(data.value)}>
        <Tab value="activation" icon={<Key24Regular />}>
          激活码输入
        </Tab>
        <Tab value="status" icon={<Shield24Regular />} disabled={activationStatus !== ActivationStatus.ACTIVATED}>
          激活状态
        </Tab>
        <Tab value="help" icon={<QuestionCircle24Regular />}>
          帮助说明
        </Tab>
      </TabList>

      {/* 过期重新激活提示 */}
      {isExpiredReactivation && (
        <MessageBar intent="warning" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Warning24Regular />
            <Text>
              激活码已过期，但您的个人设置已保留。重新激活后将恢复所有功能。
            </Text>
          </div>
        </MessageBar>
      )}

      {/* 用户配置保留组件 */}
      <UserConfigPreserver
        onReactivateClick={() => {
          // 自动填充保留的用户配置
          const preservedConfig = getPreservedUserConfig();
          if (preservedConfig) {
            console.log('使用保留的用户配置进行激活:', preservedConfig);
          }
        }}
        onConfigRestored={(restoredConfig) => {
          console.log('用户配置已恢复:', restoredConfig);
        }}
      />

      {/* 标签页内容 */}
      {currentTab === "activation" && (
        <div className={styles.form}>
        <Field label="激活码" required>
          <Input
            className={styles.activationInput}
            placeholder="1K2L3M4N-ABC123-DEF45678"
            value={activationCode}
            onChange={(e) => handleActivationCodeChange(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
            data-form-type="other"
            data-lpignore="true"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
        </Field>

        {validationResult && (
          <Card className={`${styles.statusCard} ${validationResult.isValid ? styles.statusSuccess : styles.statusError}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {validationResult.isValid ? (
                <Checkmark24Regular className={styles.statusIcon} style={{ color: "var(--colorPaletteGreenForeground1)" }} />
              ) : (
                <Dismiss24Regular className={styles.statusIcon} style={{ color: "var(--colorPaletteRedForeground1)" }} />
              )}
              <div style={{ flex: 1 }}>
                <Text size={300} weight="semibold">
                  {validationResult.message}
                </Text>
                {validationResult.details && (
                  <Text size={200} style={{ color: "var(--colorNeutralForeground2)", marginTop: "4px", display: "block" }}>
                    {validationResult.details}
                  </Text>
                )}
              </div>
            </div>
          </Card>
        )}

        {activationStatus === ActivationStatus.ACTIVATING && (
          <Card className={styles.statusCard}>
            <Spinner size="medium" />
            <Text size={300} style={{ marginTop: "8px" }}>
              正在激活，请稍候...
            </Text>
          </Card>
        )}

        <Button
          appearance="primary"
          className={styles.validateButton}
          onClick={handleActivate}
          disabled={!activationCode.trim() || isLoading || (validationResult && !validationResult.isValid) || activationStatus === ActivationStatus.ACTIVATED}
          icon={isLoading ? <Spinner size="tiny" /> : <Shield24Regular />}
        >
          {activationStatus === ActivationStatus.ACTIVATED ? "已激活" :
           isLoading ? "激活中..." : "激活"}
        </Button>

        {/* 示例激活码信息 */}
        <Card className={styles.infoCard}>
          <div className={styles.infoTitle}>
            <Info24Regular style={{ color: "var(--colorBrandBackground)" }} />
            <Text size={300} weight="semibold">示例激活码</Text>
          </div>
          <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
            您可以使用以下示例激活码进行测试：
          </Text>
          <div className={styles.codeList}>
            {exampleCodes.map((item, index) => (
              <div key={index} className={styles.codeItem}>
                <span>{item.code}</span>
                <span className={styles.codeType}>{item.type}</span>
              </div>
            ))}
          </div>
        </Card>
        </div>
      )}

      {/* 激活状态标签页 */}
      {currentTab === "status" && (
        <div style={{ padding: "16px 0" }}>
          <ActivationStatusCard
            status={activationStatus}
            expiryDate={activationResponse?.expiryDate}
            features={activationResponse?.features}
          />
        </div>
      )}

      {/* 帮助说明标签页 */}
      {currentTab === "help" && (
        <div style={{ padding: "16px 0" }}>
          <ActivationHelp />
        </div>
      )}
    </div>
  );
};

export default ActivationStep;
