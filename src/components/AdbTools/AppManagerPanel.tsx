import React, { useState, useCallback, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Badge,
  Card,
  CardHeader,
  Button,
  Field,
  Input,
  Spinner,
  Checkbox,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from "@fluentui/react-components";
import {
  Apps24Regular,
  ArrowClockwise24Regular,
  Delete24Regular,
  Info24Regular,
  Search24Regular,
  MoreHorizontal24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { InstalledApp, BatchOperation } from "../../types/device";
import ErrorDialog from "../Common/ErrorDialog";
import { ErrorInfo } from "../../utils/errorHandler";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "12px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 4px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  tabContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  gridLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "12px",
    height: "100%",
  },
  threeColumnLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "12px",
    height: "100%",
  },
  fullLayout: {
    height: "100%",
  },
  card: {
    width: "100%",
    height: "fit-content",
    /* 支持下拉*/
    "--scrollbarWidth": "8px",
    "scrollbar-width": "8px",
  },
  content: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  toolbar: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  searchField: {
    flex: 1,
    minWidth: "200px",
  },
  tableContainer: {
    flex: 1,
    maxHeight: "400px",
    overflow: "auto",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "6px",
    "&::-webkit-scrollbar": {
      width: "8px",
      height: "8px",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: "var(--colorNeutralBackground2)",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "var(--colorNeutralStroke2)",
      borderRadius: "4px",
      "&:hover": {
        backgroundColor: "var(--colorNeutralStroke1)",
      },
    },
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
  appIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "4px",
    backgroundColor: "var(--colorNeutralBackground2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  compactTableRow: {
    height: "40px",
  },
  truncatedText: {
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    cursor: "pointer",
    "&:hover": {
      overflow: "visible",
      whiteSpace: "normal",
      wordBreak: "break-all",
      backgroundColor: "var(--colorNeutralBackground1)",
      padding: "4px",
      borderRadius: "4px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      zIndex: 1000,
      position: "relative",
    },
  },
  packageNameText: {
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    cursor: "pointer",
    fontFamily: "monospace",
    fontSize: "12px",
    "&:hover": {
      overflow: "visible",
      whiteSpace: "normal",
      wordBreak: "break-all",
      backgroundColor: "var(--colorNeutralBackground1)",
      padding: "4px",
      borderRadius: "4px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      zIndex: 1000,
      position: "relative",
    },
  },
  compactCell: {
    padding: "4px 8px",
    verticalAlign: "middle",
  },
  appNameContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    minWidth: 0,
  },
  appNameText: {
    minWidth: 0,
    flex: 1,
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
});

interface InstallStatus {
  fileName: string;
  status: "installing" | "success" | "failed";
  progress: number;
  message?: string;
}

interface ConnectionInfo {
  serial: string;
  state: string;
  connected: boolean;
  adb_version?: string;
  usb_connection: boolean;
  wifi_connection: boolean;
  connection_type: string;
}

