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
    ...shorthands.padding("20px"),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    textAlign: "center",
    marginBottom: "8px",
  },
  qrGrid: {
    display: "flex",
    flexDirection: "row",
    gap: "32px",
    justifyContent: "center",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  qrItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    width: "180px",
  },
  qrWrapper: {
    ...shorthands.padding("8px"),
    backgroundColor: "white",
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qrImage: {
    width: "160px",
    height: "160px",
    display: "block",
  },
  noticeBox: {
    ...shorthands.padding("16px"),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    maxWidth: "600px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "8px",
    textAlign: "left",
  },
  noticeTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: tokens.colorPaletteRedForeground1,
  },
  noticeSection: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  footer: {
    marginTop: "16px",
    textAlign: "center",
    color: tokens.colorNeutralForeground4,
    fontSize: tokens.fontSizeBase100,
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
          <Text size={200} weight="medium">微信支付</Text>
        </div>

        <div className={styles.qrItem}>
          <div className={styles.qrWrapper}>
            <Image
              src={zfbPay}
              alt="Alipay"
              className={styles.qrImage}
            />
          </div>
          <Text size={200} weight="medium">支付宝支付</Text>
        </div>
      </div>

      {/* 注意说明文字区域 */}
      <div className={styles.noticeBox}>
        <div className={styles.noticeTitle}>
          <Warning24Filled />
          <Text weight="bold" size={400}>注意!</Text>
          <Text weight="semibold">使用本软件需诚信捐赠 ¥6.00 +</Text>
        </div>

        <div className={styles.noticeSection}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
            玩机管家是一款由 <b>领创工作室 (Lead And Creative Studio)</b> 维护的免费项目。
            我们的目标是为 Android 玩家提供强大、简洁、优雅的调试工具箱。
          </Text>
        </div>

        <div className={styles.noticeSection}>
          <Text size={200} style={{ fontStyle: "italic" }}>
            请确保您已有捐赠意愿，这不是一种购买行为。采取诚信付款机制，付款后将获得使用权。若有捐赠意愿但暂无捐赠能力，可以暂不捐赠，待有能力那天再来捐赠即可。
          </Text>
        </div>

        <div className={styles.noticeSection}>
          <Text weight="semibold" size={200}>为什么需要您的支持？</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
             赞助资金将直接用于服务器运营、官网维护以及支持开发者的持续开发热情。无论金额大小，您的每一份支持都是我们前进的动力。
          </Text>
        </div>

        <Text align="center" size={100} style={{ color: tokens.colorNeutralForeground4, marginTop: "8px" }}>
          捐赠后即视为同意本页内容。付款后概不退款，请您了解。
        </Text>
      </div>

      <div className={styles.footer}>
        <Text>© 2026 LACS Studio. All Rights Reserved.</Text>
      </div>
    </div>
  );
};

export default DonationPanel;
