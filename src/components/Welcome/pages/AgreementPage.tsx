/**
 * 第2页：用户协议和条款页面
 * 显示使用条款、隐私政策等法律文本
 */

import React from 'react';
import {
  makeStyles,
  Text,
  Title1,
  Title2,
  Body1,
  Caption1,
  Card,
  Checkbox,
  Link,
  Divider,
  MessageBar,
} from '@fluentui/react-components';
import {
  Document24Regular,
  Shield24Regular,
  Info24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import { useWelcomeStore } from '../../../stores/welcomeStore';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '800px',
    margin: '0 auto',
    height: '100%',
  },
  header: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  icon: {
    fontSize: '48px',
    color: 'var(--colorBrandBackground)',
    marginBottom: '16px',
  },
  title: {
    marginBottom: '8px',
  },
  subtitle: {
    color: 'var(--colorNeutralForeground2)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  agreementSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  agreementCard: {
    padding: '24px',
    maxHeight: '300px',
    overflow: 'auto',
    border: '1px solid var(--colorNeutralStroke2)',
  },
  agreementContent: {
    lineHeight: '1.6',
    '& h3': {
      margin: '16px 0 8px 0',
      color: 'var(--colorNeutralForeground1)',
    },
    '& p': {
      margin: '8px 0',
      color: 'var(--colorNeutralForeground2)',
    },
    '& ul': {
      paddingLeft: '20px',
      margin: '8px 0',
    },
    '& li': {
      margin: '4px 0',
      color: 'var(--colorNeutralForeground2)',
    },
  },
  checkboxSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    borderRadius: '8px',
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  checkboxLabel: {
    flex: 1,
    lineHeight: '1.5',
  },
  warningMessage: {
    marginTop: '16px',
  },
});

