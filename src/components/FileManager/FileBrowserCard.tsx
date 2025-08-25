import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  List,
  ListItem,
  Button,
  Spinner,
  Field,
  Input,
  Badge,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from "@fluentui/react-components";
import {
  Folder24Regular,
  Document24Regular,
  ArrowLeft24Regular,
  Home24Regular,
  ArrowClockwise24Regular,
  CloudArrowUp24Regular,
  CloudArrowDown24Regular,
  MoreHorizontal24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { DeviceFile } from "../../types/device";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    gap: "12px",
  },
  navigationBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "6px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  pathInput: {
    flex: 1,
  },
  breadcrumbs: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    alignItems: "center",
    padding: "4px 8px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "4px",
    border: "1px solid var(--colorNeutralStroke3)",
  },
  listContainer: {
    flex: 1,
    overflow: "auto",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  listItem: {
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderBottom: "1px solid var(--colorNeutralStroke3)",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
    },
    "&:last-child": {
      borderBottom: "none",
    },
  },
  fileInfo: {
    flex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
    flexDirection: "column",
    gap: "12px",
  },
  emptyState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
    flexDirection: "column",
    gap: "12px",
    color: "var(--colorNeutralForeground3)",
  },
});

interface FileBrowserCardProps {
  currentPath: string;
  onPathChange: (path: string) => void;
  onFileSelect?: (file: DeviceFile) => void;
}

