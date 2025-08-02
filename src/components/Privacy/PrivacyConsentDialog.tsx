/**
 * 隐私政策同意对话框组件
 * 用于首次启动时显示隐私政策和用户协议，要求用户同意
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  Text,
  makeStyles,
  tokens,
  Divider,
  MessageBar,
} from '@fluentui/react-components';
import { 
  Shield24Regular, 
  Document24Regular, 
  Warning24Regular,
  Dismiss24Regular 
} from '@fluentui/react-icons';
import { usePrivacyConsentStore } from '../../stores/privacyConsentStore';

const useStyles = makeStyles({
  dialog: {
    width: '90vw',
    maxWidth: '800px',
    height: '90vh',
    maxHeight: '700px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    height: '100%',
  },
  scrollArea: {
    flex: 1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    overflow: 'auto',
    maxHeight: '400px',
  },
  policySection: {
    marginBottom: tokens.spacingVerticalL,
  },
  policyTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalS,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  policyContent: {
    fontSize: tokens.fontSizeBase200,
    lineHeight: '1.6',
    color: tokens.colorNeutralForeground2,
  },
  checkboxSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  requiredCheckbox: {
    '& .fui-Checkbox__indicator': {
      borderTopColor: tokens.colorPaletteRedBorder1,
      borderRightColor: tokens.colorPaletteRedBorder1,
      borderBottomColor: tokens.colorPaletteRedBorder1,
      borderLeftColor: tokens.colorPaletteRedBorder1,
    },
  },
  warningMessage: {
    marginTop: tokens.spacingVerticalM,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  exitButton: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorPaletteRedForeground3,
    '&:hover': {
      backgroundColor: tokens.colorPaletteRedBackground2,
    },
  },
});

interface PrivacyConsentDialogProps {
  open: boolean;
  onAccept: () => void;
  onReject: () => void;
}

const PrivacyConsentDialog: React.FC<PrivacyConsentDialogProps> = ({
  open,
  onAccept,
  onReject,
}) => {
  const styles = useStyles();
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);
  const [acceptedUserAgreement, setAcceptedUserAgreement] = useState(false);
  const [acceptedDataCollection, setAcceptedDataCollection] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const {
    acceptPrivacyPolicy,
    acceptUserAgreement,
    acceptDataCollection,
    completePrivacySetup,
    setShouldExitApp,
  } = usePrivacyConsentStore();

  // 检查是否所有必需项都已同意
  const allRequiredAccepted = acceptedPrivacyPolicy && acceptedUserAgreement && acceptedDataCollection;

  const handleAccept = () => {
    if (!allRequiredAccepted) {
      setShowExitConfirm(true);
      return;
    }

    // 更新状态
    if (acceptedPrivacyPolicy) acceptPrivacyPolicy();
    if (acceptedUserAgreement) acceptUserAgreement();
    if (acceptedDataCollection) acceptDataCollection();
    
    completePrivacySetup();
    onAccept();
  };

  const handleReject = async () => {
    setShouldExitApp(true);
    onReject();

    // 尝试退出应用
    try {
      const { exit } = await import('@tauri-apps/api/app');
      await exit(0);
    } catch (error) {
      console.error('退出应用失败:', error);
      // 如果 Tauri API 失败，尝试其他方法
      if (window.close) {
        window.close();
      }
    }
  };

  const privacyPolicyContent = `
我们非常重视您的隐私权。本隐私政策说明了我们如何收集、使用和保护您的个人信息。

1. 信息收集
我们可能收集以下类型的信息：
- 设备信息：操作系统版本、硬件配置、设备标识符
- 使用数据：应用使用统计、功能使用频率、错误日志
- 匿名分析数据：用于改进产品性能和用户体验

2. 信息使用
我们使用收集的信息用于：
- 提供和改进我们的服务
- 分析产品使用情况
- 修复错误和提升性能
- 提供技术支持

3. 信息保护
我们采用行业标准的安全措施保护您的信息：
- 数据加密传输和存储
- 访问控制和权限管理
- 定期安全审计

4. 信息共享
我们不会向第三方出售、交易或转让您的个人信息，除非：
- 获得您的明确同意
- 法律要求或政府部门要求
- 保护我们的权利和安全

5. 您的权利
您有权：
- 查看我们收集的关于您的信息
- 要求更正不准确的信息
- 要求删除您的个人信息
- 撤销对数据处理的同意
  `;

  const userAgreementContent = `
欢迎使用我们的软件。使用本软件即表示您同意以下条款：

1. 软件许可
本软件按"现状"提供，我们授予您有限的、非独占的、不可转让的使用许可。

2. 使用限制
您不得：
- 逆向工程、反编译或反汇编软件
- 移除或修改任何版权声明
- 将软件用于非法目的
- 干扰软件的正常运行

3. 知识产权
软件及其所有相关知识产权均归我们所有。

4. 免责声明
在法律允许的最大范围内，我们不对因使用软件而产生的任何损失承担责任。

5. 服务变更
我们保留随时修改或终止服务的权利，恕不另行通知。

6. 争议解决
因本协议产生的争议应通过友好协商解决，协商不成的，提交有管辖权的法院解决。
  `;

  const dataCollectionContent = `
为了提供更好的服务和用户体验，我们需要收集以下数据：

1. 设备数据
- 操作系统类型和版本
- 硬件配置信息
- 设备唯一标识符（匿名化处理）

2. 使用行为数据
- 功能使用统计
- 应用启动和使用时长
- 用户操作路径（匿名化处理）

3. 性能数据
- 应用性能指标
- 错误和崩溃报告
- 网络连接状态

4. 数据处理原则
- 所有数据都经过匿名化处理
- 不收集任何可识别个人身份的信息
- 数据仅用于产品改进和技术支持
- 严格遵循最小化原则，只收集必要数据

5. 数据安全
- 采用加密传输和存储
- 定期删除过期数据
- 严格的访问控制

请注意：这些数据收集对于软件的正常运行是必需的。如果您不同意，软件将无法正常工作。
  `;

  return (
    <>
      <Dialog open={open} modalType="modal">
        <DialogSurface className={styles.dialog}>
          <DialogBody>
            <DialogTitle>
              <Shield24Regular />
              隐私政策和用户协议
            </DialogTitle>
            <DialogContent className={styles.content}>
              <Text>
                为了保护您的权益并确保软件正常运行，请仔细阅读并同意以下条款。
                所有条款都是必需的，不同意任何一项都将无法使用软件。
              </Text>

              <div className={styles.scrollArea}>
                <div className={styles.policySection}>
                  <div className={styles.policyTitle}>
                    <Document24Regular />
                    隐私政策
                  </div>
                  <div className={styles.policyContent}>
                    {privacyPolicyContent}
                  </div>
                </div>

                <Divider />

                <div className={styles.policySection}>
                  <div className={styles.policyTitle}>
                    <Document24Regular />
                    用户协议
                  </div>
                  <div className={styles.policyContent}>
                    {userAgreementContent}
                  </div>
                </div>

                <Divider />

                <div className={styles.policySection}>
                  <div className={styles.policyTitle}>
                    <Shield24Regular />
                    数据收集说明
                  </div>
                  <div className={styles.policyContent}>
                    {dataCollectionContent}
                  </div>
                </div>
              </div>

              <div className={styles.checkboxSection}>
                <Checkbox
                  checked={acceptedPrivacyPolicy}
                  onChange={(_, data) => setAcceptedPrivacyPolicy(data.checked === true)}
                  label="我已阅读并同意《隐私政策》（必需）"
                  className={!acceptedPrivacyPolicy ? styles.requiredCheckbox : undefined}
                />
                <Checkbox
                  checked={acceptedUserAgreement}
                  onChange={(_, data) => setAcceptedUserAgreement(data.checked === true)}
                  label="我已阅读并同意《用户协议》（必需）"
                  className={!acceptedUserAgreement ? styles.requiredCheckbox : undefined}
                />
                <Checkbox
                  checked={acceptedDataCollection}
                  onChange={(_, data) => setAcceptedDataCollection(data.checked === true)}
                  label="我同意软件收集匿名使用数据以改进产品（必需）"
                  className={!acceptedDataCollection ? styles.requiredCheckbox : undefined}
                />
              </div>

              {!allRequiredAccepted && (
                <MessageBar intent="warning" className={styles.warningMessage}>
                  <Warning24Regular />
                  请注意：所有条款都是软件正常运行的必需条件。如果您不同意任何一项，软件将无法使用。
                </MessageBar>
              )}
            </DialogContent>
            <DialogActions className={styles.actions}>
              <Button
                appearance="secondary"
                icon={<Dismiss24Regular />}
                onClick={() => setShowExitConfirm(true)}
                className={styles.exitButton}
              >
                不同意，退出应用
              </Button>
              <Button
                appearance="primary"
                onClick={handleAccept}
                disabled={!allRequiredAccepted}
              >
                {allRequiredAccepted ? '同意并继续' : '请先同意所有条款'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 退出确认对话框 */}
      <Dialog open={showExitConfirm} modalType="modal">
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <Warning24Regular />
              确认退出
            </DialogTitle>
            <DialogContent>
              <Text>
                您选择不同意必需的条款。这意味着软件无法正常运行，将会退出应用。
              </Text>
              <Text>
                如果您改变主意，可以点击"返回"重新考虑。
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setShowExitConfirm(false)}
              >
                返回重新考虑
              </Button>
              <Button
                appearance="primary"
                onClick={handleReject}
                className={styles.exitButton}
              >
                确认退出应用
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default PrivacyConsentDialog;
