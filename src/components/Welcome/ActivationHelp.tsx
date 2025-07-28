/**
 * 激活帮助组件
 * 提供激活码格式说明、常见问题解答和联系方式
 */

import React, { useState } from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Button,
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  tokens,
  Body1,
  Caption1,
  Subtitle2,
  Link,
} from '@fluentui/react-components';
import {
  QuestionCircle24Regular,
  Info24Regular,
  Mail24Regular,
  Phone24Regular,
  Globe24Regular,
  Copy24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
  },
  card: {
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  content: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formatExample: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '12px',
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase300,
    textAlign: 'center',
    position: 'relative',
  },
  copyButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    minWidth: 'auto',
    padding: '4px',
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  faqItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  stepsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingLeft: '16px',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  stepNumber: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    flexShrink: 0,
    marginTop: '2px',
  },
});

export const ActivationHelp: React.FC = () => {
  const styles = useStyles();
  const [copiedExample, setCopiedExample] = useState(false);

  const exampleCode = "1K2L3M4N-ABC123-DEF45678";

  const handleCopyExample = async () => {
    try {
      await navigator.clipboard.writeText(exampleCode);
      setCopiedExample(true);
      setTimeout(() => setCopiedExample(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const faqData = [
    {
      question: "激活码格式是什么？",
      answer: (
        <div className={styles.faqItem}>
          <Text>激活码采用三段式格式，用短横线分隔：</Text>
          <div className={styles.formatExample}>
            {exampleCode}
            <Button
              className={styles.copyButton}
              appearance="subtle"
              size="small"
              icon={copiedExample ? <Checkmark24Regular /> : <Copy24Regular />}
              onClick={handleCopyExample}
              title="复制示例"
            />
          </div>
          <Text size={300}>
            • 第一段：时间戳（36进制，6-10位）<br/>
            • 第二段：随机字符串（6位字母数字）<br/>
            • 第三段：UUID片段（8位字母数字）
          </Text>
        </div>
      )
    },
    {
      question: "激活失败怎么办？",
      answer: (
        <div className={styles.faqItem}>
          <Text>请按以下步骤排查问题：</Text>
          <div className={styles.stepsList}>
            <div className={styles.stepItem}>
              <div className={styles.stepNumber}>1</div>
              <Text>检查激活码格式是否正确，确保包含两个短横线</Text>
            </div>
            <div className={styles.stepItem}>
              <div className={styles.stepNumber}>2</div>
              <Text>确认网络连接正常，可以访问互联网</Text>
            </div>
            <div className={styles.stepItem}>
              <div className={styles.stepNumber}>3</div>
              <Text>检查激活码是否已过期或已被使用</Text>
            </div>
            <div className={styles.stepItem}>
              <div className={styles.stepNumber}>4</div>
              <Text>如果问题仍然存在，请联系客服获取帮助</Text>
            </div>
          </div>
        </div>
      )
    },
    {
      question: "激活码可以重复使用吗？",
      answer: (
        <Text>
          不可以。每个激活码只能使用一次，激活成功后会被标记为已使用状态。
          如果需要在多台设备上使用，请联系客服获取额外的激活码。
        </Text>
      )
    },
    {
      question: "激活码有效期多长？",
      answer: (
        <Text>
          激活码本身没有使用期限，但激活后的许可证通常有效期为1年。
          具体有效期以激活成功后显示的过期时间为准。临近过期时系统会提醒您续期。
        </Text>
      )
    },
    {
      question: "忘记激活码怎么办？",
      answer: (
        <div className={styles.faqItem}>
          <Text>如果您忘记了激活码，可以通过以下方式找回：</Text>
          <div className={styles.stepsList}>
            <div className={styles.stepItem}>
              <div className={styles.stepNumber}>1</div>
              <Text>查看购买时的邮件确认函</Text>
            </div>
            <div className={styles.stepItem}>
              <div className={styles.stepNumber}>2</div>
              <Text>登录官网用户中心查看订单详情</Text>
            </div>
            <div className={styles.stepItem}>
              <div className={styles.stepNumber}>3</div>
              <Text>联系客服提供购买信息进行查询</Text>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={styles.container}>
      {/* 激活码格式说明 */}
      <Card className={styles.card}>
        <CardHeader
          header={
            <div className={styles.header}>
              <Info24Regular />
              <Subtitle2>激活码格式说明</Subtitle2>
            </div>
          }
        />
        <CardPreview>
          <div className={styles.content}>
            <Text>
              激活码采用安全的三段式格式，确保唯一性和安全性：
            </Text>
            <div className={styles.formatExample}>
              {exampleCode}
              <Button
                className={styles.copyButton}
                appearance="subtle"
                size="small"
                icon={copiedExample ? <Checkmark24Regular /> : <Copy24Regular />}
                onClick={handleCopyExample}
                title="复制示例"
              />
            </div>
            <Caption1>
              请确保激活码格式正确，包含两个短横线分隔符，总长度约20个字符。
            </Caption1>
          </div>
        </CardPreview>
      </Card>

      {/* 常见问题 */}
      <Card className={styles.card}>
        <CardHeader
          header={
            <div className={styles.header}>
              <QuestionCircle24Regular />
              <Subtitle2>常见问题</Subtitle2>
            </div>
          }
        />
        <CardPreview>
          <div className={styles.content}>
            <Accordion multiple collapsible>
              {faqData.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionHeader>{faq.question}</AccordionHeader>
                  <AccordionPanel>
                    {faq.answer}
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </CardPreview>
      </Card>

      {/* 联系客服 */}
      <Card className={styles.card}>
        <CardHeader
          header={
            <div className={styles.header}>
              <Mail24Regular />
              <Subtitle2>联系客服</Subtitle2>
            </div>
          }
        />
        <CardPreview>
          <div className={styles.content}>
            <Text>如果您在激活过程中遇到问题，可以通过以下方式联系我们：</Text>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <Mail24Regular />
                <Link href="mailto:support@hout.com">support@hout.com</Link>
              </div>
              <div className={styles.contactItem}>
                <Phone24Regular />
                <Text>400-123-4567（工作日 9:00-18:00）</Text>
              </div>
              <div className={styles.contactItem}>
                <Globe24Regular />
                <Link href="https://www.hout.com/support" target="_blank">
                  在线客服中心
                </Link>
              </div>
            </div>
            <Caption1>
              我们的客服团队将在24小时内回复您的问题。
            </Caption1>
          </div>
        </CardPreview>
      </Card>
    </div>
  );
};

export default ActivationHelp;
