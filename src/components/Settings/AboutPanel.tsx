import React, { useState } from "react";
import {
  makeStyles,
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
} from "@fluentui/react-components";
import {
  Info24Regular,
  Heart24Regular,
  Code24Regular,
  Globe24Regular,
  ArrowUpload24Regular,
  DeviceEq24Regular,
  Wrench24Regular,
  Desktop24Regular,
  Options24Regular,
  Shield24Regular,
  Document24Regular,
  Person24Regular,
  Building24Regular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  appIconImage: {
    width: "100%",
    height: "100%",
    borderRadius: "16px",
  },
  container: {
    padding: "8px",
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
  versionBadge: {
    alignSelf: "center",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
    textAlign: "center" ,
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
  teamMembers: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  openSourceItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  openSourceInfo: {
    flex: 1,
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
    padding: "2px 6px",
    borderRadius: "4px",
    fontWeight: "500",
  },
  categoryHeader: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    marginBottom: "8px",
    marginTop: "16px",
  },
  openSourceDialog: {
    maxWidth: "800px",
    maxHeight: "80vh",
  },
  openSourceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
    marginTop: "16px",
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

const AboutPanel: React.FC = () => {
  const styles = useStyles();
  const [isOpenSourceDialogOpen, setIsOpenSourceDialogOpen] = useState(false);
  const [isThanksDialogOpen, setIsThanksDialogOpen] = useState(false);

  // 链接数据
  const links = {
    checkUpdate: "https://github.com/your-organization/admt/releases",
    userManual: "https://github.com/your-organization/admt/wiki",
    feedback: "https://github.com/your-organization/admt/issues",
    github: "https://github.com/your-organization/admt",
    officialWebsite: "https://www.lacs.cc",
    officialGroup: "https://your-organization.com/group",
    contact: "https://your-organization.com/contact"
  };

  const handleCheckUpdate = () => {
    openUrl(links.checkUpdate);
  };

  const handleOpenManual = () => {
    openUrl(links.userManual);
  };

  const handleFeedback = () => {
    openUrl(links.feedback);
  };

  const handleOpenGithub = () => {
    openUrl(links.github);
  };

  const handleOpenSourceInfo = () => {
    setIsOpenSourceDialogOpen(true);
  };

  const handleThanksInfo = () => {
    setIsThanksDialogOpen(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 关于 - 应用信息 */}
        <Card className={`${styles.card} ${styles.aboutSection}`}>
          <CardHeader
            image={<Info24Regular />}
            header={<Text weight="semibold">关于</Text>}
          />

          <div className={styles.aboutContent}>
            <img src="src-tauri/icons/admt/admt-bg.webp" alt="appIcon" className={styles.appIconImage}/>
            
            <Text size={600} weight="bold">玩机管家V1.0.0</Text>
            <Text size={300} style={{ color: "var(--colorNeutralForeground2)", textAlign: "center" }}>
              基于Tauri框架开发的现代化Android设备免费玩机工具，体积小，功能强大
            </Text>

            <div className={styles.buttonGroup}>
              <Button 
                appearance="primary" 
                size="medium"
                icon={<ArrowUpload24Regular />}
                onClick={handleCheckUpdate}
              >
                检查更新
              </Button>
              <Button 
                appearance="secondary" 
                size="medium"
                icon={<Globe24Regular />}
                onClick={handleOpenManual}
              >
                用户手册
              </Button>
              <Button 
                appearance="secondary" 
                size="medium"
                icon={<Heart24Regular />}
                onClick={handleFeedback}
              >
                问题反馈
              </Button>
              <Button 
                appearance="secondary" 
                size="medium"
                icon={<Code24Regular />}
                onClick={handleOpenGithub}
              >
                GitHub
              </Button>
            </div>
          </div>
        </Card>

        

        {/* 开发团队信息 */}
        <Card className={`${styles.card} ${styles.aboutSection}`}>
          <CardHeader
            image={<Building24Regular />}
            header={<Text weight="semibold">开发团队信息</Text>}
          />

          <div className={styles.aboutContent}>
            <img src="src-tauri/icons/admt/lacs-maxbg-all-icons.webp" alt="appIcon" className={styles.appIconImage}/>
            
            <Text size={600} weight="bold">领创工作室 LACS</Text>
            <Text size={300} style={{ color: "var(--colorNeutralForeground2)", textAlign: "center" }}>
              致力于为用户提供高质量的工具和技术解决方案，目前全网粉丝1w+
            </Text>

            <div className={styles.buttonGroup}>
              <Button 
                appearance="primary" 
                size="medium"
                icon={<Globe24Regular />}
                onClick={() => openUrl(links.officialWebsite)}
              >
                官方网站
              </Button>
              <Button 
                appearance="secondary" 
                size="medium"
                icon={<Person24Regular />}
                onClick={() => openUrl(links.officialGroup)}
              >
                官方群聊
              </Button>
              <Button 
                appearance="secondary" 
                size="medium"
                icon={<Heart24Regular />}
                onClick={() => openUrl(links.feedback)}
              >
                问题反馈
              </Button>
              <Button 
                appearance="secondary" 
                size="medium"
                icon={<Code24Regular />}
                onClick={() => openUrl(links.contact)}
              >
                联系方式
              </Button>
            </div>
          </div>
        </Card>

        {/* 开源项目 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Code24Regular />}
            header={<Text weight="semibold">开源/致谢</Text>}
          />
          <div className={styles.cardContent}>
            <Text size={300} style={{ color: "var(--colorNeutralForeground2)", textAlign: "center", marginBottom: "16px" }}>
              本项目基于多个优秀的开源项目构建，感谢所有开源贡献者
            </Text>
            
            <div style={{ textAlign: "center" , display: "flex", gap: "12px", justifyContent: "center" }}>
              <Button 
                appearance="primary" 
                size="medium"
                icon={<Code24Regular />}
                onClick={handleOpenSourceInfo}
              >
                开源项目
              </Button>
              <Button 
                appearance="primary" 
                size="medium"
                icon={<Code24Regular />}
                onClick={handleThanksInfo}
              >
                致谢列表
              </Button>
            </div>
          </div>
        </Card>

        {/* 开源项目详情弹窗 */}
        <Dialog open={isOpenSourceDialogOpen} onOpenChange={(e, data) => setIsOpenSourceDialogOpen(data.open)}>
          <DialogSurface className={styles.openSourceDialog}>
            <DialogBody>
              <DialogTitle>开源项目详情</DialogTitle>
              <DialogContent>
                <Text size={300} style={{ color: "var(--colorNeutralForeground2)", textAlign: "center", marginBottom: "16px" }}>
                  本项目基于以下优秀的开源项目构建，感谢所有开源贡献者
                </Text>
                
                <div className={styles.openSourceGrid}>
                  {OPEN_SOURCE_PROJECTS.map((project, index) => (
                    <div key={index} className={styles.openSourceItem}>
                      <div className={styles.openSourceInfo}>
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
                  关闭
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
        {/* 致谢列表弹窗 */}
        <Dialog open={isThanksDialogOpen} onOpenChange={(e, data) => setIsThanksDialogOpen(data.open)}>
          <DialogSurface className={styles.openSourceDialog}>
            <DialogBody>
              <DialogTitle>致谢列表</DialogTitle>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setIsThanksDialogOpen(false)}>
                  关闭
                </Button>
              </DialogActions>
              <DialogContent>
                <Text size={300} style={{ color: "var(--colorNeutralForeground2)", textAlign: "center", marginBottom: "16px" }}>
                  本项目使用到了以下优秀的项目，感谢所有开源贡献者
                </Text>
                <div className={styles.openSourceGrid}>
                  {Object.entries(GROUPED_PROJECTS).map(([category, projects]) => (
                    <div key={category}>

                      {projects.map((project, index) => (
                        <div key={index} className={styles.openSourceItem}>
                          <div className={styles.openSourceInfo}>
                            <div className={styles.openSourceName}>{project.name}</div>
                            <div className={styles.openSourceDesc}>{project.description}</div>
                          </div>
                          <Button 
                            appearance="secondary" 
                            size="medium"
                            onClick={() => openUrl(project.url)}
                          >
                            查看项目
                          </Button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </DialogContent>
            </DialogBody>
          </DialogSurface>
        </Dialog>



        {/* 捐赠/支持 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Code24Regular />}
            header={<Text weight="semibold">捐赠/支持</Text>}
          />
          <div className={styles.cardContent}>
            <Text size={300} style={{ color: "var(--colorNeutralForeground2)", textAlign: "center", marginBottom: "16px" }}>
              为了更好的维护和更新，我们希望您能支持我们，您的支持是我们最大的动力
            </Text>
            <div className={styles.buttonGroup}>
              <Button 
                appearance="primary" 
                size="medium"
                icon={<Code24Regular />}
                onClick={handleOpenSourceInfo}
              >
                捐赠我们
              </Button>
              <Button 
                appearance="primary" 
                size="medium"
                icon={<Code24Regular />}
                onClick={handleOpenSourceInfo}
              >
                支持列表
              </Button>
            </div>
          </div>
        </Card>

        
      </div>
    </div>
  );
};

export default AboutPanel;
