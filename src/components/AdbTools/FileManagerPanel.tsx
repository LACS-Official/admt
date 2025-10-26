
import { open } from '@tauri-apps/plugin-dialog';
import { exists, mkdir } from '@tauri-apps/plugin-fs';
import { documentDir, join } from '@tauri-apps/api/path';
import { open as openPath } from '@tauri-apps/plugin-shell';
import React, { useState, useEffect, useCallback } from "react";
import {
  makeStyles,
  Text,
  Button,
  Card,
  CardHeader,
  Input,
  Spinner,
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbDivider,
  Checkbox,
  Dropdown,
  Option,
} from "@fluentui/react-components";
import {
  Folder24Regular,
  Document24Regular,
  ArrowUp24Regular,
  Home24Regular,
  ArrowUpload24Regular,
  ArrowDownload24Regular,
  MoreHorizontal24Regular,
  Copy24Regular,
  ChevronRight24Regular,
  Storage24Regular,
  Image24Regular,
  Video24Regular,
  Mic24Regular,
  DocumentPdf24Regular,
  Archive24Regular,
  Code24Regular,
  Apps24Regular,
  Settings24Regular,
  DocumentText24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    borderRadius: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  content: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    minHeight: 0,
  },
  navigationBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "6px",
    flexWrap: "wrap",
  },
  pathInput: {
    // 固定宽度且支持横向滚动，避免遮挡右侧快捷按钮
    flex: "0 1 55%",
    maxWidth: "55%",
    minWidth: "260px",
    overflowX: "auto",
    whiteSpace: "nowrap",
    padding: "0 4px",
    borderRadius: "4px",
    // 自定义滚动条
    "&::-webkit-scrollbar": {
      height: "6px",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: "var(--colorNeutralBackground2)",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "var(--colorNeutralStroke2)",
      borderRadius: "4px",
    },
  },
  quickNavButtons: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
    flexShrink: 0,
  },
  sortContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
  },
  tableContainer: {
    flex: 1,
    maxHeight: "500px",
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
  fileRow: {
    height: "40px",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1)",
    },
  },
  fileIcon: {
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fileName: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  fileSize: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
  permissions: {
    fontFamily: "monospace",
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
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
  actionBar: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  selectedInfo: {
    padding: "8px 12px",
    backgroundColor: "var(--colorBrandBackground2)",
    borderRadius: "4px",
    fontSize: "12px",
  },
  compactCell: {
    padding: "4px 8px",
    verticalAlign: "middle",
  },
});

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size: string;
  permissions: string;
  modifiedTime: string;
  path: string;
}

