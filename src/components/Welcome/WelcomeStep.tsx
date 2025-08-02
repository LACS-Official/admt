import React, { useState } from "react";
import {
  makeStyles,
  Text,
  Card,
  Button,
  Badge,
  Divider,
  Title1,
  Title2,
  Title3,
  Body1,
  Body2,
  Caption1,
} from "@fluentui/react-components";
import {
  Sparkle48Regular,
  Phone24Regular,
  Desktop24Regular,
  Settings24Regular,
  Shield24Regular,
  Warning24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
  Circle24Regular,
  CircleFilled24Regular,
  Star24Regular,
  Checkmark24Regular,
  Info24Regular,
} from "@fluentui/react-icons";
import { useAppConfigStore } from "../../stores/welcomeStore";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: "500px",
    position: "relative",
  },
  pageContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 24px",
    textAlign: "center",
    overflow: "hidden",
  },
  // 页面1：欢迎页面样式
  welcomePage: {
    gap: "32px",
  },
  heroSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    marginBottom: "32px",
  },
  appIcon: {
    fontSize: "80px",
    color: "var(--colorBrandBackground)",
    marginBottom: "16px",
  },
  welcomeTitle: {
    color: "var(--colorNeutralForeground1)",
    marginBottom: "12px",
  },
  welcomeSubtitle: {
    color: "var(--colorNeutralForeground2)",
    maxWidth: "480px",
    lineHeight: "1.6",
  },
  versionBadge: {
    marginTop: "16px",
  },

  // 页面2：功能特性样式
  featuresPage: {
    gap: "24px",
  },
  featuresTitle: {
    color: "var(--colorNeutralForeground1)",
    marginBottom: "32px",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    width: "100%",
    maxWidth: "600px",
  },
  featureCard: {
    padding: "24px",
    textAlign: "center",
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    cursor: "default",
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground2)",
      borderColor: "var(--colorBrandStroke1)",
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
  },
  featureIcon: {
    fontSize: "32px",
    color: "var(--colorBrandBackground)",
    marginBottom: "16px",
  },
  featureTitle: {
    marginBottom: "8px",
    color: "var(--colorNeutralForeground1)",
  },
  featureDescription: {
    color: "var(--colorNeutralForeground2)",
    lineHeight: "1.5",
  },

  // 页面3：系统要求样式
  requirementsPage: {
    gap: "24px",
  },
  requirementsTitle: {
    color: "var(--colorNeutralForeground1)",
    marginBottom: "32px",
  },
  requirementsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "100%",
    maxWidth: "500px",
    textAlign: "left",
  },
  requirementItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "6px",
  },
  requirementIcon: {
    fontSize: "20px",
    color: "var(--colorPaletteGreenForeground1)",
  },

  // 分页控制样式
  paginationContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderTop: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground2)",
  },
  paginationDots: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  paginationDot: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
    cursor: "pointer",
    transition: "color 0.2s ease",
  },
  paginationDotActive: {
    color: "var(--colorBrandBackground)",
  },
  paginationButton: {
    minWidth: "100px",
  },

  // 过期提示样式
  expiredNotice: {
    padding: "20px",
    backgroundColor: "var(--colorPaletteYellowBackground1)",
    border: "1px solid var(--colorPaletteYellowBorder1)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "32px",
    maxWidth: "500px",
    textAlign: "left",
  },
  expiredIcon: {
    fontSize: "24px",
    color: "var(--colorPaletteYellowForeground1)",
    marginTop: "2px",
  },
  expiredContent: {
    flex: 1,
  },
});

