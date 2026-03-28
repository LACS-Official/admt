import React, { useState, useEffect} from 'react';
import { versionManager, useVersionInfo } from '../../utils/versionManager';
import { admtLogo128 } from "../../assets/icons";
import { lacsbgIcon } from "../../assets/icons";
import VersionChecker from "../Common/VersionChecker";

import {
  makeStyles,
  mergeClasses,
  Text,
  Card,
  CardHeader,
  Button,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Spinner,
  shorthands,
  Tooltip,
} from "@fluentui/react-components";
import {
  Info24Regular,
  Heart24Regular,
  Code24Regular,
  Globe24Regular,
  Person24Regular,
  Building24Regular,
  ArrowUpload24Regular,
  BookOpen24Regular,
  Chat24Regular,
  Map24Regular,
  Handshake24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";





const useStyles = makeStyles({
  container: {
    ...shorthands.padding("12px"),
    height: "100%",
    ...shorthands.overflow("auto"),
    backgroundColor: "var(--colorNeutralBackground3)", // Subtle background for the whole page
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr", // Asymmetric layout
    ...shorthands.gap("20px"),
    maxWidth: "1100px",
    ...shorthands.margin("0", "auto"),
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  // Hero section (About App)
  heroCard: {
    gridColumn: "1 / 2",
    "@media (max-width: 900px)": {
      gridColumn: "1 / -1",
    },
    ...shorthands.border("none"),
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
  },
  heroContent: {
    padding: "32px 24px",
    display: "flex",
    flexDirection: "row",
    gap: "32px",
    alignItems: "center",
    "@media (max-width: 600px)": {
      flexDirection: "column",
      textAlign: "center",
    },
  },
  appLogoLarge: {
    width: "120px",
    height: "120px",
    ...shorthands.borderRadius("20px"),
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  logoSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  heroInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  versionText: {
    color: "var(--colorBrandForeground1)",
    letterSpacing: "0.02em",
  },
  heroButtonGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    ...shorthands.gap("8px"),
    marginTop: "8px",
  },
  heroButton: {
    ...shorthands.padding("0", "12px"),
    height: "36px",
    justifyContent: "center",
  },
  
  // Team side card
  teamCard: {
    gridColumn: "2 / 3",
    "@media (max-width: 900px)": {
      gridColumn: "1 / -1",
    },
    ...shorthands.border("none"),
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  teamContent: {
    ...shorthands.padding("24px"),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "12px",
  },
  teamLogoRect: {
    width: "140px",
    height: "78.75px", // 16:9 aspect ratio (140 / 16 * 9)
    ...shorthands.borderRadius("12px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke3)"),
    marginBottom: "8px",
    objectFit: "cover",
  },
  teamButtonGrid: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },

  // Social/Community section
  communitySection: {
    gridColumn: "1 / -1",
    ...shorthands.padding("16px", "0"),
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    ...shorthands.padding("0", "8px"),
  },
  headerLine: {
    height: "1px",
    flex: 1,
    backgroundColor: "var(--colorNeutralStroke2)",
  },
  socialGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "12px",
  },
  socialButton: {
    height: "56px",
    justifyContent: "flex-start",
    ...shorthands.padding("0", "16px"),
    "& svg": {
      fontSize: "20px",
    },
  },

  // Footer Grid removed as per user request

  // Dialog styles
  openSourceDialog: {
    maxWidth: "800px",
    maxHeight: "80vh",
  },
  openSourceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
    marginTop: "16px",
    ...shorthands.overflow("auto"),
    maxHeight: "400px",
    paddingRight: "8px",
  },
  openSourceItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    ...shorthands.padding("12px"),
    ...shorthands.borderRadius("6px"),
    backgroundColor: "var(--colorNeutralBackground2)",
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
  },
  openSourceName: {
    fontWeight: "600",
    marginBottom: "4px",
  },
  openSourceDesc: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
  openSourceLicense: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
    backgroundColor: "var(--colorNeutralBackground3)",
    ...shorthands.padding("2px", "6px"),
    ...shorthands.borderRadius("4px"),
    fontWeight: "500",
  },
});

