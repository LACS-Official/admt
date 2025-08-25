import React from "react";
import {
  makeStyles,
  Text,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  ProgressBar,
  Badge,
  Spinner,
} from "@fluentui/react-components";
import {
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Clock24Regular,
  ArrowClockwise24Regular,
} from "@fluentui/react-icons";
import { BatchOperation, InstallStatus } from "../../types/device";

const useStyles = makeStyles({
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    minWidth: "500px",
    maxWidth: "600px",
  },
  progressSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  progressStats: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemsList: {
    maxHeight: "300px",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "6px",
    padding: "12px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "4px",
  },
  itemContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  itemName: {
    fontWeight: "600",
  },
  itemMessage: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
});

interface BatchOperationDialogProps {
  open: boolean;
  operation: BatchOperation | null;
  onClose: () => void;
  onRetry?: () => void;
}

const BatchOperationDialog: React.FC<BatchOperationDialogProps> = ({
  open,
  operation,
  onClose,
  onRetry,
}) => {
  const styles = useStyles();

  const getStatusIcon = (status: InstallStatus) => {
    switch (status) {
      case "success":
        return <CheckmarkCircle24Regular style={{ color: "var(--colorPaletteGreenForeground1)" }} />;
      case "failed":
        return <ErrorCircle24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />;
      case "installing":
        return <Spinner size="small" />;
      case "pending":
        return <Clock24Regular style={{ color: "var(--colorNeutralForeground3)" }} />;
      case "cancelled":
        return <ErrorCircle24Regular style={{ color: "var(--colorNeutralForeground3)" }} />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: InstallStatus) => {
    switch (status) {
      case "success":
        return <Badge appearance="filled" color="success">成功</Badge>;
      case "failed":
        return <Badge appearance="filled" color="danger">失败</Badge>;
      case "installing":
        return <Badge appearance="filled" color="brand">处理中</Badge>;
      case "pending":
        return <Badge appearance="outline">等待中</Badge>;
      case "cancelled":
        return <Badge appearance="outline">已取消</Badge>;
      default:
        return null;
    }
  };

  const getOperationTitle = () => {
    if (!operation) return "";
    return operation.operationType === "install" ? "批量安装APK" : "批量卸载应用";
  };

  const getProgressPercentage = () => {
    if (!operation || operation.totalItems === 0) return 0;
    return ((operation.completedItems + operation.failedItems) / operation.totalItems) * 100;
  };

  const isCompleted = () => {
    return operation?.status === "completed" || operation?.status === "failed";
  };

  const hasFailures = () => {
    return operation && operation.failedItems > 0;
  };

  if (!operation) return null;

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogTitle>{getOperationTitle()}</DialogTitle>
        <DialogContent>
          <DialogBody>
            <div className={styles.content}>
              <div className={styles.progressSection}>
                <div className={styles.progressStats}>
                  <Text weight="semibold">
                    进度: {operation.completedItems + operation.failedItems} / {operation.totalItems}
                  </Text>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {operation.completedItems > 0 && (
                      <Badge appearance="filled" color="success">
                        成功: {operation.completedItems}
                      </Badge>
                    )}
                    {operation.failedItems > 0 && (
                      <Badge appearance="filled" color="danger">
                        失败: {operation.failedItems}
                      </Badge>
                    )}
                  </div>
                </div>
                <ProgressBar
                  value={getProgressPercentage()}
                  color={hasFailures() ? "error" : "success"}
                />
              </div>

              <div className={styles.itemsList}>
                {operation.items.map((item) => (
                  <div key={item.id} className={styles.item}>
                    {getStatusIcon(item.status)}
                    <div className={styles.itemContent}>
                      <div className={styles.itemName}>{item.name}</div>
                      {item.message && (
                        <div className={styles.itemMessage}>{item.message}</div>
                      )}
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                ))}
              </div>

              {isCompleted() && (
                <div style={{ textAlign: "center", padding: "16px" }}>
                  {hasFailures() ? (
                    <Text style={{ color: "var(--colorPaletteRedForeground1)" }}>
                      操作完成，但有 {operation.failedItems} 个项目失败
                    </Text>
                  ) : (
                    <Text style={{ color: "var(--colorPaletteGreenForeground1)" }}>
                      所有操作已成功完成！
                    </Text>
                  )}
                </div>
              )}
            </div>
          </DialogBody>
        </DialogContent>
        <DialogActions>
          {isCompleted() ? (
            <>
              {hasFailures() && onRetry && (
                <Button
                  appearance="secondary"
                  icon={<ArrowClockwise24Regular />}
                  onClick={onRetry}
                >
                  重试失败项
                </Button>
              )}
              <Button appearance="primary" onClick={onClose}>
                关闭
              </Button>
            </>
          ) : (
            <Button appearance="secondary" onClick={onClose}>
              后台运行
            </Button>
          )}
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export default BatchOperationDialog;
