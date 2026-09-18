import React from 'react';
import {
  makeStyles,
  Text,
  tokens,
  Image,
  Badge,
} from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import {
  Heart24Regular,
  Info24Regular,
  ShieldCheckmark24Regular,
} from "@fluentui/react-icons";
import wxPay from "../../assets/icons/pay/wx.webp";
import zfbPay from "../../assets/icons/pay/zfb.webp";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    padding: "4px 2px",
    boxSizing: "border-box",
    width: "100%",
  },
  banner: {
    padding: "12px 16px",
    borderRadius: "12px",
    backgroundColor: "var(--colorBrandBackground2)",
    border: "1px solid var(--colorBrandStroke2)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxSizing: "border-box",
  },
  bannerIcon: {
    color: "var(--colorBrandForeground1)",
    fontSize: "22px",
    flexShrink: 0,
  },
  bannerText: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground1)",
    lineHeight: "1.5",
  },
  qrGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    width: "100%",
    boxSizing: "border-box",
    "@media (max-width: 520px)": {
      gridTemplateColumns: "1fr",
    },
  },
  qrCard: {
    borderRadius: "14px",
    border: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground2)",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    boxSizing: "border-box",
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    ":hover": {
      border: "1px solid var(--colorBrandStroke2)",
      transform: "translateY(-1px)",
      boxShadow: "0 6px 18px -4px rgba(0, 0, 0, 0.06)",
    },
  },
  qrHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  qrWrapper: {
    padding: "8px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid rgba(0, 0, 0, 0.08)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qrImage: {
    width: "135px",
    height: "135px",
    borderRadius: "6px",
    display: "block",
    objectFit: "contain",
  },
  qrDesc: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
  },
  noticeCard: {
    padding: "14px 16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "14px",
    border: "1px solid var(--colorNeutralStroke2)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    boxSizing: "border-box",
  },
  noticeHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "var(--colorNeutralForeground1)",
  },
  noticeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    "@media (max-width: 520px)": {
      gridTemplateColumns: "1fr",
    },
  },
  noticeItem: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  noticeItemTitle: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
  },
  noticeItemDesc: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
    lineHeight: "1.5",
  },
  agreementText: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground4)",
    textAlign: "center",
    paddingTop: "6px",
    borderTop: "1px solid var(--colorNeutralStroke3)",
  },
  footer: {
    textAlign: "center",
    color: "var(--colorNeutralForeground4)",
    fontSize: "11px",
    marginTop: "2px",
  },
});

const DonationPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      {/* 顶部横幅 */}
      <div className={styles.banner}>
        <Heart24Regular className={styles.bannerIcon} />
        <Text className={styles.bannerText}>
          {t('donation.studio_info', '玩机管家由领创工作室 (LACS Studio) 独立开发并维护。全功能完全免费开放，自愿赞助金额不限，感谢您的鼓励与支持！')}
        </Text>
      </div>

      {/* 支付码双栏卡片 */}
      <div className={styles.qrGrid}>
        <div className={styles.qrCard}>
          <div className={styles.qrHeader}>
            <Text weight="semibold" size={300}>{t('donation.wechat_pay', '微信支付')}</Text>
            <Badge appearance="tint" color="brand" size="small">扫码赞助</Badge>
          </div>
          <div className={styles.qrWrapper}>
            <Image
              src={wxPay}
              alt="WeChat Pay"
              className={styles.qrImage}
            />
          </div>
          <Text className={styles.qrDesc}>打开微信扫一扫即可赞助</Text>
        </div>

        <div className={styles.qrCard}>
          <div className={styles.qrHeader}>
            <Text weight="semibold" size={300}>{t('donation.alipay', '支付宝支付')}</Text>
            <Badge appearance="tint" color="brand" size="small">扫码赞助</Badge>
          </div>
          <div className={styles.qrWrapper}>
            <Image
              src={zfbPay}
              alt="Alipay"
              className={styles.qrImage}
            />
          </div>
          <Text className={styles.qrDesc}>打开支付宝扫一扫即可赞助</Text>
        </div>
      </div>

      {/* 赞助说明与须知 */}
      <div className={styles.noticeCard}>
        <div className={styles.noticeHeader}>
          <ShieldCheckmark24Regular style={{ color: "var(--colorBrandForeground1)" }} />
          <Text weight="semibold" size={300}>赞助支持与开源说明</Text>
        </div>

        <div className={styles.noticeGrid}>
          <div className={styles.noticeItem}>
            <Text className={styles.noticeItemTitle}>{t('donation.why_support', '资金用途说明')}</Text>
            <Text className={styles.noticeItemDesc}>
              {t('donation.support_desc', '赞助资金将用于服务器运维、高速下载节点、软件持续迭代及开发支持。')}
            </Text>
          </div>

          <div className={styles.noticeItem}>
            <Text className={styles.noticeItemTitle}>开源无偿自愿</Text>
            <Text className={styles.noticeItemDesc}>
              {t('donation.intent_desc', '无需捐赠也可免费使用所有功能。自愿捐赠不设门槛，每一笔支持都至关重要。')}
            </Text>
          </div>
        </div>

        <Text className={styles.agreementText}>
          {t('donation.agree_notice', '捐赠后即视为同意本页内容。付款后概不退款，请您了解。')}
        </Text>
      </div>

      <div className={styles.footer}>
        <Text>© 2026 LACS Studio. All Rights Reserved.</Text>
      </div>
    </div>
  );
};

export default DonationPanel;