// 开源项目数据 - 本项目直接使用的开源项目
// 要添加新项目，只需在这个数组中添加一条记录即可
// 格式：{ name: "项目名称", description: "项目描述", license: "许可证类型" }
const OPEN_SOURCE_PROJECTS = [
  {
    name: "Tauri",
    description: "跨平台桌面应用框架，使用Rust和Web技术",
    license: "MIT"
  },
  {
    name: "React",
    description: "用于构建用户界面的JavaScript库",
    license: "MIT"
  },
  {
    name: "Fluent UI",
    description: "Microsoft设计语言的React组件库",
    license: "MIT"
  },
  {
    name: "Vite",
    description: "下一代前端构建工具",
    license: "MIT"
  },
  {
    name: "TypeScript",
    description: "JavaScript的超集，添加了类型系统",
    license: "Apache-2.0"
  },
  {
    name: "ADB (Android Debug Bridge)",
    description: "Android调试桥，用于设备通信",
    license: "Apache-2.0"
  },
  {
    name: "Fastboot",
    description: "Android快速启动工具",
    license: "Apache-2.0"
  },
  {
    name: "Scrcpy",
    description: "Android屏幕镜像工具",
    license: "Apache-2.0"
  },
  {
    name: "FFmpeg",
    description: "音视频处理库 (avcodec, avformat, avutil)",
    license: "LGPL/GPL"
  },
  {
    name: "SDL2",
    description: "跨平台多媒体库",
    license: "Zlib"
  }
];

// 致谢项目数据 - 感谢和参考的项目，但不一定直接使用
// 要添加新项目，只需在这个数组中添加一条记录即可
// 格式：{ name: "项目名称", description: "项目描述", url: "项目链接", category: "分类名称" }
const THANKS_PROJECTS = [
  {
    name: "Xiaomi-HyperOS-BootLoader-Bypass",
    description: "小米HyperOS BootLoader绕过工具",
    url: "https://github.com/MlgmXyysd/Xiaomi-HyperOS-BootLoader-Bypass",
    category: "Android工具"
  },
    {
    name: "雪糕小豪,酷安@24524599",
    description: "感谢大佬提供的部分思路，在此致敬",
    url: "https://b23.tv/ka645O6",
    category: "思路"
  },
];

// 按分类组织项目
const GROUPED_PROJECTS = THANKS_PROJECTS.reduce((acc, project) => {
  if (!acc[project.category]) {
    acc[project.category] = [];
  }
  acc[project.category].push(project);
  return acc;
}, {} as Record<string, typeof THANKS_PROJECTS>);

// 打开链接的通用函数
const openUrl = (url: string) => {
  import('@tauri-apps/plugin-shell').then(({ open }) => {
    open(url).catch((error) => {
      console.error('Failed to open URL:', error);
      // 如果 Tauri shell 插件不可用，使用 window.open
      window.open(url, '_blank');
    });
  }).catch(() => {
    // 如果 Tauri shell 插件不可用，使用 window.open
    window.open(url, '_blank');
  });
};

import DonationPanel from "./DonationPanel";

interface AboutPanelProps {
}

