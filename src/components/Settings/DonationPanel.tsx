import React from 'react';
import {
  makeStyles,
  Text,
  shorthands,
  tokens,
  Image,
} from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import { Warning24Filled } from "@fluentui/react-icons";
import wxPay from "../../assets/icons/pay/wx.webp";
import zfbPay from "../../assets/icons/pay/zfb.webp";

const useStyles = makeStyles({
  container: {
    padding: "20px 24px 24px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
    backgroundColor: "transparent",
  },
  header: {
    textAlign: "center",
    marginBottom: "4px",
  },
  qrGrid: {
    display: "flex",
    flexDirection: "row",
    gap: "28px",
    justifyContent: "center",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  qrItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    width: "180px",
  },
  qrWrapper: {
    padding: "10px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    ":hover": {
      transform: "scale(1.02)",
      boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.1)",
    },
  },
  qrImage: {
    width: "160px",
    height: "160px",
    borderRadius: "8px",
    display: "block",
  },
  noticeBox: {
    padding: "16px 18px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "14px",
    border: "1px solid var(--colorNeutralStroke2)",
    maxWidth: "600px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "6px",
    textAlign: "left",
  },
  noticeTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "var(--colorPaletteRedForeground1)",
  },
  noticeSection: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  footer: {
    marginTop: "8px",
    textAlign: "center",
    color: "var(--colorNeutralForeground4)",
    fontSize: "12px",
    maxWidth: "400px",
  }
});

const DonationPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={500} weight="semibold">
          {t('settings.donate_us')}
        </Text>
      </div>

      <div className={styles.qrGrid}>
        <div className={styles.qrItem}>
          <div className={styles.qrWrapper}>
            <Image
              src={wxPay}
              alt="WeChat Pay"
              className={styles.qrImage}
            />
          </div>
          <Text size={200} weight="medium">{t('donation.wechat_pay')}</Text>
        </div>

        <div className={styles.qrItem}>
          <div className={styles.qrWrapper}>
            <Image
              src={zfbPay}
              alt="Alipay"
              className={styles.qrImage}
            />
          </div>
          <Text size={200} weight="medium">{t('donation.alipay')}</Text>
        </div>
      </div>

      {/* 注意说明文字区域 */}
      <div className={styles.noticeBox}>
        <div className={styles.noticeTitle}>
          <Warning24Filled />
          <Text weight="bold" size={400}>{t('donation.notice')}</Text>
          <Text weight="semibold">{t('donation.honesty')}</Text>
        </div>

        <div className={styles.noticeSection}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            {t('donation.studio_info')}
          </Text>
        </div>

        <div className={styles.noticeSection}>
          <Text size={200} style={{ fontStyle: "italic" }}>
            {t('donation.intent_desc')}
          </Text>
        </div>

        <div className={styles.noticeSection}>
          <Text weight="semibold" size={200}>{t('donation.why_support')}</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
             {t('donation.support_desc')}
          </Text>
        </div>

        <Text align="center" size={100} style={{ color: tokens.colorNeutralForeground4, marginTop: "8px" }}>
          {t('donation.agree_notice')}
        </Text>
      </div>

      <div className={styles.footer}>
        <Text>© 2026 LACS Studio. All Rights Reserved.</Text>
      </div>
    </div>
  );
};

export default DonationPanel;
