import React, { useState, useEffect } from 'react';
import { versionManager, useVersionInfo } from '../../utils/versionManager';
import { admtLogo128 } from "../../assets/icons";
import { lacsbgIcon } from "../../assets/icons";
import VersionChecker from "../Common/VersionChecker";

import {
  makeStyles,
  mergeClasses,
  Text,
  Card,
  Button,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Spinner,
  shorthands,
  Badge,
} from "@fluentui/react-components";
import {
  Info24Regular,
  Heart24Regular,
  Code24Regular,
  Globe24Regular,
  Person24Regular,
  ArrowUpload24Regular,
  BookOpen24Regular,
  Chat24Regular,
  Map24Regular,
  Open20Regular,
  Desktop24Regular,
  CheckmarkCircle20Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import DonationPanel from "./DonationPanel";

const useStyles = makeStyles({
  container: {
    padding: "4px 8px 24px 8px",
    height: "100%",
    overflow: "auto",
    backgroundColor: "transparent",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "1.3fr 0.9fr",
    gap: "16px",
    "@media (max-width: 860px)": {
      gridTemplateColumns: "1fr",
    },
  },
  // Hero section (About App)
  heroCard: {
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
    backgroundColor: "var(--colorNeutralBackground1)",
    padding: "20px 22px",
  },
  heroContent: {
    display: "flex",
    flexDirection: "row",
    gap: "20px",
    alignItems: "center",
    "@media (max-width: 600px)": {
      flexDirection: "column",
      textAlign: "center",
    },
  },
  appLogo: {
    width: "72px",
    height: "72px",
    borderRadius: "16px",
    boxShadow: "0 6px 20px -4px rgba(0, 0, 0, 0.12)",
    flexShrink: 0,
  },
  heroInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  versionPill: {
    borderRadius: "9999px",
    fontWeight: 600,
    fontSize: "12px",
    padding: "2px 10px",
  },
  heroButtonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "8px",
    marginTop: "12px",
  },
  pillButton: {
    borderRadius: "9999px",
    height: "34px",
    fontWeight: 500,
    fontSize: "13px",
    transition: "all 0.15s ease",
    ":hover": {
      transform: "translateY(-1px)",
    },
  },
  
  // Team side card
  teamCard: {
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
    backgroundColor: "var(--colorNeutralBackground1)",
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "12px",
  },
  teamHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  teamLogo: {
    width: "72px",
    height: "40px",
    borderRadius: "10px",
    objectFit: "cover",
    border: "1px solid var(--colorNeutralStroke2)",
    flexShrink: 0,
  },
  teamButtons: {
    display: "flex",
    gap: "8px",
    marginTop: "auto",
  },

  // Specs & Environment Bento Card (High information density)
  specsCard: {
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
    backgroundColor: "var(--colorNeutralBackground1)",
    padding: "18px 20px",
  },
  specsHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "14px",
  },
  specsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
  },
  specItem: {
    padding: "10px 14px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "12px",
    border: "1px solid var(--colorNeutralStroke2)",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  specLabel: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    fontWeight: 600,
  },
  specValue: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--colorNeutralForeground1)",
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  },

  // Social/Community section
  communitySection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 4px",
  },
  headerLine: {
    height: "1px",
    flex: 1,
    backgroundColor: "var(--colorNeutralStroke2)",
  },
  socialGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "10px",
  },
  socialTile: {
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 14px",
    borderRadius: "12px",
    border: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
    cursor: "pointer",
    transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      ...shorthands.borderColor("var(--colorBrandStroke1)"),
      transform: "translateY(-1px)",
      boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.05)",
    },
  },
  socialTileLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  // Dialog styles
  openSourceDialog: {
    maxWidth: "800px",
    maxHeight: "80vh",
    borderRadius: "18px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 20px 48px -8px rgba(0, 0, 0, 0.24)",
  },
  openSourceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "10px",
    marginTop: "14px",
    overflow: "auto",
    maxHeight: "420px",
    paddingRight: "6px",
  },
  openSourceItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    borderRadius: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  openSourceName: {
    fontWeight: "600",
    marginBottom: "2px",
  },
  openSourceDesc: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
  openSourceLicense: {
    fontSize: "11px",
    color: "var(--colorBrandForeground1)",
    backgroundColor: "var(--colorBrandBackground2)",
    padding: "2px 8px",
    borderRadius: "9999px",
    fontWeight: "600",
  },
});