const FileBrowserCard: React.FC<FileBrowserCardProps> = ({
  currentPath,
  onPathChange,
  onFileSelect,
}) => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();

  const [files, setFiles] = useState<DeviceFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputPath, setInputPath] = useState(currentPath || "/sdcard/");
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadFiles = async (path: string) => {
    if (!selectedDevice) {
      addNotification({
        type: "warning",
        title: "设备未选择",
        message: "请先选择一个设备",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Normalize path
      const normalizedPath = path.endsWith('/') && path !== '/' ? path : `${path}/`;
      const fileList = await deviceService.listDeviceFiles(selectedDevice.serial, normalizedPath);
      
      // Sort directories first, then files
      const sortedFiles = [...fileList].sort((a, b) => {
        if (a.isDirectory === b.isDirectory) {
          return a.name.localeCompare(b.name, 'zh-CN', { numeric: true });
        }
        return a.isDirectory ? -1 : 1;
      });
      
      setFiles(sortedFiles);
      setInputPath(normalizedPath);
    } catch (error) {
      addNotification({
        type: "error",
        title: "加载文件失败",
        message: `无法加载路径 ${path} 下的文件: ${error}`,
      });
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const pathToLoad = currentPath || "/sdcard/";
    setInputPath(pathToLoad);
    loadFiles(pathToLoad);
  }, [currentPath, selectedDevice]);

  const handleFileClick = (file: DeviceFile) => {
    if (file.isDirectory) {
      const newPath = file.path.endsWith('/') ? file.path : `${file.path}/`;
      onPathChange(newPath);
    } else if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleParentDirectory = () => {
    if (currentPath === '/' || !currentPath) return;
    
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const parentPath = pathParts.length > 0 ? `/${pathParts.join('/')}/` : '/';
    onPathChange(parentPath);
  };

  const handlePathInputChange = (path: string) => {
    setInputPath(path);
  };

  const handlePathSubmit = () => {
    if (inputPath !== currentPath) {
      onPathChange(inputPath);
    }
  };

  const handleGoHome = () => {
    onPathChange('/sdcard/');
  };

  // 处理文件上传
  const handleFileUpload = async () => {
    if (!selectedDevice) {
      addNotification({
        type: "warning",
        title: "设备未选择",
        message: "请先选择一个设备",
      });
      return;
    }

    try {
      // 创建文件选择器
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      
      input.onchange = async (event) => {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        
        try {
          for (const file of Array.from(files)) {
            const remotePath = currentPath.endsWith('/') 
              ? `${currentPath}${file.name}`
              : `${currentPath}/${file.name}`;
            
            addNotification({
              type: "info",
              title: "开始上传",
              message: `正在上传文件: ${file.name}`,
            });

            // 注意：浏览器文件上传需要特殊处理，这里需要先保存文件到临时位置
            // 由于浏览器安全限制，无法直接获取文件的完整路径
            addNotification({
              type: "warning",
              title: "功能开发中",
              message: `浏览器文件上传功能正在开发中，暂时无法直接上传 ${file.name}`,
            });
            // 跳过实际上传，避免错误
          }
          
          // 刷新文件列表
          await loadFiles(currentPath);
        } catch (error) {
          addNotification({
            type: "error",
            title: "上传失败",
            message: `文件上传过程中出现错误: ${error}`,
          });
        } finally {
          setIsUploading(false);
        }
      };
      
      input.click();
    } catch (error) {
      addNotification({
        type: "error",
        title: "上传失败",
        message: `无法启动文件上传: ${error}`,
      });
    }
  };

  // 处理文件下载
  const handleFileDownload = async (file: DeviceFile) => {
    if (!selectedDevice) {
      addNotification({
        type: "warning",
        title: "设备未选择",
        message: "请先选择一个设备",
      });
      return;
    }

    if (file.isDirectory) {
      addNotification({
        type: "warning",
        title: "无法下载",
        message: "暂不支持下载文件夹，请选择单个文件",
      });
      return;
    }

    setIsDownloading(true);
    
    try {
      addNotification({
        type: "info",
        title: "开始下载",
        message: `正在下载文件: ${file.name}`,
      });

      // 使用 ADB pull 命令下载文件
      const result = await deviceService.pullFile(
        selectedDevice.serial,
        file.path, // 远程路径
        `./${file.name}` // 本地路径（下载到当前目录）
      );

      if (result.success) {
        addNotification({
          type: "success",
          title: "下载成功",
          message: `文件 ${file.name} 已成功下载到本地`,
        });
      } else {
        addNotification({
          type: "error",
          title: "下载失败",
          message: `文件 ${file.name} 下载失败: ${result.error || '未知错误'}`,
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "下载失败",
        message: `文件下载过程中出现错误: ${error}`,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGoRoot = () => {
    onPathChange('/');
  };

  const renderBreadcrumbs = () => {
    if (!currentPath || currentPath === '/') {
      return (
        <div className={styles.breadcrumbs}>
          <Button appearance="subtle" size="small" disabled>
            根目录
          </Button>
        </div>
      );
    }

    const parts = currentPath.split('/').filter(Boolean);
    return (
      <div className={styles.breadcrumbs}>
        <Button 
          appearance="subtle" 
          size="small" 
          onClick={handleGoRoot}
          disabled={currentPath === '/'}
        >
          根目录
        </Button>
        {parts.map((part, index) => {
          const path = '/' + parts.slice(0, index + 1).join('/') + '/';
          return (
            <React.Fragment key={path}>
              <Text>/</Text>
              <Button 
                appearance="subtle" 
                size="small" 
                onClick={() => onPathChange(path)}
                disabled={path === currentPath}
              >
                {part}
              </Button>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className={styles.container}>
      {/* Navigation Bar */}
      <div className={styles.navigationBar}>
        <Button
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={handleParentDirectory}
          disabled={currentPath === '/' || !currentPath || isLoading}
          title="返回上级目录"
        >
          上级
        </Button>
        <Button
          appearance="subtle"
          icon={<Home24Regular />}
          onClick={handleGoHome}
          disabled={currentPath === '/sdcard/' || isLoading}
          title="返回主目录"
        >
          主目录
        </Button>
        <Field className={styles.pathInput}>
          <Input
            value={inputPath}
            onChange={(_, data) => handlePathInputChange(data.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handlePathSubmit();
              }
            }}
            placeholder="输入路径..."
          />
        </Field>
        <Button
          appearance="primary"
          icon={<ArrowClockwise24Regular />}
          onClick={handlePathSubmit}
          disabled={isLoading}
          title="刷新/跳转"
        >
          刷新
        </Button>
        <Button
          appearance="secondary"
          icon={isUploading ? <Spinner size="tiny" /> : <CloudArrowUp24Regular />}
          onClick={handleFileUpload}
          disabled={isLoading || isUploading || !selectedDevice}
          title="上传文件到当前目录"
        >
          上传文件
        </Button>
      </div>

      {/* Breadcrumbs */}
      {renderBreadcrumbs()}

      {/* File List */}
      <div className={styles.listContainer}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <Spinner size="large" />
            <Text>正在加载文件列表...</Text>
          </div>
        ) : files.length === 0 ? (
          <div className={styles.emptyState}>
            <Folder24Regular style={{ fontSize: "32px" }} />
            <Text size={300}>此目录为空或无法访问</Text>
            <Text size={200}>请检查设备权限或尝试其他路径</Text>
          </div>
        ) : (
          <List>
            {files.map((file) => (
              <ListItem
                key={file.path}
                className={styles.listItem}
              >
                <div 
                  style={{ display: "flex", alignItems: "center", flex: 1, cursor: "pointer" }}
                  onClick={() => handleFileClick(file)}
                >
                  {file.isDirectory ? (
                    <Folder24Regular style={{ color: "var(--colorPaletteBlueForeground1)" }} />
                  ) : (
                    <Document24Regular style={{ color: "var(--colorNeutralForeground2)" }} />
                  )}
                  <div className={styles.fileInfo}>
                    <div>
                      <Text weight={file.isDirectory ? "semibold" : "regular"}>
                        {file.name}
                      </Text>
                      {file.isDirectory && (
                        <Badge appearance="outline" size="small" style={{ marginLeft: "8px" }}>
                          文件夹
                        </Badge>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {!file.isDirectory && file.size && (
                        <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                          {formatFileSize(file.size)}
                        </Text>
                      )}
                      {file.permissions && (
                        <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                          {file.permissions}
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 文件操作菜单 */}
                {!file.isDirectory && (
                  <Menu>
                    <MenuTrigger disableButtonEnhancement>
                      <Button
                        appearance="subtle"
                        icon={<MoreHorizontal24Regular />}
                        size="small"
                        title="文件操作"
                      />
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList>
                        <MenuItem
                          icon={isDownloading ? <Spinner size="tiny" /> : <CloudArrowDown24Regular />}
                          onClick={() => handleFileDownload(file)}
                          disabled={isDownloading}
                        >
                          下载文件
                        </MenuItem>
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </div>
    </div>
  );
};

export default FileBrowserCard;
