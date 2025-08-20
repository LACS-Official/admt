import React, { useEffect, useState } from 'react';
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Button,
  Input,
  Field,
  Badge,
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
  History24Regular,
  Search24Regular,
  Delete24Regular,
  MoreHorizontal24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Clock24Regular,
  ArrowClockwise24Regular,
} from "@fluentui/react-icons";

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

interface InstallHistoryItem {
  id: string;
  fileName: string;
  packageName?: string;
  deviceSerial: string;
  operationType: "install" | "uninstall";
  status: "success" | "failed" | "cancelled";
  timestamp: string;
  message?: string;
  fileSize?: number;
}

const InstallHistoryCard: React.FC = () => {
  const styles = useStyles();
  const [historyItems, setHistoryItems] = useState<InstallHistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InstallHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const filtered = historyItems.filter(item => 
      item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.packageName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deviceSerial.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [historyItems, searchQuery]);

  const loadHistory = () => {
    // 从本地存储加载历史记录
    try {
      const stored = localStorage.getItem('apk_install_history');
      if (stored) {
        const history = JSON.parse(stored);
        setHistoryItems(history);
      }
    } catch (_error) {
      // console.error('Failed to load install history:', error);
    }
  };

  const saveHistory = (items: InstallHistoryItem[]) => {
    try {
      localStorage.setItem('apk_install_history', JSON.stringify(items));
      setHistoryItems(items);
    } catch (_error) {
      // console.error('Failed to save install history:', error);
    }
  };



  const clearHistory = () => {
    saveHistory([]);
  };

  const deleteHistoryItem = (id: string) => {
    const updatedItems = historyItems.filter(item => item.id !== id);
    saveHistory(updatedItems);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckmarkCircle24Regular style={{ color: "var(--colorPaletteGreenForeground1)" }} />;
      case "failed":
        return <ErrorCircle24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />;
      case "cancelled":
        return <Clock24Regular style={{ color: "var(--colorNeutralForeground3)" }} />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge appearance="filled" color="success">成功</Badge>;
      case "failed":
        return <Badge appearance="filled" color="danger">失败</Badge>;
      case "cancelled":
        return <Badge appearance="outline">已取消</Badge>;
      default:
        return null;
    }
  };

  const getOperationBadge = (operationType: string) => {
    return operationType === "install" ? 
      <Badge appearance="outline" color="brand">安装</Badge> : 
      <Badge appearance="outline" color="warning">卸载</Badge>;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 暴露添加历史记录的方法给父组件使用
  // React.useImperativeHandle(React.useRef(), () => ({
  //   addHistoryItem,
  // }));

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<History24Regular />}
        header={<Text weight="semibold">安装历史</Text>}
        description={<Text size={200}>查看APK安装和卸载历史记录</Text>}
      />
      
      <div className={styles.content}>
        <div className={styles.toolbar}>
          <Field className={styles.searchField}>
            <Input
              contentBefore={<Search24Regular />}
              placeholder="搜索文件名、包名或设备..."
              value={searchQuery}
              onChange={(_, data) => setSearchQuery(data.value)}
            />
          </Field>
          
          <Button
            appearance="secondary"
            icon={<ArrowClockwise24Regular />}
            onClick={loadHistory}
          >
            刷新
          </Button>
          
          <Button
            appearance="secondary"
            icon={<Delete24Regular />}
            onClick={clearHistory}
            disabled={historyItems.length === 0}
          >
            清空历史
          </Button>
        </div>

        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <History24Regular style={{ fontSize: "48px" }} />
            <Text>暂无安装历史记录</Text>
            <Text size={200}>安装或卸载APK后，记录将显示在这里</Text>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <Table arial-label="安装历史记录">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>状态</TableHeaderCell>
                  <TableHeaderCell>文件名</TableHeaderCell>
                  <TableHeaderCell>操作</TableHeaderCell>
                  <TableHeaderCell>设备</TableHeaderCell>
                  <TableHeaderCell>时间</TableHeaderCell>
                  <TableHeaderCell>大小</TableHeaderCell>
                  <TableHeaderCell>操作</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {getStatusIcon(item.status)}
                        {getStatusBadge(item.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Text weight="semibold">{item.fileName}</Text>
                        {item.packageName && (
                          <div>
                            <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                              {item.packageName}
                            </Text>
                          </div>
                        )}
                        {item.message && (
                          <div>
                            <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                              {item.message}
                            </Text>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getOperationBadge(item.operationType)}
                    </TableCell>
                    <TableCell>
                      <Text size={200}>{item.deviceSerial}</Text>
                    </TableCell>
                    <TableCell>
                      <Text size={200}>{formatTimestamp(item.timestamp)}</Text>
                    </TableCell>
                    <TableCell>
                      <Text size={200}>{formatFileSize(item.fileSize)}</Text>
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
                              icon={<Delete24Regular />}
                              onClick={() => deleteHistoryItem(item.id)}
                            >
                              删除记录
                            </MenuItem>
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
  );
};

export default InstallHistoryCard;
