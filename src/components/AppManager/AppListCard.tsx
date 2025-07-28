import React, { useState, useEffect, useCallback } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Button,
  Input,
  Field,
  Checkbox,
  Spinner,
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
  Badge,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from "@fluentui/react-components";
import {
  Apps24Regular,
  Search24Regular,
  Delete24Regular,
  Info24Regular,
  MoreHorizontal24Regular,
  ArrowClockwise24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { InstalledApp, BatchOperation } from "../../types/device";
import BatchOperationDialog from "./BatchOperationDialog";

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
    overflow: "auto",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "6px",
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
    width: "32px",
    height: "32px",
    borderRadius: "4px",
    backgroundColor: "var(--colorNeutralBackground2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

interface AppListCardProps {
  onUninstall?: (app: InstalledApp) => void;
  onShowInfo?: (app: InstalledApp) => void;
}

const AppListCard: React.FC<AppListCardProps> = ({ onUninstall, onShowInfo }) => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();

  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [filteredApps, setFilteredApps] = useState<InstalledApp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [includeSystemApps, setIncludeSystemApps] = useState(false);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [appToUninstall, setAppToUninstall] = useState<InstalledApp | null>(null);
  const [batchOperation, setBatchOperation] = useState<BatchOperation | null>(null);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  const loadApps = useCallback(async () => {
    if (!selectedDevice) return;

    setIsLoading(true);
    try {
      const installedApps = await deviceService.getInstalledApps(
        selectedDevice.serial,
        includeSystemApps
      );
      setApps(installedApps);
    } catch (error) {
      addNotification({
        type: "error",
        title: "获取应用列表失败",
        message: `无法获取已安装应用列表: ${error}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDevice, includeSystemApps, deviceService, addNotification]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  useEffect(() => {
    const filtered = apps.filter(app => {
      const matchesSearch = 
        app.appName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
    setFilteredApps(filtered);
  }, [apps, searchQuery]);

  const handleUninstallClick = (app: InstalledApp) => {
    setAppToUninstall(app);
    setConfirmDialogOpen(true);
  };

  const confirmUninstall = async () => {
    if (!selectedDevice || !appToUninstall) return;

    setConfirmDialogOpen(false);
    try {
      const result = await deviceService.uninstallApp(
        selectedDevice.serial,
        appToUninstall.packageName
      );

      if (result.success) {
        addNotification({
          type: "success",
          title: "卸载成功",
          message: `${appToUninstall.appName || appToUninstall.packageName} 已成功卸载`,
        });
        loadApps(); // 重新加载应用列表
        onUninstall?.(appToUninstall);
      } else {
        addNotification({
          type: "error",
          title: "卸载失败",
          message: result.error || "应用卸载失败",
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "卸载失败",
        message: `应用卸载失败: ${error}`,
      });
    }
    setAppToUninstall(null);
  };

  const handleShowInfo = (app: InstalledApp) => {
    onShowInfo?.(app);
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

    try {
      const operation = await deviceService.batchUninstallApps(
        selectedDevice.serial,
        packageNames,
        false // 不保留数据
      );

      setBatchOperation(operation);
      setBatchDialogOpen(true);

      // 清空选择
      setSelectedApps(new Set());

      // 重新加载应用列表
      loadApps();

    } catch (error) {
      addNotification({
        type: "error",
        title: "批量卸载失败",
        message: `批量卸载操作失败: ${error}`,
      });
    }
  };



  if (!selectedDevice) {
    return (
      <Card className={styles.card}>
        <CardHeader
          image={<Apps24Regular />}
          header={<Text weight="semibold">已安装应用</Text>}
          description={<Text size={200}>管理设备上的应用程序</Text>}
        />
        <div className={styles.content}>
          <div className={styles.emptyState}>
            <Apps24Regular style={{ fontSize: "48px" }} />
            <Text>请先选择一个设备</Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className={styles.card}>
        <CardHeader
          image={<Apps24Regular />}
          header={<Text weight="semibold">已安装应用</Text>}
          description={<Text size={200}>管理设备上的应用程序</Text>}
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
            
            <Button
              appearance="secondary"
              icon={<ArrowClockwise24Regular />}
              onClick={loadApps}
              disabled={isLoading}
            >
              刷新
            </Button>
            
            {selectedApps.size > 0 && (
              <Button
                appearance="primary"
                icon={<Delete24Regular />}
                onClick={handleBatchUninstall}
                disabled={isLoading}
              >
                批量卸载 ({selectedApps.size})
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Spinner size="large" label="正在加载应用列表..." />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className={styles.emptyState}>
              <Apps24Regular style={{ fontSize: "48px" }} />
              <Text>未找到应用</Text>
              <Text size={200}>尝试调整搜索条件或刷新列表</Text>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <Table arial-label="已安装应用列表">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>
                      <Checkbox
                        checked={selectedApps.size === filteredApps.length && filteredApps.length > 0}
                        onChange={(_, data) => handleSelectAll(data.checked === true)}
                      />
                    </TableHeaderCell>
                    <TableHeaderCell>应用</TableHeaderCell>
                    <TableHeaderCell>包名</TableHeaderCell>
                    <TableHeaderCell>版本</TableHeaderCell>
                    <TableHeaderCell>类型</TableHeaderCell>
                    <TableHeaderCell>状态</TableHeaderCell>
                    <TableHeaderCell>操作</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => (
                    <TableRow key={app.packageName}>
                      <TableCell>
                        <Checkbox
                          checked={selectedApps.has(app.packageName)}
                          onChange={(_, data) => handleSelectApp(app.packageName, data.checked === true)}
                        />
                      </TableCell>
                      <TableCell>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div className={styles.appIcon}>
                            <Apps24Regular />
                          </div>
                          <div>
                            <Text weight="semibold">{app.appName || app.packageName}</Text>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Text size={200}>{app.packageName}</Text>
                      </TableCell>
                      <TableCell>
                        <Text size={200}>{app.versionName || "未知"}</Text>
                      </TableCell>
                      <TableCell>
                        <Badge appearance={app.isSystemApp ? "filled" : "outline"}>
                          {app.isSystemApp ? "系统" : "用户"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge appearance={app.isEnabled ? "filled" : "outline"} color={app.isEnabled ? "success" : "warning"}>
                          {app.isEnabled ? "启用" : "禁用"}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                                onClick={() => handleShowInfo(app)}
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

      <Dialog open={confirmDialogOpen} onOpenChange={(_, data) => setConfirmDialogOpen(data.open)}>
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

      <BatchOperationDialog
        open={batchDialogOpen}
        operation={batchOperation}
        onClose={() => setBatchDialogOpen(false)}
        onRetry={() => {
          // TODO: 实现重试失败项功能
          setBatchDialogOpen(false);
        }}
      />
    </>
  );
};

export default AppListCard;
