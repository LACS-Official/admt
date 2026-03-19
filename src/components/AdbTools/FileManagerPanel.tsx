
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
  Info24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { useTranslation } from "react-i18next";
import { DeviceInfo } from "../../types/device";
import { logService } from "../../services/logService";
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    gap: "12px",
  },
  sidebar: {
    width: "200px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "8px",
    padding: "12px",
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: "0 8px 8px 8px",
    fontWeight: 600,
    fontSize: "14px",
    color: "var(--colorNeutralForeground2)",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    marginBottom: "4px",
  },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    color: "var(--colorNeutralForeground1)",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1)",
    },
  },
  sidebarItemActive: {
    backgroundColor: "var(--colorNeutralBackground1)",
    fontWeight: 600,
    color: "var(--colorBrandForeground1)",
  },
  toolbox: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  toolboxItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    color: "var(--colorNeutralForeground1)",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1)",
      color: "var(--colorBrandForeground1)",
    },
  },
  toolboxLabel: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "var(--colorNeutralForeground3)",
    padding: "0 8px",
    marginBottom: "4px",
    textTransform: "uppercase",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minWidth: 0, 
    height: "100%",
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

interface FileManagerPanelProps {
  device: DeviceInfo | null;
  onAdbRequired: () => void;
}

const FileManagerPanel: React.FC<FileManagerPanelProps> = ({ device, onAdbRequired }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { devices } = useDeviceStore();
  const { deviceService } = useDeviceService();
  const { setStatusBarMessage } = useAppStore();

  const checkMode = useCallback(() => {
    if (!device) {
       setStatusBarMessage({ type: "warning", message: t('file_manager.select_device_first') });
       return false;
    }
    if (device.connected && device.mode !== 'sys' && device.mode !== 'rec') {
      onAdbRequired();
      return false;
    }
    return true;
  }, [device, onAdbRequired, t]);



  const [currentPath, setCurrentPath] = useState<string>('/storage/emulated/0/');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Context Menu State
  const [contextMenuLocation, setContextMenuLocation] = useState<{ left: number, top: number } | null>(null);
  const [contextMenuTarget, setContextMenuTarget] = useState<HTMLElement | null>(null);
  const [contextMenuFile, setContextMenuFile] = useState<FileItem | null>(null);
  // 排序：name_asc, name_desc, date_desc (新-旧), date_asc (旧-新)
  const [sortMode, setSortMode] = useState<'name_asc' | 'name_desc' | 'date_desc' | 'date_asc'>('name_asc');
  const [iconColor, setIconColor] = useState<string>('#0078d4'); // 默认图标颜色

  // Quick navigation paths
  const quickPaths = [
    { label: t('file_manager.root_dir'), path: '/', icon: <Storage24Regular /> },
    { label: t('file_manager.internal_storage'), path: '/storage/emulated/0', icon: <Home24Regular /> },
    { label: 'Camera (DCIM)', path: '/storage/emulated/0/DCIM', icon: <Image24Regular /> },
    { label: 'Download', path: '/storage/emulated/0/Download', icon: <ArrowDownload24Regular /> },
    { label: 'Pictures', path: '/storage/emulated/0/Pictures', icon: <Image24Regular /> },
    { label: 'Movies', path: '/storage/emulated/0/Movies', icon: <Video24Regular /> },
    { label: 'Music', path: '/storage/emulated/0/Music', icon: <Mic24Regular /> },
    { label: 'Documents', path: '/storage/emulated/0/Documents', icon: <DocumentText24Regular /> },
    { label: 'Android Data', path: '/storage/emulated/0/Android/data', icon: <Folder24Regular /> },
  ];

  const loadFiles = useCallback(async (path: string) => {
    if (!checkMode()) return;
    console.log('loadFiles 被调用，路径:', path);
    if (!device) {
      console.log('没有选中的设备，退出');
      return;
    }

    console.log('开始加载文件，设备:', device.serial);
    setIsLoading(true);
    try {
      // 规范化路径，处理符号链接
      let normalizedPath = path;
      if (path === '/sdcard' || path === '/sdcard/') {
        // 对于 sdcard，我们直接使用 /sdcard，让后端处理符号链接
        normalizedPath = '/sdcard';
      }
      
      const result = await deviceService.listDeviceFiles(device.serial, normalizedPath);

      if (Array.isArray(result)) {
        const fileItems: FileItem[] = result
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
            message: t('file_manager.msg_list_success', { count: fileItems.length, path: pathInfo }),
          });
        });
      } else {
        setStatusBarMessage({
          type: "error",
          message: t('file_manager.msg_access_fail', { error: t('common.unknown_error') }),
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: t('file_manager.msg_list_fail', { error }),
      });
    } finally {
      setIsLoading(false);
    }
  }, [device, deviceService, setStatusBarMessage, t, sortMode]);

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
    const minSize = { width: '20px', height: '20px' };
    
    if (fileType === 'directory') {
      return <Folder24Regular style={{ ...minSize, color: "#FCD116" }} />; // Folder Yellow
    }

    const ext = fileName.toLowerCase().split('.').pop() || '';
    
    // 图片文件
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'].includes(ext)) {
      return <Image24Regular style={{ ...minSize, color: "#9333EA" }} />; // Purple
    }
    
    // 视频文件
    if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', '3gp'].includes(ext)) {
      return <Video24Regular style={{ ...minSize, color: "#EF4444" }} />; // Red
    }
    
    // 音频文件
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'].includes(ext)) {
      return <Mic24Regular style={{ ...minSize, color: "#EC4899" }} />; // Pink
    }
    
    // 文档文件
    if (['pdf'].includes(ext)) {
      return <DocumentPdf24Regular style={{ ...minSize, color: "#F59E0B" }} />; // Orange
    }
    
    // 压缩文件
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
      return <Archive24Regular style={{ ...minSize, color: "#6366F1" }} />; // Indigo
    }
    
    // 代码文件
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'less', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'sh', 'bat', 'md'].includes(ext)) {
      return <Code24Regular style={{ ...minSize, color: "#10B981" }} />; // Emerald
    }
    
    // APK文件
    if (['apk'].includes(ext)) {
      return <Apps24Regular style={{ ...minSize, color: "#14B8A6" }} />; // Teal
    }
    
    // 镜像文件
    if (['img', 'iso', 'dmg', 'vmdk', 'vhd', 'qcow2'].includes(ext)) {
      return <Settings24Regular style={{ ...minSize, color: "#64748B" }} />; // Slate
    }
    
    // 文本文件
    if (['txt', 'log', 'ini', 'conf', 'cfg', 'yml', 'yaml', 'csv', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
      return <DocumentText24Regular style={{ ...minSize, color: "#3B82F6" }} />; // Blue
    }
    
    // 默认文件图标
    return <Document24Regular style={{ ...minSize, color: "#94A3B8" }} />; // Gray
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
    if (device) {
      loadFiles(currentPath);
    }
  }, [device, loadFiles, currentPath]);


  const handleNavigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    loadFiles(parentPath);
  };

  // 处理真实路径显示
  const getRealPath = useCallback(async (path: string) => {
    if (!device) return path;
    
    try {
      // 对于 /sdcard，我们获取它的真实路径
      if (path === '/sdcard') {
        const result = await deviceService.executeAdbCommand(
          device.serial,
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
  }, [device, deviceService]);

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
      if (!device) return;
      const probe = `test -d "${file.path}" && echo DIR || echo FILE`;
      console.log('进行目录检测:', probe);
      const res = await deviceService.executeAdbCommand(
        device.serial,
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
    if (!checkMode()) return;
    if (!device) return;

    // 检查设备是否处于离线状态
    console.log('单文件传出设备模式检查:', device.mode, '设备信息:', device);
    if (device.mode === 'offline') {
      setStatusBarMessage({
        type: "error",
        message: t('file_manager.msg_offline'),
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
        message: t('file_manager.msg_pulling', { name: file.name }),
      });

      const result = await deviceService.pullFile(device.serial, file.path, localPath);
      if (result.success) {
        await logService.info(`成功导出文件: ${file.name}`, '文件管理', { remotePath: file.path, localPath });
        setStatusBarMessage({
          type: "success",
          message: t('file_manager.msg_pull_success', { name: file.name, dir: downloadDir }),
        });
      } else {
        await logService.error(`导出文件失败: ${file.name}`, '文件管理', { error: result.error, remotePath: file.path });
        setStatusBarMessage({
          type: "error",
          message: t('file_manager.msg_pull_fail', { error: result.error || t('common.unknown') }),
        });
      }
    } catch (error) {
      await logService.error(`导出文件过程异常: ${file.name}`, '文件管理', { error: String(error) });
      setStatusBarMessage({
        type: "error",
        message: t('file_manager.msg_pull_fail', { error }),
      });
    } finally { };
  };

  const handleBatchDownload = async () => {
    if (!checkMode()) return;
    if (!device || selectedFiles.size === 0) return;

    // 检查设备是否处于离线状态
    console.log('设备模式检查:', device.mode, '设备信息:', device);
    if (device.mode === 'offline') {
      setStatusBarMessage({
        type: "error",
        message: t('file_manager.msg_offline'),
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
        message: t('file_manager.msg_batch_pulling', { count: selectedFiles.size, dir: downloadDir }),
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
            const result = await deviceService.pullFile(device.serial, file.path, localPath);

            if (result.success) {
              successCount++;
              await logService.info(`成功导出文件(批量): ${file.name}`, '文件管理', { remotePath: file.path, localPath });
            } else {
              failCount++;
              await logService.error(`导出文件失败(批量): ${file.name}`, '文件管理', { error: result.error, remotePath: file.path });
            }
          } catch (error) {
            await logService.error(`批量导出文件过程异常: ${file.name}`, '文件管理', { error: String(error) });
            failCount++;
          }
        }
      }

      setStatusBarMessage({
        type: successCount > 0 ? "success" : "error",
        message: t('file_manager.msg_batch_pull_result', { success: successCount, fail: failCount, dir: downloadDir }),
      });
      await logService.info(`批量导出完成: 成功 ${successCount}, 失败 ${failCount}`, '文件管理', { exportDir: downloadDir });
    } catch (error) {
      await logService.error(`批量导出失败`, '文件管理', { error: String(error) });
      setStatusBarMessage({
        type: "error",
        message: t('file_manager.msg_pull_fail', { error }),
      });
    }

    setSelectedFiles(new Set());
  };

  // 打开导出目录
  const handleOpenExportDirectory = async () => {
    let exportDir = '';
    try {
      const docDir = await documentDir();
      exportDir = await join(docDir, 'ADMT', 'output');
      
      // 确保目录存在
      const dirExists = await exists(exportDir);
      if (!dirExists) {
        await mkdir(exportDir, { recursive: true });
        await logService.info(`创建本地导出目录: ${exportDir}`, '文件管理');
      }
      
      // 打开目录 - 使用Tauri的invoke方式
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_folder', { path: exportDir });
      await logService.info(`打开本地导出文件夹: ${exportDir}`, '文件管理');
      setStatusBarMessage({
        type: "success",
        message: t('file_manager.msg_open_dir_success'),
      });
    } catch (error) {
      await logService.error(`打开导出文件夹失败: ${exportDir || '未知路径'}`, '文件管理', { error: String(error) });
      setStatusBarMessage({
        type: "error",
        message: t('file_manager.msg_open_dir_fail', { error }),
      });
    }
  };

  const handleUploadFile = async () => {
    if (!checkMode()) return;
    if (!device) return;
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: t('file_manager.all_files'),
          extensions: ['*']
        }]
      });

      if (selected && Array.isArray(selected)) {
        setIsUploading(true);
        setStatusBarMessage({
          type: "info",
          message: t('file_manager.msg_uploading'),
        });

        let successCount = 0;
        let failCount = 0;

        for (const filePath of selected) {
          const result = await deviceService.pushFile(device.serial, filePath, currentPath);
          const fileName = filePath.split(/[/\\]/).pop() || filePath;
          if (result.success) {
            successCount++;
            await logService.info(`成功上传文件: ${fileName}`, '文件管理', { localPath: filePath, remoteDir: currentPath });
          } else {
            failCount++;
            await logService.error(`上传文件失败: ${fileName}`, '文件管理', { error: result.error, localPath: filePath });
          }
        }

        if (successCount > 0) {
          setStatusBarMessage({
            type: "success",
            message: t('file_manager.msg_upload_success_batch', { success: successCount, fail: failCount }),
          });
          loadFiles(currentPath); // Refresh file list
        } else if (selected.length > 0) {
          setStatusBarMessage({
            type: "error",
            message: t('file_manager.msg_upload_fail', { error: t('common.fail') }),
          });
        }

      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: t('file_manager.msg_upload_fail', { error }),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenuLocation({ left: e.clientX, top: e.clientY });
    setContextMenuTarget(e.target as HTMLElement);
    setContextMenuFile(file);
  };

  const handleCalculateSize = async (file: FileItem) => {
    if (!checkMode()) return;
    if (!device) return;

    setStatusBarMessage({
      type: "info",
      message: t('file_manager.calculating_size', { name: file.name }),
    });

    try {
      const result = await deviceService.executeAdbCommand(
        device.serial,
        'shell',
        [`du -sh "${file.path}"`]
      );

      if (result.success && result.output) {
        const size = result.output.split(/\s+/)[0];
        setStatusBarMessage({
          type: "success",
          message: t('file_manager.size_result', { name: file.name, size }),
        });
      } else {
         setStatusBarMessage({
          type: "error",
          message: t('file_manager.calc_size_fail', { error: result.error || 'Unknown error' }),
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: t('file_manager.calc_size_fail', { error }),
      });
    }
    setContextMenuLocation(null);
  };

  // Drag and drop handlers
  useEffect(() => {
    const unlistenPromise = (async () => {
      const appWindow = getCurrentWebviewWindow();
      
      const unlisten = await appWindow.onDragDropEvent((event) => {
        if (event.payload.type === 'enter') {
          console.log('User started dragging file over window');
          setIsDragging(true);
        } else if (event.payload.type === 'drop') {
          console.log('User dropped file', event.payload.paths);
          setIsDragging(false);
          
          // Handle dropped files
          if (event.payload.paths && event.payload.paths.length > 0) {
            handleDroppedFiles(event.payload.paths);
          }
        } else if (event.payload.type === 'leave') {
          console.log('User left dragging');
          setIsDragging(false);
        }
      });
      return unlisten;
    })();

    return () => {
      unlistenPromise.then(unlisten => unlisten());
    };
  }, [device, currentPath]);

  const handleDroppedFiles = async (paths: string[]) => {
    if (!checkMode()) return;
    if (!device) return;

    setIsUploading(true);
    setStatusBarMessage({
      type: "info",
      message: t('file_manager.msg_uploading'),
    });

    let successCount = 0;
    let failCount = 0;

    try {
        for (const filePath of paths) {
          const result = await deviceService.pushFile(device.serial, filePath, currentPath);
          const fileName = filePath.split(/[/\\]/).pop() || filePath;
          if (result.success) {
            successCount++;
            await logService.info(`成功上传文件(拖拽): ${fileName}`, '文件管理', { localPath: filePath, remoteDir: currentPath });
          } else {
            failCount++;
            await logService.error(`上传文件失败(拖拽): ${fileName}`, '文件管理', { error: result.error, localPath: filePath });
          }
        }

        if (successCount > 0) {
          setStatusBarMessage({
            type: "success",
            message: t('file_manager.msg_upload_success_batch', { success: successCount, fail: failCount }),
          });
          loadFiles(currentPath); // Refresh file list
        } else {
          setStatusBarMessage({
            type: "error",
            message: t('file_manager.msg_upload_fail', { error: t('common.fail') }),
          });
        }
    } catch (error) {
       setStatusBarMessage({
        type: "error",
        message: t('file_manager.msg_upload_fail', { error }),
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
            onClick={() => {
              if (checkMode()) handleNavigateToPath('/');
            }}
          >
            {t('file_manager.root_dir')}
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
                  onClick={() => {
                    if (checkMode()) handleNavigateToPath(partPath);
                  }}
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

//   if (!device) {
//     return (
//       <div className={styles.container}>
//         <div className={styles.emptyState}>
//           <Storage24Regular style={{ fontSize: "48px" }} />
//           <Text>{t('file_manager.select_device_first')}</Text>
//         </div>
//       </div>
//     );
//   }


  return (
    <div className={styles.container}>
      {/* Sidebar Quick Access */}
      <div className={styles.sidebar}>
         <div className={styles.sidebarHeader}>{t('file_manager.quick_access')}</div>
         <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
           {quickPaths.map((item) => (
              <div 
                key={item.path} 
                className={`${styles.sidebarItem} ${device && currentPath.startsWith(item.path) && item.path !== '/' ? styles.sidebarItemActive : ''}`}
                onClick={() => {
                  if (checkMode()) handleNavigateToPath(item.path);
                }}
              >
                {item.icon}
                <Text>{item.label}</Text>
              </div>
           ))}
         </div>

         {/* Toolbox */}
         <div className={styles.toolbox}>
           <div className={styles.sidebarHeader}>工具箱</div>
           
           <div className={styles.toolboxItem} onClick={handleUploadFile}>
             {isUploading ? <Spinner size="tiny" /> : <ArrowUpload24Regular />}
             <Text>{isUploading ? t('file_manager.uploading') : t('file_manager.upload_file')}</Text>
           </div>
           
           <div className={styles.toolboxItem} onClick={handleOpenExportDirectory}>
             <Folder24Regular />
             <Text>{t('file_manager.open_export_dir')}</Text>
           </div>

           <div style={{ padding: '8px' }}>
             <div className={styles.toolboxLabel}>{t('file_manager.sort_label')}</div>
             <Dropdown
               size="small"
               style={{ width: '100%', minWidth: 'auto' }}
               selectedOptions={[sortMode]}
               onOptionSelect={handleSortChange}
             >
               <Option value="name_asc">{t('file_manager.sort_name_asc')}</Option>
               <Option value="name_desc">{t('file_manager.sort_name_desc')}</Option>
               <Option value="date_desc">{t('file_manager.sort_date_desc')}</Option>
               <Option value="date_asc">{t('file_manager.sort_date_asc')}</Option>
             </Dropdown>
           </div>
         </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <Card className={styles.card}>
          {isDragging && (
             <div style={{
               position: 'absolute',
               top: 0, left: 0, right: 0, bottom: 0,
               backgroundColor: 'rgba(0, 120, 212, 0.1)',
               zIndex: 100,
               border: '2px dashed var(--colorBrandStroke1)',
               borderRadius: '8px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               pointerEvents: 'none',
             }}>
               <div style={{ padding: '20px', backgroundColor: 'var(--colorNeutralBackground1)', borderRadius: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
                  <Text size={500} weight="semibold" style={{ color: 'var(--colorBrandForeground1)' }}>
                    {t('file_manager.drop_files_here')}
                  </Text>
               </div>
             </div>
          )}

          <div className={styles.content}>
            {/* Navigation Bar */}
            <div className={styles.navigationBar}>
              <Button
                appearance="subtle"
                icon={<ArrowUp24Regular />}
                onClick={() => {
                  if (checkMode()) handleNavigateUp();
                }}
                disabled={currentPath === '/'}
                title={t('file_manager.nav_up_title')}
              />
              {/*  文件路径输入框 */}
              <div className={styles.pathInput}>
                {renderBreadcrumb()}
              </div>
            </div>

            {/* Action Bar */}
            {selectedFiles.size > 0 && (
              <div className={styles.actionBar}>
                <div className={styles.selectedInfo}>
                  {t('file_manager.selected_count', { count: selectedFiles.size })}
                </div>
                <Button
                  appearance="primary"
                  icon={<ArrowDownload24Regular />}
                  onClick={handleBatchDownload}
                >
                  {t('file_manager.batch_export')}
                </Button>
              </div>
            )}


            {/* File List */}
            {!device ? (
              <div className={styles.emptyState}>
                <Settings24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
                <Text size={400}>{t('file_manager.select_device_first')}</Text>
                <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
                  {t('unlock.select_device_hint')}
                </Text>
                <Button appearance="primary" style={{ marginTop: '12px' }} onClick={() => (window as any).openDeviceSelectionWindow?.()}>
                  {t('common.select_device')}
                </Button>
              </div>
            ) : isLoading ? (
              <div className={styles.loadingContainer}>
                <Spinner size="large" label={t('file_manager.loading_files')} />
              </div>
            ) : files.length === 0 ? (
              <div className={styles.emptyState}>
                <Folder24Regular style={{ fontSize: "48px" }} />
                <Text>{t('file_manager.empty_dir')}</Text>
                <Text size={200}>{t('file_manager.empty_dir_desc')}</Text>
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
                      <TableHeaderCell>{t('file_manager.header_name')}</TableHeaderCell>
                      <TableHeaderCell>{t('file_manager.header_size')}</TableHeaderCell>
                      <TableHeaderCell>{t('file_manager.header_actions')}</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow 
                        key={file.name} 
                        className={styles.fileRow}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                        style={{ cursor: 'context-menu' }}
                      >
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
                           <div style={{ display: 'flex', gap: '4px' }}>
                              {file.type === 'file' && (
                                <Button
                                  appearance="subtle"
                                  icon={<ArrowDownload24Regular />}
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadFile(file);
                                  }}
                                  title={t('file_manager.pull_file')}
                                />
                              )}
                              <Menu>
                                <MenuTrigger disableButtonEnhancement>
                                  <Button
                                    appearance="subtle"
                                    icon={<MoreHorizontal24Regular />}
                                    size="small"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </MenuTrigger>
                                <MenuPopover>
                                  <MenuList>
                                    {file.type === 'file' && (
                                      <MenuItem
                                        icon={<ArrowDownload24Regular />}
                                        onClick={() => handleDownloadFile(file)}
                                      >
                                        {t('file_manager.pull_file')}
                                      </MenuItem>
                                    )}
                                    <MenuItem
                                      icon={<Copy24Regular />}
                                      onClick={() => {
                                        navigator.clipboard.writeText(file.path);
                                        setStatusBarMessage({
                                          type: "success",
                                          message: t('file_manager.msg_copied'),
                                        });
                                      }}
                                    >
                                      {t('file_manager.copy_path')}
                                    </MenuItem>
                                    {file.type === 'directory' && (
                                       <MenuItem
                                          icon={<Info24Regular />}
                                          onClick={() => handleCalculateSize(file)}
                                       >
                                          {t('file_manager.calculate_size')}
                                       </MenuItem>
                                    )}
                                  </MenuList>
                                </MenuPopover>
                              </Menu>
                           </div>
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
    </div>
  );
};

export default FileManagerPanel;