const AboutPanel: React.FC<AboutPanelProps> = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [isOpenSourceDialogOpen, setIsOpenSourceDialogOpen] = useState(false);
  const [isThanksDialogOpen, setIsThanksDialogOpen] = useState(false);
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const { versionInfo, loading: versionLoading } = useVersionInfo();
  const [fullVersionString, setFullVersionString] = useState('玩机管家 v1.0.0');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [triggerVersionCheck, setTriggerVersionCheck] = useState(false);

  // 获取完整版本字符串
  useEffect(() => {
    const loadVersionString = async () => {
      try {
        const fullVersion = await versionManager.getFullVersionString();
        setFullVersionString(`${fullVersion}`);
      } catch (error) {
        console.error('获取版本字符串失败:', error);
        setFullVersionString('v1.0.0');
      }
    };

    loadVersionString();
  }, [versionInfo]);

  // 处理检查更新
  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    setTriggerVersionCheck(prev => !prev); // 切换状态以触发 VersionChecker 的检查
  };

  // 版本检查完成回调
  const handleUpdateCheckComplete = () => {
    setIsCheckingUpdate(false);
  };

  // 链接数据
  const links = {
    checkUpdate: "https://admt.lacs.cc/download",
    userManual: "https://admt.lacs.cc/docs",
    feedback: "https://admt.lacs.cc/feedback",
    otherapps:"https://www.lacs.cc/#projects",
    officialWebsite: "https://www.lacs.cc",
    officialADMTWeb: "https://admt.lacs.cc",
    officialGroup: "https://www.lacs.cc/contact#qun-group",
    contact: "https://www.lacs.cc/contact",
    donate: "https://www.lacs.cc/donate",
  };

  

  const handleOpenManual = () => {
    openUrl(links.userManual);
  };

  const handleFeedback = () => {
    openUrl(links.feedback);
  };

  const handleOpenSourceInfo = () => {
    setIsOpenSourceDialogOpen(true);
  };

  const handleDonate = () => {
    setIsDonationDialogOpen(true);
  };

  const handleThanksInfo = () => {
    setIsThanksDialogOpen(true);
  };

  const OpenofficialADMTWeb = () => {
    openUrl(links.officialADMTWeb);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* --- Hero Section: About Application --- */}
        <Card className={styles.heroCard}>
          <div className={styles.heroContent}>
            <div className={styles.logoSection}>
              <img src={admtLogo128} alt="appIcon" className={styles.appLogoLarge} />
              <Button 
                appearance="subtle" 
                size="small"
                icon={<Globe24Regular />}
                onClick={OpenofficialADMTWeb}
              >
                {t('settings.official_website')}
              </Button>
            </div>
            
            <div className={styles.heroInfo}>
              <Text size={700} weight="bold">
                {t('settings.app_name')}
              </Text>
              <Text size={300} weight="semibold" className={styles.versionText}>
                {versionLoading ? 'v1.0.0' : fullVersionString}
              </Text>
              <Text size={300} style={{ color: "var(--colorNeutralForeground2)", margin: '12px 0' }}>
                {t('settings.app_desc')}
              </Text>

              <div className={styles.heroButtonGrid}>
                <Button 
                  appearance="primary" 
                  size="small"
                  className={styles.heroButton}
                  icon={isCheckingUpdate ? <Spinner size="tiny" /> : <ArrowUpload24Regular />}
                  onClick={handleCheckUpdate}
                  disabled={isCheckingUpdate}
                >
                  {isCheckingUpdate ? t('settings.checking_update') : t('settings.check_update')}
                </Button>
                <Button 
                  appearance="outline" 
                  size="small"
                  className={styles.heroButton}
                  icon={<Heart24Regular />}
                  onClick={handleDonate}
                >
                  {t('settings.donate_us')}
                </Button>
                <Button 
                  appearance="outline" 
                  size="small"
                  className={styles.heroButton}
                  icon={<Code24Regular />}
                  onClick={handleOpenSourceInfo}
                >
                  {t('settings.opensource_projects')}
                </Button>
                <Button 
                  appearance="outline" 
                  size="small"
                  className={styles.heroButton}
                  icon={<Code24Regular />}
                  onClick={handleThanksInfo}
                >
                  {t('settings.thanks_list')}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Hidden Version Checker */}
          <VersionChecker 
            triggerCheck={triggerVersionCheck}
            onCheckUpdate={handleUpdateCheckComplete}
            onNoUpdate={handleUpdateCheckComplete}
            onError={handleUpdateCheckComplete}
          />
        </Card>

        {/* --- Team Info Side Card --- */}
        <Card className={styles.teamCard}>
          <div className={styles.teamContent}>
            <img src={lacsbgIcon} alt="teamIcon" className={styles.teamLogoRect} />
            <Text size={500} weight="bold">{t('settings.team_name')}</Text>
            <Text size={200} weight="semibold" style={{ color: "var(--colorNeutralForeground3)" }}>
              Lead And Creative Studio
            </Text>
            <Text size={200} style={{ color: "var(--colorNeutralForeground2)", marginTop: '4px' }}>
              {t('settings.team_desc')}
            </Text>
            <div className={styles.teamButtonGrid}>
              <Button 
                appearance="subtle" 
                size="small"
                icon={<Globe24Regular />}
                onClick={() => openUrl(links.officialWebsite)}
              >
                {t('settings.official_website')}
              </Button>
              <Button 
                appearance="subtle" 
                size="small"
                icon={<Map24Regular />}
                onClick={() => openUrl(links.otherapps)}
              >
                {t('settings.our_products')}
              </Button>
            </div>
          </div>
        </Card>

        {/* --- Community & Social Section --- */}
        <div className={styles.communitySection}>
          <div className={styles.sectionHeader}>
            <Text size={400} weight="semibold" style={{ color: "var(--colorNeutralForeground3)" }}>
              {t('common.community_social', "社区与社交")}
            </Text>
            <div className={styles.headerLine} />
          </div>

          <div className={styles.socialGrid}>
            <Button 
              className={styles.socialButton}
              appearance="outline"
              icon={<BookOpen24Regular />}
              onClick={handleOpenManual}
            >
              {t('settings.user_manual')}
            </Button>
            <Button 
              className={styles.socialButton}
              appearance="outline"
              icon={<Chat24Regular />}
              onClick={() => openUrl(links.officialGroup)}
            >
              {t('settings.official_group')}
            </Button>
            <Button 
              className={styles.socialButton}
              appearance="outline"
              icon={<Person24Regular />}
              onClick={() => openUrl(links.contact)}
            >
              {t('settings.contact_us')}
            </Button>
            <Tooltip content={t('settings.feedback')} relationship="label">
              <Button 
                className={styles.socialButton}
                appearance="outline"
                icon={<Heart24Regular />}
                onClick={handleFeedback}
              >
                {t('settings.feedback')}
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* --- Footer Banners removed --- */}

        {/* --- Dialogs --- */}
        <Dialog open={isOpenSourceDialogOpen} onOpenChange={(_e, data) => setIsOpenSourceDialogOpen(data.open)}>
          <DialogSurface className={styles.openSourceDialog}>
            <DialogBody>
              <DialogTitle>{t('settings.opensource_details')}</DialogTitle>
              <DialogContent>
                <Text size={300} style={{ color: "var(--colorNeutralForeground2)", display: 'block', marginBottom: '16px' }}>
                  {t('settings.opensource_desc')}
                </Text>
                
                <div className={styles.openSourceGrid}>
                  {OPEN_SOURCE_PROJECTS.map((project, index) => (
                    <div key={index} className={styles.openSourceItem}>
                      <div>
                        <div className={styles.openSourceName}>{project.name}</div>
                        <div className={styles.openSourceDesc}>{project.description}</div>
                      </div>
                      <div className={styles.openSourceLicense}>{project.license}</div>
                    </div>
                  ))}
                </div>
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setIsOpenSourceDialogOpen(false)}>
                  {t('settings.close')}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

        <Dialog open={isThanksDialogOpen} onOpenChange={(_e, data) => setIsThanksDialogOpen(data.open)}>
          <DialogSurface className={styles.openSourceDialog}>
            <DialogBody>
              <DialogTitle>{t('settings.thanks_details')}</DialogTitle>
              <DialogContent>
                <Text size={300} style={{ color: "var(--colorNeutralForeground2)", display: 'block', marginBottom: '16px' }}>
                  {t('settings.thanks_header')}
                </Text>
                <div className={styles.openSourceGrid}>
                  {Object.entries(GROUPED_PROJECTS).map(([category, projects]) => (
                    <div key={category}>
                      {projects.map((project, index) => (
                        <div key={index} className={styles.openSourceItem}>
                          <div style={{ flex: 1 }}>
                            <div className={styles.openSourceName}>{project.name}</div>
                            <div className={styles.openSourceDesc}>{project.description}</div>
                          </div>
                          <Button 
                            appearance="subtle" 
                            size="small"
                            onClick={() => openUrl(project.url)}
                          >
                            {t('settings.view')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setIsThanksDialogOpen(false)}>
                  {t('settings.close')}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

        <Dialog open={isDonationDialogOpen} onOpenChange={(_e, data) => setIsDonationDialogOpen(data.open)}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>扫码捐赠</DialogTitle>
              <DialogContent style={{ padding: 0 }}>
                <DonationPanel />
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setIsDonationDialogOpen(false)}>
                  {t('settings.close')}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>
    </div>
  );
};

export default AboutPanel;