const WelcomeStep: React.FC = () => {
  const styles = useStyles();
  const { isExpired, config } = useAppConfigStore();
  const [currentPage, setCurrentPage] = useState(0);

  // 检查是否有过期的激活码
  const hasExpiredActivation = config.isActivated && isExpired();

  // 分页数据
  const pages = [
    {
      id: 'welcome',
      title: '欢迎使用',
      description: '了解HOUT工具箱'
    },
    {
      id: 'features',
      title: '功能特性',
      description: '探索强大功能'
    },
    {
      id: 'requirements',
      title: '系统要求',
      description: '确保兼容性'
    }
  ];

  // 功能特性数据
  const features = [
    {
      icon: <Phone24Regular />,
      title: "设备管理",
      description: "智能检测和管理Android设备，支持多设备同时连接，实时监控设备状态",
    },
    {
      icon: <Desktop24Regular />,
      title: "屏幕投屏",
      description: "高质量屏幕镜像功能，支持实时控制，提供流畅的投屏体验",
    },
    {
      icon: <Settings24Regular />,
      title: "系统工具",
      description: "丰富的ADB工具集，包括文件管理、应用安装、系统调试等功能",
    },
    {
      icon: <Shield24Regular />,
      title: "安全可靠",
      description: "采用多层安全架构，保护设备和数据安全，支持加密传输",
    },
  ];

  // 系统要求数据
  const requirements = [
    "Windows 10/11 (64位) 或更高版本",
    "至少 4GB RAM，推荐 8GB 或更多",
    "至少 500MB 可用磁盘空间",
    "USB 2.0 或更高版本接口",
    "Android 5.0 (API 21) 或更高版本设备",
    "已启用 USB 调试模式的 Android 设备"
  ];

  // 分页控制函数
  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      setCurrentPage(pageIndex);
    }
  };

  const goToPreviousPage = () => {
    goToPage(currentPage - 1);
  };

  const goToNextPage = () => {
    goToPage(currentPage + 1);
  };

  // 渲染页面内容
  const renderPageContent = () => {
    switch (currentPage) {
      case 0: // 欢迎页面
        return (
          <div className={`${styles.pageContainer} ${styles.welcomePage}`}>
            {/* 过期提示 */}
            {hasExpiredActivation && (
              <Card className={styles.expiredNotice}>
                <Warning24Regular className={styles.expiredIcon} />
                <div className={styles.expiredContent}>
                  <Text size={400} weight="semibold" style={{ color: "var(--colorPaletteYellowForeground1)" }}>
                    激活码已过期
                  </Text>
                  <Text size={300} style={{ color: "var(--colorNeutralForeground2)", marginTop: "8px", display: "block" }}>
                    您的激活码已于 {config.expiryDate ? new Date(config.expiryDate).toLocaleDateString('zh-CN') : '未知日期'} 过期，请重新输入有效的激活码。
                  </Text>
                </div>
              </Card>
            )}

            <div className={styles.heroSection}>
              <Sparkle48Regular className={styles.appIcon} />
              <div>
                <Title1 className={styles.welcomeTitle}>
                  {hasExpiredActivation ? '重新激活 HOUT 工具箱' : '欢迎使用 HOUT 工具箱'}
                </Title1>
                <Body1 className={styles.welcomeSubtitle}>
                  {hasExpiredActivation
                    ? '您的激活码已过期，请重新输入有效的激活码以继续使用所有功能。'
                    : '专业的Android设备管理工具，提供屏幕投屏、文件管理、应用安装等丰富功能。让您轻松管理和控制Android设备。'
                  }
                </Body1>
                <Badge
                  appearance="outline"
                  color="brand"
                  size="large"
                  className={styles.versionBadge}
                >
                  版本 1.0.0
                </Badge>
              </div>
            </div>
          </div>
        );

      case 1: // 功能特性页面
        return (
          <div className={`${styles.pageContainer} ${styles.featuresPage}`}>
            <Title2 className={styles.featuresTitle}>
              <Star24Regular style={{ marginRight: "8px", color: "var(--colorBrandBackground)" }} />
              强大功能特性
            </Title2>

            <div className={styles.featuresGrid}>
              {features.map((feature, index) => (
                <Card key={index} className={styles.featureCard}>
                  <div className={styles.featureIcon}>{feature.icon}</div>
                  <Title3 className={styles.featureTitle}>
                    {feature.title}
                  </Title3>
                  <Body2 className={styles.featureDescription}>
                    {feature.description}
                  </Body2>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2: // 系统要求页面
        return (
          <div className={`${styles.pageContainer} ${styles.requirementsPage}`}>
            <Title2 className={styles.requirementsTitle}>
              <Info24Regular style={{ marginRight: "8px", color: "var(--colorBrandBackground)" }} />
              系统要求
            </Title2>

            <div className={styles.requirementsList}>
              {requirements.map((requirement, index) => (
                <div key={index} className={styles.requirementItem}>
                  <Checkmark24Regular className={styles.requirementIcon} />
                  <Body1>{requirement}</Body1>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {/* 页面内容 */}
      {renderPageContent()}

      {/* 分页控制 */}
      <div className={styles.paginationContainer}>
        <Button
          appearance="subtle"
          icon={<ChevronLeft24Regular />}
          onClick={goToPreviousPage}
          disabled={currentPage === 0}
          className={styles.paginationButton}
        >
          上一页
        </Button>

        <div className={styles.paginationDots}>
          {pages.map((page, index) => (
            <div key={page.id} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {index === currentPage ? (
                <CircleFilled24Regular
                  className={`${styles.paginationDot} ${styles.paginationDotActive}`}
                  onClick={() => goToPage(index)}
                />
              ) : (
                <Circle24Regular
                  className={styles.paginationDot}
                  onClick={() => goToPage(index)}
                />
              )}
              <Caption1 style={{ color: index === currentPage ? "var(--colorBrandBackground)" : "var(--colorNeutralForeground3)" }}>
                {page.title}
              </Caption1>
            </div>
          ))}
        </div>

        <Button
          appearance="subtle"
          icon={<ChevronRight24Regular />}
          iconPosition="after"
          onClick={goToNextPage}
          disabled={currentPage === pages.length - 1}
          className={styles.paginationButton}
        >
          下一页
        </Button>
      </div>
    </div>
  );
};

export default WelcomeStep;