const AppManagerPanel: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();
  const { setStatusBarMessage } = useAppStore();

  // 无需状态管理，已移除标签页相关状态
  const [errorInfo] = useState<ErrorInfo | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  // 应用管理相关状态
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [filteredApps, setFilteredApps] = useState<InstalledApp[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [includeSystemApps, setIncludeSystemApps] = useState(false);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [confirmUninstallDialogOpen, setConfirmUninstallDialogOpen] = useState(false);
  const [appToUninstall, setAppToUninstall] = useState<InstalledApp | null>(null);
  const [batchOperationUninstall, setBatchOperationUninstall] = useState<BatchOperation | null>(null);
  const [batchUninstallDialogOpen, setBatchUninstallDialogOpen] = useState(false);

  // 应用管理相关函数
  const loadApps = useCallback(async () => {
    if (!selectedDevice) return;

    setIsLoadingApps(true);
    try {
      // 使用 adb shell pm list packages 命令获取包列表
      const command = includeSystemApps ? "pm list packages" : "pm list packages -3";
      const result = await deviceService.executeAdbCommand(
        selectedDevice.serial,
        "shell",
        [command]
      );

      if (result.success && result.output) {
        // 解析包列表输出
        const packageLines = result.output.split('\n').filter(line => line.startsWith('package:'));
        const installedApps: InstalledApp[] = [];

        for (const line of packageLines) {
          const packageName = line.replace('package:', '').trim();
          if (packageName) {
            // 获取应用的基本信息
            try {
              // 尝试获取应用名称
              const labelResult = await deviceService.executeAdbCommand(
                selectedDevice.serial,
                "shell",
                [`pm dump ${packageName} | grep -E "(applicationLabel|versionName|versionCode)" | head -3`]
              );

              let appName = packageName; // 默认使用包名
              let versionName = "未知";
              let versionCode = 0;

              if (labelResult.success && labelResult.output) {
                const lines = labelResult.output.split('\n');
                for (const infoLine of lines) {
                  if (infoLine.includes('applicationLabel')) {
                    const match = infoLine.match(/applicationLabel=(.+)/);
                    if (match) appName = match[1].trim();
                  } else if (infoLine.includes('versionName')) {
                    const match = infoLine.match(/versionName=(.+)/);
                    if (match) versionName = match[1].trim();
                  } else if (infoLine.includes('versionCode')) {
                    const match = infoLine.match(/versionCode=(\d+)/);
                    if (match) versionCode = parseInt(match[1]);
                  }
                }
              }

              installedApps.push({
                packageName,
                appName,
                versionName,
                versionCode: versionCode.toString(),
                isSystemApp: !includeSystemApps ? false : true,
                isEnabled: true, // 默认启用
                installTime: new Date().toISOString(), // 转换为字符串
                updateTime: new Date().toISOString(),
                apkPath: "", // ADB命令无法直接获取APK路径
                permissions: [], // 暂不获取权限信息
              });
            } catch (appError) {
              // 如果获取单个应用信息失败，仍然添加基本信息
              installedApps.push({
                packageName,
                appName: packageName,
                versionName: "未知",
                versionCode: "0",
                isSystemApp: !includeSystemApps ? false : true,
                isEnabled: true,
                installTime: new Date().toISOString(),
                updateTime: new Date().toISOString(),
                apkPath: "",
                permissions: [],
              });
            }
          }
        }

        setApps(installedApps);
        setStatusBarMessage({
          type: "success",
          message: `成功获取 ${installedApps.length} 个已安装应用`,
        });
      } else {
        throw new Error(result.error || "获取包列表失败");
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `无法获取已安装应用列表: ${error}`,
      });
      setApps([]);
    } finally {
      setIsLoadingApps(false);
    }
  }, [selectedDevice, includeSystemApps, deviceService, setStatusBarMessage]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredApps(apps);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = apps.filter(app => {
      const nameMatch = app.appName?.toLowerCase().includes(query) || false;
      const packageMatch = app.packageName?.toLowerCase().includes(query) || false;
      return nameMatch || packageMatch;
    });
    setFilteredApps(filtered);
  }, [apps, searchQuery]);

  const handleUninstallClick = (app: InstalledApp) => {
    setAppToUninstall(app);
    setConfirmUninstallDialogOpen(true);
  };

  const confirmUninstall = async () => {
    if (!selectedDevice || !appToUninstall) return;

    setConfirmUninstallDialogOpen(false);
    try {
      // 使用 adb shell pm uninstall 命令卸载应用
      const result = await deviceService.executeAdbCommand(
        selectedDevice.serial,
        "shell",
        [`pm uninstall ${appToUninstall.packageName}`]
      );

      if (result.success) {
        // 检查输出是否包含成功信息
        if (result.output && (result.output.includes('Success') || result.output.includes('成功'))) {
          setStatusBarMessage({
            type: "success",
            message: `${appToUninstall.appName || appToUninstall.packageName} 已成功卸载`,
          });
          loadApps(); // 重新加载应用列表
        } else {
          setStatusBarMessage({
            type: "error",
            message: result.output || result.error || "应用卸载失败",
          });
        }
      } else {
        setStatusBarMessage({
          type: "error",
          message: result.error || "应用卸载失败",
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `应用卸载失败: ${error}`,
      });
    }
    setAppToUninstall(null);
  };

  const handleSelectApp = (packageName: string, checked: boolean) => {
    const newSelected = new Set(selectedApps);
    if (checked) {
      newSelected.add(packageName);
    } else {
      newSelected.delete(packageName);
    }
    setSelectedApps(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApps(new Set(filteredApps.map(app => app.packageName)));
    } else {
      setSelectedApps(new Set());
    }
  };

  const handleBatchUninstall = async () => {
    if (!selectedDevice || selectedApps.size === 0) return;

    const packageNames = Array.from(selectedApps);
    let successCount = 0;
    let failCount = 0;
    const results: string[] = [];

    try {
      setStatusBarMessage({
        type: "info",
        message: `开始卸载 ${packageNames.length} 个应用...`,
      });

      // 逐个卸载应用
      for (const packageName of packageNames) {
        try {
          const result = await deviceService.executeAdbCommand(
            selectedDevice.serial,
            "shell",
            [`pm uninstall ${packageName}`]
          );

          if (result.success && result.output && 
              (result.output.includes('Success') || result.output.includes('成功'))) {
            successCount++;
            results.push(`✓ ${packageName}: 卸载成功`);
          } else {
            failCount++;
            results.push(`✗ ${packageName}: ${result.output || result.error || '卸载失败'}`);
          }
        } catch (error) {
          failCount++;
          results.push(`✗ ${packageName}: ${error}`);
        }
      }

      // 显示批量卸载结果
      setStatusBarMessage({
        type: successCount > 0 ? "success" : "error",
        message: `成功: ${successCount}个, 失败: ${failCount}个`,
      });

      // 创建批量操作结果对象
      const operation: BatchOperation = {
        id: Date.now().toString(),
        operationType: 'uninstall',
        totalItems: packageNames.length,
        completedItems: successCount + failCount,
        failedItems: failCount,
        status: 'completed',
        items: results.map((result, index) => ({
          id: `${Date.now()}_${index}`,
          name: packageNames[index],
          status: result.startsWith('✓') ? 'success' : 'failed',
          message: result,
        })),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      };

      setBatchOperationUninstall(operation);
      setBatchUninstallDialogOpen(true);

      // 清空选择
      setSelectedApps(new Set());

      // 重新加载应用列表
      loadApps();

    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `批量卸载操作失败: ${error}`,
      });
    }
  };

  const renderContent = () => {
    return (
      <div className={styles.threeColumnLayout}>


        {/* 已安装应用卡片 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Apps24Regular />}
            header={<Text weight="semibold">已安装应用</Text>}
            description={<Text size={200}>管理设备上的应用程序</Text>}
            action={
              <Button
                appearance="subtle"
                icon={isLoadingApps ? <Spinner size="tiny" /> : <ArrowClockwise24Regular />}
                onClick={loadApps}
                disabled={isLoadingApps}
                title="刷新应用列表"
              />
            }
          />
          
          <div className={styles.content}>
            <div className={styles.toolbar}>
              <Field className={styles.searchField}>
                <Input
                  contentBefore={<Search24Regular />}
                  placeholder="搜索应用名称或包名..."
                  value={searchQuery}
                  onChange={(_, data) => setSearchQuery(data.value)}
                />
              </Field>
              
              <Checkbox
                label="包含系统应用"
                checked={includeSystemApps}
                onChange={(_, data) => setIncludeSystemApps(data.checked === true)}
              />
              
              {selectedApps.size > 0 && (
                <Button
                  appearance="primary"
                  icon={<Delete24Regular />}
                  onClick={handleBatchUninstall}
                  disabled={isLoadingApps}
                >
                  批量卸载 ({selectedApps.size})
                </Button>
              )}
            </div>

            {isLoadingApps ? (
              <div className={styles.loadingContainer}>
                <Spinner size="large" label="正在加载应用列表..." />
              </div>
            ) : filteredApps.length === 0 ? (
              <div className={styles.emptyState}>
                <Apps24Regular style={{ fontSize: "48px" }} />
                <Text>未找到应用</Text>
                <Text size={200}>尝试调整搜索条件或刷新列表</Text>
                <Button 
                  appearance="primary" 
                  icon={<ArrowClockwise24Regular />} 
                  onClick={loadApps}
                >
                  刷新应用列表
                </Button>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <Table arial-label="已安装应用列表" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <colgroup>
                    {/* 选择框列：固定较小宽度 */}
                    <col style={{ width: 48 }} />
                    {/* 应用列：双倍宽度，占余下空间的40% */}
                    <col style={{ width: '40%' }} />
                    {/* 其他列：各占20% */}
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '20%' }} />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>
                        <Checkbox
                          checked={selectedApps.size === filteredApps.length && filteredApps.length > 0}
                          onChange={(_, data) => handleSelectAll(data.checked === true)}
                        />
                      </TableHeaderCell>
                      <TableHeaderCell>应用</TableHeaderCell>
                      <TableHeaderCell>版本</TableHeaderCell>
                      <TableHeaderCell>版本</TableHeaderCell>
                      <TableHeaderCell>状态</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApps.map((app) => (
                      <TableRow key={app.packageName} className={styles.compactTableRow}>
                        <TableCell className={styles.compactCell}>
                          <Checkbox
                            checked={selectedApps.has(app.packageName)}
                            onChange={(_, data) => handleSelectApp(app.packageName, data.checked === true)}
                          />
                        </TableCell>
                        <TableCell className={styles.compactCell}>
                          <Text size={200} className={styles.packageNameText} title={app.packageName}>
                            {app.packageName}
                          </Text>
                        </TableCell>
                        <TableCell className={styles.compactCell}>
                          <Text size={200}>{app.versionName || "未知"}</Text>
                        </TableCell>
                        <TableCell className={styles.compactCell}>
                          <Badge appearance={app.isEnabled ? "filled" : "outline"} color={app.isEnabled ? "success" : "warning"} size="small">
                            {app.isEnabled ? "启用" : "禁用"}
                          </Badge>
                        </TableCell>
                        <TableCell className={styles.compactCell}>
                          <Menu>
                            <MenuTrigger disableButtonEnhancement>
                              <Button
                                appearance="subtle"
                                icon={<MoreHorizontal24Regular />}
                                size="small"
                              />
                            </MenuTrigger>
                            <MenuPopover>
                              <MenuList>
                                <MenuItem
                                  icon={<Info24Regular />}
                                  onClick={() => {
                                    // 可以在这里显示应用详细信息对话框
                                  }}
                                >
                                  查看详情
                                </MenuItem>
                                {!app.isSystemApp && (
                                  <MenuItem
                                    icon={<Delete24Regular />}
                                    onClick={() => handleUninstallClick(app)}
                                  >
                                    卸载应用
                                  </MenuItem>
                                )}
                              </MenuList>
                            </MenuPopover>
                          </Menu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>

      </div>
    );
  };

  return (
    <div className={styles.container}>
      {renderContent()}

      <ErrorDialog
        open={errorDialogOpen}
        errorInfo={errorInfo}
        onClose={() => setErrorDialogOpen(false)}
        onRetry={() => {
          // 实现重试逻辑
          setErrorDialogOpen(false);
        }}
        showDetails={true}
      />


      {/* 应用卸载确认对话框 */}
      <Dialog open={confirmUninstallDialogOpen} onOpenChange={(_, data) => setConfirmUninstallDialogOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>确认卸载应用</DialogTitle>
          <DialogContent>
            <DialogBody>
              <Text>
                确定要卸载应用 <strong>{appToUninstall?.appName || appToUninstall?.packageName}</strong> 吗？
              </Text>
              <br />
              <Text size={200} style={{ color: "var(--colorPaletteRedForeground1)" }}>
                ⚠️ 此操作将删除应用及其数据，无法撤销
              </Text>
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">取消</Button>
            </DialogTrigger>
            <Button appearance="primary" onClick={confirmUninstall}>
              确认卸载
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>


    </div>
  );
};

export default AppManagerPanel;