const FileManagerPanel: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();
  const { setStatusBarMessage } = useAppStore();

  const [currentPath, setCurrentPath] = useState<string>('/storage/emulated/0/');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  // 排序：name_asc, name_desc, date_desc (新-旧), date_asc (旧-新)
  const [sortMode, setSortMode] = useState<'name_asc' | 'name_desc' | 'date_desc' | 'date_asc'>('name_asc');
  const [iconColor, setIconColor] = useState<string>('#0078d4'); // 默认图标颜色

  // Quick navigation paths
  const quickPaths = [
    { label: '根目录', path: '/' },
    { label: '内部存储', path: '/storage/emulated/0' },
    { label: 'data', path: '/data' },
    { label: 'system', path: '/system' },
    { label: 'Download', path: '/storage/emulated/0/Download' },
  ];

  const loadFiles = useCallback(async (path: string) => {
    console.log('loadFiles 被调用，路径:', path);
    if (!selectedDevice) {
      console.log('没有选中的设备，退出');
      return;
    }

    console.log('开始加载文件，设备:', selectedDevice.serial);
    setIsLoading(true);
    try {
      // 规范化路径，处理符号链接
      let normalizedPath = path;
      if (path === '/sdcard' || path === '/sdcard/') {
        // 对于 sdcard，我们直接使用 /sdcard，让后端处理符号链接
        normalizedPath = '/sdcard';
      }
      
      const result = await deviceService.listDeviceFiles(selectedDevice.serial, normalizedPath);
      if (Array.isArray(result)) {
        let fileItems: FileItem[] = result
          .filter(file => {
            // 过滤掉符号链接本身（如果它显示为文件）
            // 如果文件名包含 "->" 说明是符号链接的显示
            return !file.name.includes('->');
          })
          .map(file => {
            // 兼容后端字段：isDirectory(驼峰) 或 is_directory(下划线)
            const isDir = (file as any).isDirectory ?? (file as any).is_directory ?? false;
            const rawModified = (file as any).modifiedTime || (file as any).modified_time || '-';
            return {
              name: file.name,
              type: isDir ? 'directory' : 'file',
              size: file.size ? formatFileSize(String(file.size)) : '-',
              permissions: file.permissions || '-',
              modifiedTime: rawModified,
              path: `${normalizedPath}/${file.name}`.replace(/\/+/g, '/'),
            } as FileItem;
          });

        // 解析 ls 日期字符串为时间戳（用于排序）
        const monthMap: Record<string, number> = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
        const parseModifiedToTs = (s: string): number => {
          if (!s || s === '-') return 0;
          const parts = s.trim().split(/\s+/); // 可能是 "Aug 1 12:34" 或 "Aug 1 2023"
          if (parts.length < 3) return 0;
          const mon = monthMap[(parts[0] || '').slice(0,3).toLowerCase()];
          const day = parseInt(parts[1], 10) || 1;
          let year: number;
          let hours = 0, minutes = 0;
          if (parts[2].includes(':')) {
            // 没有年份，只有时间，年份用当前年
            const now = new Date();
            year = now.getFullYear();
            const [hh, mm] = parts[2].split(':');
            hours = parseInt(hh, 10) || 0;
            minutes = parseInt(mm, 10) || 0;
          } else {
            year = parseInt(parts[2], 10) || new Date().getFullYear();
          }
          if (mon == null) return 0;
          const dt = new Date(year, mon, day, hours, minutes, 0, 0);
          return dt.getTime();
        };

        // 排序：目录优先，再按所选模式
        fileItems.sort((a, b) => {
          if (a.type === 'directory' && b.type !== 'directory') return -1;
          if (a.type !== 'directory' && b.type === 'directory') return 1;
          if (sortMode === 'name_asc') return a.name.localeCompare(b.name);
          if (sortMode === 'name_desc') return b.name.localeCompare(a.name);
          const ta = parseModifiedToTs(a.modifiedTime);
          const tb = parseModifiedToTs(b.modifiedTime);
          if (sortMode === 'date_desc') return tb - ta; // 新-旧
          if (sortMode === 'date_asc') return ta - tb; // 旧-新
          return a.name.localeCompare(b.name);
        });
        
        setFiles(fileItems);
        setCurrentPath(normalizedPath);
        setSelectedFiles(new Set());
        
        // 显示加载成功的消息和真实路径
        getRealPath(normalizedPath).then(realPath => {
          const pathInfo = realPath !== normalizedPath ? `${normalizedPath} -> ${realPath}` : normalizedPath;
          setStatusBarMessage({
            type: "success",
            message: `已加载 ${fileItems.length} 个项目 (${pathInfo})`,
          });
        });
      } else {
        setStatusBarMessage({
          type: "error",
          message: `无法访问目录: 未知错误`,
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `加载文件列表失败: ${error}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDevice, deviceService, setStatusBarMessage, sortMode]);

  // 排序选择变化
  const handleSortChange = (_: any, data: { optionValue: string }) => {
    const value = data.optionValue as 'name_asc'|'name_desc'|'date_desc'|'date_asc';
    setSortMode(value);
    
    // 对当前文件列表进行排序，避免重新加载
    if (files.length > 0) {
      const sortedFiles = [...files];
      
      // 解析 ls 日期字符串为时间戳（用于排序）
      const monthMap: Record<string, number> = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
      const parseModifiedToTs = (s: string): number => {
        if (!s || s === '-') return 0;
        const parts = s.trim().split(/\s+/); // 可能是 "Aug 1 12:34" 或 "Aug 1 2023"
        if (parts.length < 3) return 0;
        const mon = monthMap[(parts[0] || '').slice(0,3).toLowerCase()];
        const day = parseInt(parts[1], 10) || 1;
        let year: number;
        let hours = 0, minutes = 0;
        if (parts[2].includes(':')) {
          // 没有年份，只有时间，年份用当前年
          const now = new Date();
          year = now.getFullYear();
          const [hh, mm] = parts[2].split(':');
          hours = parseInt(hh, 10) || 0;
          minutes = parseInt(mm, 10) || 0;
        } else {
          year = parseInt(parts[2], 10) || new Date().getFullYear();
        }
        if (mon == null) return 0;
        const dt = new Date(year, mon, day, hours, minutes, 0, 0);
        return dt.getTime();
      };

      // 排序：目录优先，再按所选模式
      sortedFiles.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        if (value === 'name_asc') return a.name.localeCompare(b.name);
        if (value === 'name_desc') return b.name.localeCompare(a.name);
        const ta = parseModifiedToTs(a.modifiedTime);
        const tb = parseModifiedToTs(b.modifiedTime);
        if (value === 'date_desc') return tb - ta; // 新-旧
        if (value === 'date_asc') return ta - tb; // 旧-新
        return a.name.localeCompare(b.name);
      });
      
      setFiles(sortedFiles);
    }
  };

  // 格式化文件大小显示
  // 文件类型识别函数
  const getFileIcon = (fileName: string, fileType: 'file' | 'directory'): React.ReactElement => {
    const iconProps = { style: { color: iconColor } };
    
    if (fileType === 'directory') {
      return <Folder24Regular {...iconProps} />;
    }

    const ext = fileName.toLowerCase().split('.').pop() || '';
    
    // 图片文件
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'].includes(ext)) {
      return <Image24Regular {...iconProps} />;
    }
    
    // 视频文件
    if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', '3gp'].includes(ext)) {
      return <Video24Regular {...iconProps} />;
    }
    
    // 音频文件
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'].includes(ext)) {
      return <Mic24Regular {...iconProps} />;
    }
    
    // 文档文件
    if (['pdf'].includes(ext)) {
      return <DocumentPdf24Regular {...iconProps} />;
    }
    
    // 压缩文件
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
      return <Archive24Regular {...iconProps} />;
    }
    
    // 代码文件
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'less', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'sh', 'bat', 'md'].includes(ext)) {
      return <Code24Regular {...iconProps} />;
    }
    
    // APK文件
    if (['apk'].includes(ext)) {
      return <Apps24Regular {...iconProps} />;
    }
    
    // 镜像文件
    if (['img', 'iso', 'dmg', 'vmdk', 'vhd', 'qcow2'].includes(ext)) {
      return <Settings24Regular {...iconProps} />;
    }
    
    // 文本文件
    if (['txt', 'log', 'ini', 'conf', 'cfg', 'yml', 'yaml', 'csv', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
      return <DocumentText24Regular {...iconProps} />;
    }
    
    // 默认文件图标
    return <Document24Regular {...iconProps} />;
  };

  const formatFileSize = (size: string): string => {
    if (size === '-' || !size) return '-';
    const bytes = parseInt(size);
    if (isNaN(bytes)) return size;
    
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
  };

  useEffect(() => {
    if (selectedDevice) {
      loadFiles(currentPath);
    }
  }, [selectedDevice, loadFiles, currentPath]);

  const handleNavigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    loadFiles(parentPath);
  };

  // 处理真实路径显示
  const getRealPath = useCallback(async (path: string) => {
    if (!selectedDevice) return path;
    
    try {
      // 对于 /sdcard，我们获取它的真实路径
      if (path === '/sdcard') {
        const result = await deviceService.executeAdbCommand(
          selectedDevice.serial,
          'shell readlink -f /sdcard'
        );
        if (result.success && result.output.trim()) {
          return result.output.trim();
        }
      }
    } catch (error) {
      console.log('获取真实路径失败:', error);
    }
    return path;
  }, [selectedDevice, deviceService]);

  const handleNavigateToPath = (path: string) => {
    loadFiles(path);
  };

  const handleFileClick = async (file: FileItem) => {
    console.log('点击文件:', file);
    console.log('文件类型:', file.type);
    console.log('文件路径:', file.path);

    if (file.type === 'directory') {
      console.log('这是一个目录，准备加载:', file.path);
      loadFiles(file.path);
      return;
    }

    // 兜底：后端可能将目录误判为文件，主动检测
    try {
      if (!selectedDevice) return;
      const probe = `test -d "${file.path}" && echo DIR || echo FILE`;
      console.log('进行目录检测:', probe);
      const res = await deviceService.executeAdbCommand(
        selectedDevice.serial,
        'shell',
        ['sh', '-lc', probe],
        15
      );
      console.log('目录检测结果:', res);
      if (res.success && res.output && res.output.includes('DIR')) {
        console.log('检测为目录，进入:', file.path);
        loadFiles(file.path);
        return;
      }
      console.log('检测结果为文件或检测失败，不进入');
    } catch (e) {
      console.log('目录检测发生异常:', e);
    }
  };

  const handleFileSelect = (fileName: string, selected: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (selected) {
      newSelected.add(fileName);
    } else {
      newSelected.delete(fileName);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedFiles(new Set(files.map(f => f.name)));
    } else {
      setSelectedFiles(new Set());
    }
  };

  const handleDownloadFile = async (file: FileItem) => {
    if (!selectedDevice) return;

    // 检查设备是否处于离线状态
    console.log('单文件传出设备模式检查:', selectedDevice.mode, '设备信息:', selectedDevice);
    if (selectedDevice.mode === 'offline') {
      setStatusBarMessage({
        type: "error",
        message: "设备处于离线状态，无法进行文件导出。请确保设备已连接并处于正常模式。",
      });
      return;
    }

    try {
      // 获取用户文档目录
      const docDir = await documentDir();
      const downloadDir = await join(docDir, 'ADMT', 'output');
      
      // 检查并创建传出目录
      const dirExists = await exists(downloadDir);
      if (!dirExists) {
        await mkdir(downloadDir, { recursive: true });
        console.log('创建传出目录:', downloadDir);
      }
      
      const localPath = await join(downloadDir, file.name);
      
      setStatusBarMessage({
        type: "info",
        message: `正在传出文件: ${file.name}...`,
      });

      console.log('尝试拉取单个文件:', file.path, '到:', localPath, '设备状态:', selectedDevice.mode);
      const result = await deviceService.pullFile(selectedDevice.serial, file.path, localPath);
      if (result.success) {
        setStatusBarMessage({
          type: "success",
          message: `文件传出成功: ${file.name}，已保存到: ${downloadDir}`,
        });
      } else {
        setStatusBarMessage({
          type: "error",
          message: `文件传出失败: ${result.error || '未知错误'}`,
        });
      }
    } catch (error) {
      console.error('单文件传出失败:', error, '设备状态:', selectedDevice.mode);
      setStatusBarMessage({
        type: "error",
        message: `文件传出失败: ${error}`,
      });
    }
  };

  const handleBatchDownload = async () => {
    if (!selectedDevice || selectedFiles.size === 0) return;

    // 检查设备是否处于离线状态
    console.log('设备模式检查:', selectedDevice.mode, '设备信息:', selectedDevice);
    if (selectedDevice.mode === 'offline') {
      setStatusBarMessage({
        type: "error",
        message: "设备处于离线状态，无法进行文件导出。请确保设备已连接并处于正常模式。",
      });
      return;
    }

    const selectedFileItems = files.filter(f => selectedFiles.has(f.name));
    let successCount = 0;
    let failCount = 0;

    try {
      // 获取用户文档目录
      const docDir = await documentDir();
      const downloadDir = await join(docDir, 'ADMT', 'output');
      
      setStatusBarMessage({
        type: "info",
        message: `正在传出 ${selectedFiles.size} 个文件到 ${downloadDir}，请稍候...`,
      });

      // 检查并创建传出目录
      const dirExists = await exists(downloadDir);
      if (!dirExists) {
        await mkdir(downloadDir, { recursive: true });
        console.log('创建传出目录:', downloadDir);
      }

      for (const file of selectedFileItems) {
        if (file.type === 'file') {
          try {
            const localPath = await join(downloadDir, file.name);
            console.log('尝试拉取文件:', file.path, '到:', localPath, '设备状态:', selectedDevice.mode);
            const result = await deviceService.pullFile(selectedDevice.serial, file.path, localPath);
            if (result.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            console.error('文件拉取失败:', error, '设备状态:', selectedDevice.mode);
            failCount++;
          }
        }
      }

      setStatusBarMessage({
        type: successCount > 0 ? "success" : "error",
        message: `批量导出完成 - 成功: ${successCount}个, 失败: ${failCount}个，文件已保存到: ${downloadDir}`,
      });
    } catch (error) {
      console.error('导出文件失败:', error);
      setStatusBarMessage({
        type: "error",
        message: `导出文件失败: ${error}`,
      });
    }

    setSelectedFiles(new Set());
  };

  // 打开导出目录
  const handleOpenExportDirectory = async () => {
    try {
      const docDir = await documentDir();
      const exportDir = await join(docDir, 'ADMT', 'output');
      
      // 确保目录存在
      const dirExists = await exists(exportDir);
      if (!dirExists) {
        await mkdir(exportDir, { recursive: true });
        console.log('创建导出目录:', exportDir);
      }
      
      // 打开目录 - 使用Tauri的invoke方式
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_folder', { path: exportDir });
      setStatusBarMessage({
        type: "success",
        message: "已打开导出目录",
      });
    } catch (error) {
      console.error('打开导出目录失败:', error);
      setStatusBarMessage({
        type: "error",
        message: `打开导出目录失败: ${error}`,
      });
    }
  };

  const handleUploadFile = async () => {
    if (!selectedDevice) return;

    try {
      // Open file picker dialog
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'All Files',
          extensions: ['*']
        }]
      });

      if (selected && typeof selected === 'string') {
        setIsUploading(true);
        setStatusBarMessage({
          type: "info",
          message: "正在上传文件...",
        });

        const result = await deviceService.pushFile(selectedDevice.serial, selected, currentPath);
        if (result.success) {
          setStatusBarMessage({
            type: "success",
            message: "文件上传成功",
          });
          loadFiles(currentPath); // Refresh file list
        } else {
          setStatusBarMessage({
            type: "error",
            message: `文件上传失败: ${result.error || '未知错误'}`,
          });
        }
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `文件上传失败: ${error}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const renderBreadcrumb = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    
    return (
      <Breadcrumb>
        <BreadcrumbItem>
          <Button
            appearance="subtle"
            size="small"
            icon={<Home24Regular />}
            onClick={() => handleNavigateToPath('/')}
          >
            根目录
          </Button>
        </BreadcrumbItem>
        {pathParts.map((part, index) => {
          const partPath = '/' + pathParts.slice(0, index + 1).join('/');
          return (
            <React.Fragment key={partPath}>
              <BreadcrumbDivider>
                <ChevronRight24Regular />
              </BreadcrumbDivider>
              <BreadcrumbItem>
                <Button
                  appearance="subtle"
                  size="small"
                  onClick={() => handleNavigateToPath(partPath)}
                >
                  {part}
                </Button>
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </Breadcrumb>
    );
  };

  if (!selectedDevice) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <Storage24Regular style={{ fontSize: "48px" }} />
          <Text>请先选择一个设备</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>

        <div className={styles.content}>
          {/* Navigation Bar */}
          <div className={styles.navigationBar}>
            <Button
              appearance="subtle"
              icon={<ArrowUp24Regular />}
              onClick={handleNavigateUp}
              disabled={currentPath === '/'}
              title="返回上级目录"
            />
            {/*  文件路径输入框 */}
            <div className={styles.pathInput}>
              {renderBreadcrumb()}
            </div>
            {/* 排序选择 */}
            <div className={styles.sortContainer}>
              <Text size={200}>排序</Text>
              <Dropdown
                size="small"
                selectedOptions={[sortMode]}
                onOptionSelect={handleSortChange}
              >
                <Option value="name_asc">名称 A-Z</Option>
                <Option value="name_desc">名称 Z-A</Option>
                <Option value="date_desc">日期 新-旧</Option>
                <Option value="date_asc">日期 旧-新</Option>
              </Dropdown>
            </div>

            {/* 快速导航按钮 */}
            <div className={styles.quickNavButtons}>
              {quickPaths.map((item) => (
                <Button
                  key={item.path}
                  appearance="subtle"
                  size="small"
                  onClick={() => handleNavigateToPath(item.path)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className={styles.actionBar}>
            <Button
              appearance="primary"
              icon={isUploading ? <Spinner size="tiny" /> : <ArrowUpload24Regular />}
              onClick={handleUploadFile}
              disabled={isUploading}
            >
              {isUploading ? '上传中...' : '上传文件'}
            </Button>

            <Button
              appearance="secondary"
              icon={<Folder24Regular />}
              onClick={handleOpenExportDirectory}
            >
              打开导出目录
            </Button>
            {selectedFiles.size > 0 && (
              <>
                <div className={styles.selectedInfo}>
                  已选择 {selectedFiles.size} 个文件
                </div>
                <Button
                  appearance="primary"
                  icon={<ArrowDownload24Regular />}
                  onClick={handleBatchDownload}
                >
                  批量导出
                </Button>
              </>
            )}
          </div>

          {/* File List */}
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Spinner size="large" label="正在加载文件列表..." />
            </div>
          ) : files.length === 0 ? (
            <div className={styles.emptyState}>
              <Folder24Regular style={{ fontSize: "48px" }} />
              <Text>目录为空</Text>
              <Text size={200}>此目录中没有文件或文件夹</Text>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <Table arial-label="文件列表">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell className={styles.compactCell}>
                      <Checkbox
                        checked={selectedFiles.size === files.length && files.length > 0}
                        onChange={(_, data) => handleSelectAll(data.checked === true)}
                      />
                    </TableHeaderCell>
                    <TableHeaderCell>名称</TableHeaderCell>
                    <TableHeaderCell>大小</TableHeaderCell>
                    <TableHeaderCell>操作</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.name} className={styles.fileRow}>
                      <TableCell className={styles.compactCell}>
                        <Checkbox
                          checked={selectedFiles.has(file.name)}
                          onChange={(_, data) => handleFileSelect(file.name, data.checked === true)}
                        />
                      </TableCell>
                      <TableCell className={styles.compactCell}>
                        <div className={styles.fileName} onClick={() => handleFileClick(file)}>
                          <div className={styles.fileIcon}>
                            {getFileIcon(file.name, file.type)}
                          </div>
                          <Text weight={file.type === 'directory' ? "semibold" : "regular"}>
                            {file.name}
                          </Text>
                        </div>
                      </TableCell>
                      <TableCell className={styles.compactCell}>
                        <Text className={styles.fileSize}>
                          {file.size}
                        </Text>
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
                              {file.type === 'file' && (
                                <MenuItem
                                  icon={<ArrowDownload24Regular />}
                                  onClick={() => handleDownloadFile(file)}
                                >
                                  传出文件
                                </MenuItem>
                              )}
                              <MenuItem
                                icon={<Copy24Regular />}
                                onClick={() => {
                                  navigator.clipboard.writeText(file.path);
                                  setStatusBarMessage({
                                    type: "success",
                                    message: "文件路径已复制到剪贴板",
                                  });
                                }}
                              >
                                复制路径
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
    </div>
  );
};

export default FileManagerPanel;
