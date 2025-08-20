import React, { useState } from 'react';
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Button,
  Field,
  Input,
  Spinner,
  Badge,
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
} from "@fluentui/react-components";
import {
  Info24Regular,
  FolderOpen24Regular,
  Shield24Regular,
  Settings24Regular,
  Document24Regular,
} from "@fluentui/react-icons";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { ApkInfo } from "../../types/device";
import { open } from "@tauri-apps/plugin-dialog";

const useStyles = makeStyles({
  card: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  content: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  pathInput: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
  },
  infoSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  permissionsList: {
    maxHeight: "200px",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  permissionItem: {
    padding: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "4px",
    fontSize: "12px",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "200px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
    gap: "12px",
    color: "var(--colorNeutralForeground3)",
  },
});

const ApkInfoCard: React.FC = () => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();

  const [apkPath, setApkPath] = useState("");
  const [apkInfo, setApkInfo] = useState<ApkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleBrowseApk = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'APK Files',
          extensions: ['apk']
        }]
      });
      
      if (selected && typeof selected === 'string') {
        setApkPath(selected);
        loadApkInfo(selected);
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "文件选择失败",
        message: `无法选择文件: ${error}`,
      });
    }
  };

  const loadApkInfo = async (path: string) => {
    if (!path) return;

    setIsLoading(true);
    try {
      const info = await deviceService.getApkInfo(path);
      setApkInfo(info);
    } catch (error) {
      addNotification({
        type: "error",
        title: "APK信息获取失败",
        message: `无法解析APK文件: ${error}`,
      });
      setApkInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPermissionCategory = (permission: string): string => {
    if (permission.includes('CAMERA')) return '相机';
    if (permission.includes('LOCATION')) return '位置';
    if (permission.includes('MICROPHONE') || permission.includes('RECORD_AUDIO')) return '麦克风';
    if (permission.includes('STORAGE') || permission.includes('EXTERNAL_STORAGE')) return '存储';
    if (permission.includes('PHONE') || permission.includes('CALL')) return '电话';
    if (permission.includes('SMS') || permission.includes('MESSAGE')) return '短信';
    if (permission.includes('CONTACTS')) return '联系人';
    if (permission.includes('CALENDAR')) return '日历';
    if (permission.includes('INTERNET') || permission.includes('NETWORK')) return '网络';
    return '其他';
  };

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Info24Regular />}
        header={<Text weight="semibold">APK信息</Text>}
        description={<Text size={200}>查看APK文件详细信息</Text>}
      />
      
      <div className={styles.content}>
        <div className={styles.pathInput}>
          <Field label="APK文件路径:" style={{ flex: 1 }}>
            <Input
              value={apkPath}
              onChange={(_, data) => setApkPath(data.value)}
              placeholder="选择要分析的APK文件"
            />
          </Field>
          <Button
            appearance="secondary"
            icon={<FolderOpen24Regular />}
            onClick={handleBrowseApk}
          >
            浏览
          </Button>
          <Button
            appearance="primary"
            icon={<Info24Regular />}
            onClick={() => loadApkInfo(apkPath)}
            disabled={!apkPath || isLoading}
          >
            分析
          </Button>
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <Spinner size="large" label="正在分析APK文件..." />
          </div>
        ) : !apkInfo ? (
          <div className={styles.emptyState}>
            <Document24Regular style={{ fontSize: "48px" }} />
            <Text>选择APK文件以查看详细信息</Text>
          </div>
        ) : (
          <div className={styles.infoSection}>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <Text weight="semibold">应用名称</Text>
                <Text>{apkInfo.appName || "未知"}</Text>
              </div>
              <div className={styles.infoItem}>
                <Text weight="semibold">包名</Text>
                <Text size={200}>{apkInfo.packageName || "未知"}</Text>
              </div>
              <div className={styles.infoItem}>
                <Text weight="semibold">版本名称</Text>
                <Text>{apkInfo.versionName || "未知"}</Text>
              </div>
              <div className={styles.infoItem}>
                <Text weight="semibold">版本代码</Text>
                <Text>{apkInfo.versionCode || "未知"}</Text>
              </div>
              <div className={styles.infoItem}>
                <Text weight="semibold">文件大小</Text>
                <Text>{formatFileSize(apkInfo.fileSize)}</Text>
              </div>
              <div className={styles.infoItem}>
                <Text weight="semibold">最小SDK版本</Text>
                <Text>{apkInfo.minSdkVersion || "未知"}</Text>
              </div>
              <div className={styles.infoItem}>
                <Text weight="semibold">目标SDK版本</Text>
                <Text>{apkInfo.targetSdkVersion || "未知"}</Text>
              </div>
              <div className={styles.infoItem}>
                <Text weight="semibold">编译SDK版本</Text>
                <Text>{apkInfo.compileSdkVersion || "未知"}</Text>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {apkInfo.isDebuggable && (
                <Badge appearance="filled" color="warning">
                  调试版本
                </Badge>
              )}
              {apkInfo.isTestOnly && (
                <Badge appearance="filled" color="danger">
                  测试专用
                </Badge>
              )}
            </div>

            <Accordion multiple collapsible>
              <AccordionItem value="permissions">
                <AccordionHeader icon={<Shield24Regular />}>
                  权限列表 ({apkInfo.permissions.length})
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.permissionsList}>
                    {apkInfo.permissions.length === 0 ? (
                      <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                        此应用不需要特殊权限
                      </Text>
                    ) : (
                      apkInfo.permissions.map((permission, index) => (
                        <div key={index} className={styles.permissionItem}>
                          <Text size={200} weight="semibold">
                            {getPermissionCategory(permission)}
                          </Text>
                          <Text size={100} style={{ color: "var(--colorNeutralForeground2)" }}>
                            {permission}
                          </Text>
                        </div>
                      ))
                    )}
                  </div>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem value="features">
                <AccordionHeader icon={<Settings24Regular />}>
                  功能特性 ({apkInfo.features.length})
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.permissionsList}>
                    {apkInfo.features.length === 0 ? (
                      <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                        未声明特殊功能特性
                      </Text>
                    ) : (
                      apkInfo.features.map((feature, index) => (
                        <div key={index} className={styles.permissionItem}>
                          <Text size={200}>{feature}</Text>
                        </div>
                      ))
                    )}
                  </div>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ApkInfoCard;
