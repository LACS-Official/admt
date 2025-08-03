import React from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Button,
  Badge,
  Link,
} from "@fluentui/react-components";
import {
  Info24Regular,
  Heart24Regular,
  Code24Regular,
  Shield24Regular,
  Globe24Regular,
  ArrowUpload24Regular,
} from "@fluentui/react-icons";
import AppIcon from "../Common/AppIcon";

const useStyles = makeStyles({
  container: {
    padding: "20px",
    height: "100%",
    overflow: "auto",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  card: {
    height: "fit-content",
  },
  cardContent: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  aboutSection: {
    gridColumn: "1 / -1",
  },
  aboutContent: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    textAlign: "center",
    alignItems: "center",
  },
  appIcon: {
    width: "80px",
    height: "80px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, var(--colorBrandBackground) 0%, var(--colorBrandBackground2) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "8px",
    padding: "8px",
  },
  versionBadge: {
    alignSelf: "center",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  infoLabel: {
    fontWeight: "500",
    color: "var(--colorNeutralForeground2)",
  },
  infoValue: {
    fontWeight: "600",
  },
  licenseSection: {
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "8px",
    padding: "16px",
    marginTop: "8px",
  },
  teamSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  teamMember: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px",
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground2)",
  },
  memberAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "var(--colorBrandBackground)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
  },
  memberInfo: {
    flex: 1,
  },
});

const AboutPanel: React.FC = () => {
  const styles = useStyles();

  const handleCheckUpdate = () => {
    // TODO: 实现检查更新功能
    console.log("检查更新");
  };

  const handleOpenManual = () => {
    // TODO: 打开用户手册
    console.log("打开用户手册");
  };

  const handleFeedback = () => {
    // TODO: 打开问题反馈
    console.log("问题反馈");
  };

  const handleOpenGithub = () => {
    // TODO: 打开GitHub仓库
    console.log("打开GitHub");
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 应用信息 */}
        <Card className={`${styles.card} ${styles.aboutSection}`}>
          <CardHeader
            image={<Info24Regular />}
            header={<Text weight="semibold">应用信息</Text>}
            description={<Text size={200}>HOUT - 澎湃解锁工具箱</Text>}
          />

          <div className={styles.aboutContent}>
            <div className={styles.appIcon}>
              <AppIcon size="xlarge" />
            </div>
            
            <Text size={600} weight="bold">玩机管家</Text>
            <Text size={400} style={{ color: "var(--colorNeutralForeground2)" }}>
              Android设备管理工具 - Tauri版本
            </Text>

            <Badge appearance="filled" color="brand" className={styles.versionBadge}>
              v1.0.0
            </Badge>

            <Text size={300} style={{ color: "var(--colorNeutralForeground2)", textAlign: "center" }}>
              基于Tauri框架开发的现代化Android设备管理工具，
              提供ADB操作、设备解锁、刷机工具等专业功能
            </Text>

            <div className={styles.buttonGroup}>
              <Button 
                appearance="primary" 
                size="small"
                icon={<ArrowUpload24Regular />}
                onClick={handleCheckUpdate}
              >
                检查更新
              </Button>
              <Button 
                appearance="secondary" 
                size="small"
                icon={<Globe24Regular />}
                onClick={handleOpenManual}
              >
                用户手册
              </Button>
              <Button 
                appearance="secondary" 
                size="small"
                icon={<Heart24Regular />}
                onClick={handleFeedback}
              >
                问题反馈
              </Button>
              <Button 
                appearance="secondary" 
                size="small"
                icon={<Code24Regular />}
                onClick={handleOpenGithub}
              >
                GitHub
              </Button>
            </div>
          </div>
        </Card>

        {/* 技术信息 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Code24Regular />}
            header={<Text weight="semibold">技术信息</Text>}
            description={<Text size={200}>框架和依赖版本</Text>}
          />

          <div className={styles.cardContent}>
            <div className={styles.infoRow}>
              <Text className={styles.infoLabel}>框架</Text>
              <Text className={styles.infoValue}>Tauri 2.0</Text>
            </div>
            <div className={styles.infoRow}>
              <Text className={styles.infoLabel}>前端</Text>
              <Text className={styles.infoValue}>React 18 + TypeScript</Text>
            </div>
            <div className={styles.infoRow}>
              <Text className={styles.infoLabel}>UI库</Text>
              <Text className={styles.infoValue}>Fluent UI v9</Text>
            </div>
            <div className={styles.infoRow}>
              <Text className={styles.infoLabel}>状态管理</Text>
              <Text className={styles.infoValue}>Zustand</Text>
            </div>
            <div className={styles.infoRow}>
              <Text className={styles.infoLabel}>构建工具</Text>
              <Text className={styles.infoValue}>Vite</Text>
            </div>
            <div className={styles.infoRow}>
              <Text className={styles.infoLabel}>后端</Text>
              <Text className={styles.infoValue}>Rust + Tauri</Text>
            </div>
          </div>
        </Card>

        {/* 开发团队 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Heart24Regular />}
            header={<Text weight="semibold">开发团队</Text>}
            description={<Text size={200}>感谢所有贡献者</Text>}
          />

          <div className={styles.cardContent}>
            <div className={styles.teamSection}>
              <div className={styles.teamMember}>
                <div className={styles.memberAvatar}>H</div>
                <div className={styles.memberInfo}>
                  <Text weight="semibold">玩机管家团队</Text>
                  <br />
                  <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                    项目维护者
                  </Text>
                </div>
              </div>
              
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)", textAlign: "center" }}>
                感谢所有为玩机管家项目做出贡献的开发者和用户！
              </Text>
            </div>
          </div>
        </Card>

        {/* 许可证信息 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Shield24Regular />}
            header={<Text weight="semibold">许可证</Text>}
            description={<Text size={200}>开源许可和法律信息</Text>}
          />

          <div className={styles.cardContent}>
            <div className={styles.licenseSection}>
              <Text weight="semibold" style={{ marginBottom: "8px" }}>MIT License</Text>
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)", lineHeight: "1.5" }}>
                Copyright © 2024 HOUT Team
                <br /><br />
                本软件基于MIT许可证开源，您可以自由使用、修改和分发。
                详细许可证条款请参阅项目仓库中的LICENSE文件。
              </Text>
            </div>

            <Text size={200} style={{ color: "var(--colorNeutralForeground3)", textAlign: "center" }}>
              本软件仅供学习和研究使用，请遵守相关法律法规
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AboutPanel;
