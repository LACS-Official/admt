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
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
} from "@fluentui/react-components";
import {
  ErrorCircle24Regular,
  Info24Regular,
  ArrowClockwise24Regular,
  Lightbulb24Regular,
} from "@fluentui/react-icons";
import { ErrorInfo } from "../../utils/errorHandler";

const useStyles = makeStyles({
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    minWidth: "400px",
    maxWidth: "600px",
  },
  errorHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "var(--colorPaletteRedBackground2)",
    borderRadius: "6px",
    border: "1px solid var(--colorPaletteRedBorder2)",
  },
  errorMessage: {
    padding: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "6px",
    fontFamily: "monospace",
    fontSize: "12px",
    wordBreak: "break-all",
  },
  suggestionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  suggestionItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    padding: "8px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "4px",
  },
  suggestionText: {
    flex: 1,
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
});

interface ErrorDialogProps {
  open: boolean;
  errorInfo: ErrorInfo | null;
  onClose: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
  rawError?: string;
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({
  open,
  errorInfo,
  onClose,
  onRetry,
  showDetails = false,
  rawError,
}) => {
  const styles = useStyles();

  if (!errorInfo) return null;

  const handleRetry = () => {
    onRetry?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogTitle>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ErrorCircle24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
            {errorInfo.title}
          </div>
        </DialogTitle>
        
        <DialogContent>
          <DialogBody>
            <div className={styles.content}>
              {/* 错误概述 */}
              <div className={styles.errorHeader}>
                <ErrorCircle24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
                <div>
                  <Text weight="semibold" style={{ color: "var(--colorPaletteRedForeground1)" }}>
                    {errorInfo.title}
                  </Text>
                  <div>
                    <Text size={200}>{errorInfo.message}</Text>
                  </div>
                </div>
              </div>

              {/* 解决建议 */}
              {errorInfo.suggestions && errorInfo.suggestions.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <Lightbulb24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                    <Text weight="semibold">解决建议</Text>
                  </div>
                  <div className={styles.suggestionsList}>
                    {errorInfo.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} className={styles.suggestionItem}>
                        <Text size={200} style={{ 
                          color: "var(--colorBrandForeground1)", 
                          fontWeight: "bold",
                          minWidth: "20px"
                        }}>
                          {index + 1}.
                        </Text>
                        <Text size={200} className={styles.suggestionText}>
                          {suggestion}
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 详细错误信息 */}
              {showDetails && rawError && (
                <Accordion collapsible>
                  <AccordionItem value="details">
                    <AccordionHeader icon={<Info24Regular />}>
                      详细错误信息
                    </AccordionHeader>
                    <AccordionPanel>
                      <div className={styles.errorMessage}>
                        <Text size={200}>{rawError}</Text>
                      </div>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              )}

              {/* 操作状态指示 */}
              <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--colorNeutralForeground2)" }}>
                <div>
                  <Text size={200}>
                    可重试: {errorInfo.retryable ? "是" : "否"}
                  </Text>
                </div>
                <div>
                  <Text size={200}>
                    可操作: {errorInfo.actionable ? "是" : "否"}
                  </Text>
                </div>
              </div>
            </div>
          </DialogBody>
        </DialogContent>
        
        <DialogActions>
          <div className={styles.actions}>
            <Button appearance="secondary" onClick={onClose}>
              关闭
            </Button>
            
            {errorInfo.retryable && onRetry && (
              <Button 
                appearance="primary" 
                icon={<ArrowClockwise24Regular />}
                onClick={handleRetry}
              >
                重试
              </Button>
            )}
            
            {errorInfo.actionable && (
              <Button 
                appearance="outline"
                onClick={() => {
                  // 打开帮助文档或故障排除页面
                  window.open("https://developer.android.com/studio/command-line/adb", "_blank");
                }}
              >
                查看帮助
              </Button>
            )}
          </div>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export default ErrorDialog;
