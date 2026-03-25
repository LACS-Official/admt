import React, { useState, useEffect } from "react";
import {
  makeStyles,
  tokens,
  Button,
  Text,
  Spinner,
  Badge,
  Card,
} from "@fluentui/react-components";
import {
  ShieldLock24Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
  Bot24Regular,
} from "@fluentui/react-icons";
import { InstalledApp } from "../../types/device";
import { aiService } from "../../services/aiService";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "16px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "8px",
  },
  resultArea: {
    backgroundColor: tokens.colorNeutralBackground3,
    padding: "16px",
    borderRadius: "8px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    minHeight: "200px",
    lineHeight: "1.6",
    fontSize: "14px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    gap: "16px",
  },
  riskHigh: {
    color: tokens.colorPaletteRedForeground1,
    fontWeight: "bold",
  },
  riskLow: {
    color: tokens.colorPaletteGreenForeground1,
  },
  permissionList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    marginTop: "8px",
  },
  markdownContent: {
    "& h1, & h2, & h3": {
      marginTop: "16px",
      marginBottom: "8px",
      color: tokens.colorNeutralForeground1,
    },
    "& ul": {
      paddingLeft: "20px",
    },
    "& li": {
      marginBottom: "4px",
    },
    "& strong": {
      color: tokens.colorBrandForeground1,
    }
  }
});

interface APKAuditorPanelProps {
  app: InstalledApp;
  onClose?: () => void;
}

const APKAuditorPanel: React.FC<APKAuditorPanelProps> = ({ app, onClose }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [result, setResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAudit = async () => {
    setIsLoading(true);
    setError(null);
    setResult("");

    const prompt = `请作为安卓安全专家，分析以下应用的风险与隐私合规性：
应用名称: ${app.packageName}
包名: ${app.packageName}
版本: ${app.versionName || "未知"}
权限列表: ${app.permissions?.join(', ') || "未获取到权限列表"}

请提供以下方面的分析：
1. **应用背景概括**：根据包名和名称推测该应用的功能。
2. **权限合理性**：分析请求的权限是否与其功能相符，是否存在过度索权。
3. **潜在风险**：是否存在恶意扣费、隐私泄露、后台常驻等风险。
4. **综合建议**：是否建议用户保留、禁用或卸载。

请使用简洁、专业的中文回答，并使用 Markdown 格式。`;

    try {
      const response = await aiService.chat([
        { role: "system", content: "你是一个安卓应用安全审计专家，能够分析应用权限并提供安全建议。" },
        { role: "user", content: prompt }
      ]);

      if (response.error) {
        setError(response.error);
      } else {
        setResult(response.content);
      }
    } catch (err: any) {
      setError(err.message || "审计请求失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startAudit();
  }, [app.packageName]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <ShieldLock24Regular style={{ color: tokens.colorBrandForeground1 }} />
        <Text size={500} weight="bold">AI 安全审计</Text>
      </div>

      <Card appearance="subtle" style={{ padding: '12px', backgroundColor: tokens.colorNeutralBackground2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text weight="semibold">{app.packageName}</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {app.versionName ? `版本: ${app.versionName}` : "版本信息未知"}
          </Text>
          <div className={styles.permissionList}>
             <Badge appearance="outline" color="subtle" size="small">
               {app.permissions?.length || 0} 个权限
             </Badge>
             {app.isSystemApp && <Badge color="important" size="small">系统应用</Badge>}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Spinner label="AI 正在深度分析中..." />
          <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>这可能需要几十秒钟，请稍候</Text>
        </div>
      ) : error ? (
        <div className={styles.loadingContainer}>
          <Warning24Regular style={{ fontSize: "48px", color: tokens.colorPaletteRedForeground1 }} />
          <Text weight="semibold">分析出错</Text>
          <Text align="center">{error}</Text>
          <Button onClick={startAudit} appearance="primary">重试</Button>
        </div>
      ) : (
        <div className={styles.resultArea}>
          <div className={styles.markdownContent}>
            {result ? result : "暂无分析结果"}
          </div>
        </div>
      )}

      {!isLoading && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
           <Button appearance="subtle" onClick={startAudit} icon={<Bot24Regular />}>重新分析</Button>
           {onClose && <Button onClick={onClose}>关闭</Button>}
        </div>
      )}
    </div>
  );
};

export default APKAuditorPanel;