const OPEN_SOURCE_PROJECTS = [
  { name: "Tauri", description: "Multi-platform desktop framework using Rust and Web", license: "MIT" },
  { name: "React", description: "用于构建用户界面的 JavaScript 库", license: "MIT" },
  { name: "Fluent UI v9", description: "Microsoft 现代化设计规范 React 组件库", license: "MIT" },
  { name: "Vite", description: "下一代极速前端工程构建工具", license: "MIT" },
  { name: "TypeScript", description: "具备静态类型系统的现代编程语言", license: "Apache-2.0" },
  { name: "ADB (Android Debug Bridge)", description: "Android 设备通信与调试核心组件", license: "Apache-2.0" },
  { name: "Fastboot", description: "Android 引导分区通信与刷写工具", license: "Apache-2.0" },
  { name: "Scrcpy", description: "Android 高性能低延迟屏幕镜像与控制工具", license: "Apache-2.0" },
  { name: "FFmpeg", description: "音视频流媒体编码解码工具集", license: "LGPL/GPL" },
  { name: "SDL2", description: "跨平台多媒体与底层输入控制库", license: "Zlib" },
];

const THANKS_PROJECTS = [
  {
    name: "Xiaomi HyperOS BootLoader Bypass",
    description: "Xiaomi HyperOS 社区解锁思路与工具参考",
    url: "https://github.com/MlgmXyysd/Xiaomi-HyperOS-BootLoader-Bypass",
    category: "Android Tools",
  },
  {
    name: "雪糕小豪, 酷安@24524599",
    description: "感谢社区大佬在工具设计与玩机思路上给予的灵感与支持",
    url: "https://b23.tv/ka645O6",
    category: "Community",
  },
];

const openUrl = (url: string) => {
  import('@tauri-apps/plugin-shell').then(({ open }) => {
    open(url).catch((error) => {
      console.error('Failed to open URL:', error);
      window.open(url, '_blank');
    });
  }).catch(() => {
    window.open(url, '_blank');
  });
};

const AboutPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [isOpenSourceDialogOpen, setIsOpenSourceDialogOpen] = useState(false);
  const [isThanksDialogOpen, setIsThanksDialogOpen] = useState(false);
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const { versionInfo, loading: versionLoading } = useVersionInfo();
  const [fullVersionString, setFullVersionString] = useState('v1.5.1');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [triggerVersionCheck, setTriggerVersionCheck] = useState(false);

  useEffect(() => {
    const loadVersionString = async () => {
      try {
        const fullVersion = await versionManager.getFullVersionString();
        setFullVersionString(`${fullVersion}`);
      } catch {
        setFullVersionString('v1.5.1');
      }
    };
    loadVersionString();
  }, [versionInfo]);

  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    setTriggerVersionCheck(prev => !prev);
  };

  const handleUpdateCheckComplete = () => {
    setIsCheckingUpdate(false);
  };

  const links = {
    userManual: "https://admt.lacs.cc/docs",
    feedback: "https://github.com/LACS-Official/admt/issues",
    otherapps: "https://www.lacs.cc/#projects",
    officialWebsite: "https://www.lacs.cc",
    officialADMTWeb: "https://admt.lacs.cc",
    officialGroup: "https://www.lacs.cc/contact#qun-group",
    contact: "https://www.lacs.cc/contact",
    githubRepo: "https://github.com/LACS-Official/admt",
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* --- Top Row: App Hero + Team Info --- */}
        <div className={styles.topGrid}>
          {/* Hero Card */}
          <Card className={styles.heroCard}>
            <div className={styles.heroContent}>
              <img src={admtLogo128} alt="appIcon" className={styles.appLogo} />

              <div className={styles.heroInfo}>
                <div className={styles.titleRow}>
                  <Text size={500} weight="bold">
                    {t('settings.app_name', '玩机管家')}
                  </Text>
                  <Badge
                    className={styles.versionPill}
                    appearance="tint"
                    color="brand"
                  >
                    {versionLoading ? 'v1.5.1' : fullVersionString}
                  </Badge>
                </div>

                <Text size={200} style={{ color: "var(--colorNeutralForeground2)", marginTop: '4px' }}>
                  {t('settings.app_desc', '专为 Android 搞机打造的跨平台图形化全能管家')}
                </Text>

                <div className={styles.heroButtonGrid}>
                  <Button
                    appearance="primary"
                    size="small"
                    className={styles.pillButton}
                    icon={isCheckingUpdate ? <Spinner size="tiny" /> : <ArrowUpload24Regular />}
                    onClick={handleCheckUpdate}
                    disabled={isCheckingUpdate}
                  >
                    {isCheckingUpdate ? t('settings.checking_update') : t('settings.check_update')}
                  </Button>
                  <Button
                    appearance="outline"
                    size="small"
                    className={styles.pillButton}
                    icon={<Heart24Regular style={{ color: "#e11d48" }} />}
                    onClick={() => setIsDonationDialogOpen(true)}
                  >
                    {t('settings.donate_us')}
                  </Button>
                  <Button
                    appearance="subtle"
                    size="small"
                    className={styles.pillButton}
                    icon={<Code24Regular />}
                    onClick={() => setIsOpenSourceDialogOpen(true)}
                  >
                    {t('settings.opensource_projects')}
                  </Button>
                  <Button
                    appearance="subtle"
                    size="small"
                    className={styles.pillButton}
                    icon={<CheckmarkCircle20Regular />}
                    onClick={() => setIsThanksDialogOpen(true)}
                  >
                    {t('settings.thanks_list')}
                  </Button>
                </div>
              </div>
            </div>

            <VersionChecker
              triggerCheck={triggerVersionCheck}
              onCheckUpdate={handleUpdateCheckComplete}
              onNoUpdate={handleUpdateCheckComplete}
              onError={handleUpdateCheckComplete}
            />
          </Card>

          {/* Team Side Card */}
          <Card className={styles.teamCard}>
            <div className={styles.teamHeader}>
              <img src={lacsbgIcon} alt="teamIcon" className={styles.teamLogo} />
              <div>
                <Text size={400} weight="bold">{t('settings.team_name')}</Text>
                <Text size={100} weight="semibold" style={{ color: "var(--colorNeutralForeground3)", display: "block" }}>
                  Lead And Creative Studio
                </Text>
              </div>
            </div>

            <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
              {t('settings.team_desc')}
            </Text>

            <div className={styles.teamButtons}>
              <Button
                appearance="outline"
                size="small"
                className={styles.pillButton}
                icon={<Globe24Regular />}
                onClick={() => openUrl(links.officialWebsite)}
                style={{ flex: 1 }}
              >
                {t('settings.official_website')}
              </Button>
              <Button
                appearance="subtle"
                size="small"
                className={styles.pillButton}
                icon={<Map24Regular />}
                onClick={() => openUrl(links.otherapps)}
                style={{ flex: 1 }}
              >
                {t('settings.our_products')}
              </Button>
            </div>
          </Card>
        </div>

        {/* --- High Information Density: System Specs & Environment --- */}
        <Card className={styles.specsCard}>
          <div className={styles.specsHeader}>
            <Desktop24Regular style={{ color: "var(--colorBrandForeground1)" }} />
            <Text weight="semibold" size={300}>
              运行规格与技术环境
            </Text>
          </div>

          <div className={styles.specsGrid}>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>核心技术栈</span>
              <span className={styles.specValue}>Tauri v2 (Rust) + React 18</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>运行平台</span>
              <span className={styles.specValue}>Windows x86_64-pc-msvc</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>调试环境</span>
              <span className={styles.specValue}>ADB v1.0.41 + Fastboot (嵌入集成)</span>
            </div>
          </div>
        </Card>

        {/* --- Community & Social Bento Chips --- */}
        <div className={styles.communitySection}>
          <div className={styles.sectionHeader}>
            <Text size={300} weight="semibold" style={{ color: "var(--colorNeutralForeground3)" }}>
              社区交流与支持
            </Text>
            <div className={styles.headerLine} />
          </div>

          <div className={styles.socialGrid}>
            <div className={styles.socialTile} onClick={() => openUrl(links.githubRepo)}>
              <div className={styles.socialTileLeft}>
                <Code24Regular style={{ color: "var(--colorNeutralForeground1)" }} />
                <Text size={200} weight="semibold">{t('settings.github_repo', 'GitHub 仓库')}</Text>
              </div>
              <Open20Regular style={{ color: "var(--colorNeutralForeground3)" }} />
            </div>

            <div className={styles.socialTile} onClick={() => openUrl(links.userManual)}>
              <div className={styles.socialTileLeft}>
                <BookOpen24Regular style={{ color: "var(--colorNeutralForeground1)" }} />
                <Text size={200} weight="semibold">{t('settings.user_manual')}</Text>
              </div>
              <Open20Regular style={{ color: "var(--colorNeutralForeground3)" }} />
            </div>

            <div className={styles.socialTile} onClick={() => openUrl(links.officialGroup)}>
              <div className={styles.socialTileLeft}>
                <Chat24Regular style={{ color: "var(--colorNeutralForeground1)" }} />
                <Text size={200} weight="semibold">{t('settings.official_group')}</Text>
              </div>
              <Open20Regular style={{ color: "var(--colorNeutralForeground3)" }} />
            </div>

            <div className={styles.socialTile} onClick={() => openUrl(links.feedback)}>
              <div className={styles.socialTileLeft}>
                <Heart24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
                <Text size={200} weight="semibold">{t('settings.feedback')}</Text>
              </div>
              <Open20Regular style={{ color: "var(--colorNeutralForeground3)" }} />
            </div>

            <div className={styles.socialTile} onClick={() => openUrl(links.contact)}>
              <div className={styles.socialTileLeft}>
                <Person24Regular style={{ color: "var(--colorNeutralForeground1)" }} />
                <Text size={200} weight="semibold">{t('settings.contact_us')}</Text>
              </div>
              <Open20Regular style={{ color: "var(--colorNeutralForeground3)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* 开源许可弹窗 */}
      <Dialog open={isOpenSourceDialogOpen} onOpenChange={(_, d) => setIsOpenSourceDialogOpen(d.open)}>
        <DialogSurface className={styles.openSourceDialog}>
          <DialogBody>
            <DialogTitle>{t('settings.opensource_projects')}</DialogTitle>
            <DialogContent>
              <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                玩机管家由以下优秀的开源项目驱动，感谢开源社区的卓越贡献：
              </Text>
              <div className={styles.openSourceGrid}>
                {OPEN_SOURCE_PROJECTS.map((project) => (
                  <div key={project.name} className={styles.openSourceItem}>
                    <div>
                      <div className={styles.openSourceName}>{project.name}</div>
                      <div className={styles.openSourceDesc}>{project.description}</div>
                    </div>
                    <span className={styles.openSourceLicense}>{project.license}</span>
                  </div>
                ))}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" className={styles.pillButton} onClick={() => setIsOpenSourceDialogOpen(false)}>
                {t('common.close', '关闭')}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 鸣谢列表弹窗 */}
      <Dialog open={isThanksDialogOpen} onOpenChange={(_, d) => setIsThanksDialogOpen(d.open)}>
        <DialogSurface className={styles.openSourceDialog}>
          <DialogBody>
            <DialogTitle>{t('settings.thanks_list')}</DialogTitle>
            <DialogContent>
              <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                致敬在 Android 工具、解包技术与开源生态中做出贡献的开发者与团队：
              </Text>
              <div className={styles.openSourceGrid}>
                {THANKS_PROJECTS.map((item) => (
                  <div key={item.name} className={styles.openSourceItem} style={{ cursor: "pointer" }} onClick={() => openUrl(item.url)}>
                    <div>
                      <div className={styles.openSourceName}>{item.name}</div>
                      <div className={styles.openSourceDesc}>{item.description}</div>
                    </div>
                    <Open20Regular style={{ color: "var(--colorNeutralForeground3)", flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" className={styles.pillButton} onClick={() => setIsThanksDialogOpen(false)}>
                {t('common.close', '关闭')}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 赞助支持弹窗 */}
      <Dialog open={isDonationDialogOpen} onOpenChange={(_, d) => setIsDonationDialogOpen(d.open)}>
        <DialogSurface className={styles.openSourceDialog}>
          <DialogBody>
            <DialogTitle>{t('settings.donate_us')}</DialogTitle>
            <DialogContent>
              <DonationPanel />
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" className={styles.pillButton} onClick={() => setIsDonationDialogOpen(false)}>
                {t('common.close', '关闭')}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default AboutPanel;