const AgreementPage: React.FC = () => {
  const styles = useStyles();
  const {
    userAgreementAccepted,
    privacyPolicyAccepted,
    analyticsConsent,
    setUserAgreementAccepted,
    setPrivacyPolicyAccepted,
    setAnalyticsConsent,
  } = useWelcomeStore();

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <div className={styles.header}>
        <Document24Regular className={styles.icon} />
        <Title1 className={styles.title}>
          用户协议与隐私政策
        </Title1>
        <Body1 className={styles.subtitle}>
          请仔细阅读以下条款，了解您的权利和义务。使用本软件即表示您同意遵守这些条款。
        </Body1>
      </div>

      {/* 用户协议 */}
      <div className={styles.agreementSection}>
        <Title2>用户服务协议</Title2>
        <Card className={styles.agreementCard}>
          <div className={styles.agreementContent}>
            <h3>1. 服务条款</h3>
            <p>
              欢迎使用玩机管家！本协议是您与我们之间关于使用玩机管家软件服务的法律协议。
              通过安装、访问或使用本软件，您表示同意受本协议条款的约束。
            </p>

            <h3>2. 软件许可</h3>
            <p>我们授予您有限的、非独占的、不可转让的许可，允许您：</p>
            <ul>
              <li>在您的设备上安装和使用本软件</li>
              <li>为个人或商业目的使用软件功能</li>
              <li>享受软件更新和技术支持</li>
            </ul>

            <h3>3. 使用限制</h3>
            <p>您不得：</p>
            <ul>
              <li>逆向工程、反编译或反汇编软件</li>
              <li>删除或修改软件中的版权声明</li>
              <li>将软件用于非法或有害目的</li>
              <li>干扰软件的正常运行</li>
            </ul>

            <h3>4. 免责声明</h3>
            <p>
              本软件按"现状"提供，我们不对软件的适用性、可靠性或完整性做出任何明示或暗示的保证。
              您使用本软件的风险由您自行承担。
            </p>

            <h3>5. 责任限制</h3>
            <p>
              在法律允许的最大范围内，我们不对因使用或无法使用本软件而导致的任何直接、间接、
              偶然、特殊或后果性损害承担责任。
            </p>
          </div>
        </Card>

        <Divider />

        <Title2>隐私政策</Title2>
        <Card className={styles.agreementCard}>
          <div className={styles.agreementContent}>
            <h3>1. 信息收集</h3>
            <p>为了提供更好的服务体验，我们会收集以下匿名信息：</p>
            <ul>
              <li><strong>设备信息</strong>：设备型号、操作系统版本、硬件配置（匿名化处理）</li>
              <li><strong>使用数据</strong>：功能使用频率、错误日志、性能数据（不包含个人信息）</li>
              <li><strong>应用统计</strong>：启动次数、功能使用统计、崩溃报告（完全匿名）</li>
            </ul>
            <p style="color: var(--colorPaletteRedForeground1); font-weight: 600;">
              ⚠️ 重要说明：匿名数据收集是软件正常运行的必要组成部分，用于确保软件稳定性和持续改进。
              如果您不同意数据收集，软件将无法正常提供服务。
            </p>

            <h3>2. 信息使用</h3>
            <p>我们使用收集的匿名信息用于：</p>
            <ul>
              <li><strong>服务优化</strong>：提供和改进软件服务质量</li>
              <li><strong>问题诊断</strong>：诊断和修复技术问题，确保软件稳定运行</li>
              <li><strong>体验改进</strong>：分析使用模式以优化用户体验</li>
              <li><strong>技术支持</strong>：提供更精准的客户支持服务</li>
            </ul>

            <h3>3. 信息保护</h3>
            <p>
              我们采用行业标准的安全措施保护您的信息，包括加密传输、访问控制和定期安全审计。
              我们不会向第三方出售、交易或转让您的个人信息。
            </p>

            <h3>4. 数据保留</h3>
            <p>
              我们仅在必要期间保留您的信息。您可以随时要求删除您的个人数据，
              我们将在合理时间内处理您的请求。
            </p>

            <h3>5. 联系我们</h3>
            <p>
              如果您对本隐私政策有任何疑问，请通过软件内的反馈功能或官方网站联系我们。
            </p>
          </div>
        </Card>
      </div>

      {/* 同意选项 */}
      <div className={styles.checkboxSection}>
        <div className={styles.checkboxItem}>
          <Checkbox
            checked={userAgreementAccepted}
            onChange={(_, data) => setUserAgreementAccepted(data.checked === true)}
          />
          <div className={styles.checkboxLabel}>
            <Text size={400} weight="semibold">
              我已阅读并同意《用户服务协议》
            </Text>
            <Caption1 style={{ display: 'block', marginTop: '4px', color: 'var(--colorNeutralForeground2)' }}>
              必须同意才能继续使用软件
            </Caption1>
          </div>
        </div>

        <div className={styles.checkboxItem}>
          <Checkbox
            checked={privacyPolicyAccepted}
            onChange={(_, data) => setPrivacyPolicyAccepted(data.checked === true)}
          />
          <div className={styles.checkboxLabel}>
            <Text size={400} weight="semibold">
              我已阅读并同意《隐私政策》
            </Text>
            <Caption1 style={{ display: 'block', marginTop: '4px', color: 'var(--colorNeutralForeground2)' }}>
              必须同意才能继续使用软件
            </Caption1>
          </div>
        </div>

        <div className={styles.checkboxItem}>
          <Checkbox
            checked={analyticsConsent}
            onChange={(_, data) => setAnalyticsConsent(data.checked === true)}
          />
          <div className={styles.checkboxLabel}>
            <Text size={400} weight="semibold">
              同意发送匿名使用统计数据
            </Text>
            <Caption1 style={{ display: 'block', marginTop: '4px', color: 'var(--colorPaletteRedForeground1)' }}>
              必需项，软件正常运行所必须。不同意将无法使用软件。
            </Caption1>
          </div>
        </div>

        {(!userAgreementAccepted || !privacyPolicyAccepted || !analyticsConsent) && (
          <MessageBar intent="warning" className={styles.warningMessage}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Warning24Regular />
              <Text>
                您必须同意用户协议、隐私政策和匿名数据收集才能继续使用软件。
                不同意任何一项都将无法使用软件。
              </Text>
            </div>
          </MessageBar>
        )}
      </div>
    </div>
  );
};

export default AgreementPage;
