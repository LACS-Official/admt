import React, { useState } from 'react';
import {
  makeStyles,
  Text,
  Button,
  Badge,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Field,
  Input,
  Spinner,
} from "@fluentui/react-components";
import {
  Folder24Regular,
  ArrowUpload24Regular,
  ArrowDownload24Regular,
  FolderOpen24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import FileTransferCard from "./FileTransferCard";
import FileBrowserCard from "./FileBrowserCard";
import { open, save } from "@tauri-apps/plugin-dialog";

const useStyles = makeStyles({
  container: {
    padding: "16px",
    height: "100%",
    overflow: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
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
  content: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    height: "calc(100% - 80px)",
  },
  placeholder: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    height: "300px",
    textAlign: "center",
    border: "2px dashed var(--colorNeutralStroke2)",
    borderRadius: "8px",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  cardContent: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    textAlign: "center",
  },
});

const FileManagerPanel: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [localPath, setLocalPath] = useState("");
  const [remotePath, setRemotePath] = useState("/sdcard/");
  const [isTransferring, setIsTransferring] = useState(false);
  const [currentPath, setCurrentPath] = useState("/sdcard/");

  const handleUpload = () => {
    if (!selectedDevice) {
      addNotification({
        type: "warning",
        title: "文件上传",
        message: "请先选择一个设备",
      });
      return;
    }
    setUploadDialogOpen(true);
  };

  const handleDownload = () => {
    if (!selectedDevice) {
      addNotification({
        type: "warning",
        title: "文件下载",
        message: "请先选择一个设备",
      });
      return;
    }
    setDownloadDialogOpen(true);
  };

  const handleBrowseUploadFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        title: "选择要上传的文件"
      });

      if (selected && typeof selected === 'string') {
        setLocalPath(selected);
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "文件选择失败",
        message: `无法选择文件: ${error}`,
      });
    }
  };

  const handleBrowseDownloadPath = async () => {
    try {
      const selected = await save({
        title: "选择文件保存位置"
      });

      if (selected) {
        setLocalPath(selected);
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "路径选择失败",
        message: `无法选择保存路径: ${error}`,
      });
    }
  };

  const confirmUpload = async () => {
    if (!selectedDevice || !localPath || !remotePath) return;

    setIsTransferring(true);
    setUploadDialogOpen(false);

    try {
      const result = await deviceService.pushFile(selectedDevice.serial, localPath, remotePath);

      if (result.success) {
        addNotification({
          type: "success",
          title: "文件上传",
          message: "文件上传成功",
        });
      } else {
        addNotification({
          type: "error",
          title: "上传失败",
          message: result.error || "文件上传失败",
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "上传失败",
        message: `文件上传失败: ${error}`,
      });
    } finally {
      setIsTransferring(false);
      setLocalPath("");
      setRemotePath("/sdcard/");
    }
  };

  const confirmDownload = async () => {
    if (!selectedDevice || !localPath || !remotePath) return;

    setIsTransferring(true);
    setDownloadDialogOpen(false);

    try {
      const result = await deviceService.pullFile(selectedDevice.serial, remotePath, localPath);

      if (result.success) {
        addNotification({
          type: "success",
          title: "文件下载",
          message: "文件下载成功",
        });
      } else {
        addNotification({
          type: "error",
          title: "下载失败",
          message: result.error || "文件下载失败",
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "下载失败",
        message: `文件下载失败: ${error}`,
      });
    } finally {
      setIsTransferring(false);
      setLocalPath("");
      setRemotePath("/sdcard/");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <FileBrowserCard 
          currentPath={currentPath}
          onPathChange={(path) => {
            setCurrentPath(path);
            setRemotePath(path);
          }}
        />
        <FileTransferCard />
      </div>
    </div>
  );
};

export default FileManagerPanel;
