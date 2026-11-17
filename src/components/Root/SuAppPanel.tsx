import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Button,
  Badge,
  MessageBar,
  Spinner,
} from "@fluentui/react-components";
import {
  Key24Regular,
  ArrowSync24Regular,
  CheckmarkCircle24Regular,
  Warning24Regular,
  ShieldLock24Regular,
  Document24Regular,
} from "@fluentui/react-icons";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { DeviceInfo, CommandResult } from "../../types/device";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "16px",
    height: "100%",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  hint: {
    color: "var(--colorNeutralForeground2)",
  },
  card: {
    borderRadius: "var(--admt-radius-card)",
    padding: "16px 18px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  infoRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "12px",
    padding: "6px 0",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  label: {
    flexShrink: 0,
    color: "var(--colorNeutralForeground2)",
  },
  value: {
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, "Cascadia Code", monospace',
    fontSize: "12px",
    textAlign: "right",
    wordBreak: "break-all",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
  pill: {
    borderRadius: "var(--admt-radius-pill)",
  },
  logBox: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "12px",
    borderRadius: "var(--admt-radius-card)",
    backgroundColor: "var(--colorNeutralBackground3)",
    border: "1px solid var(--colorNeutralStroke2)",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, "Cascadia Code", monospace',
    fontSize: "12px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
});

type RootState = "unknown" | "rooted" | "not-rooted";
type BusyAction = "test" | "log" | null;

interface SuInfo {
  rootState: RootState;
  uidLine: string;
  suPath: string;
  suVersion: string;
  busyboxPath: string;
}

const EMPTY_INFO: SuInfo = {
  rootState: "unknown",
  uidLine: "",
  suPath: "",
  suVersion: "",
  busyboxPath: "",
};

interface SuAppPanelProps {
  device: DeviceInfo | null;
}

function runShell(serial: string, args: string[]): Promise<CommandResult> {
  return invoke<CommandResult>("execute_adb_command", {
    serial,
    command: "shell",
    args,
  });
}

function firstLine(text: string): string {
  return (text || "").trim().split("\n")[0].trim();
}

function msgOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// 通过真实 adb shell 命令收集 su 状态；任一子命令失败只影响对应字段
async function detect(serial: string): Promise<SuInfo> {
  const idRes = await runShell(serial, ["su", "-c", "id"]);
  const idOut = (idRes.output || "").trim();
  const rooted = !!(idRes.success && /uid=0/.test(idOut));

  let suPath = "";
  let suVersion = "";
  let busyboxPath = "";

  try {
    const p = await runShell(serial, ["command", "-v", "su"]);
    if (p.success) suPath = firstLine(p.output);
  } catch {
    // 忽略单项失败
  }

  try {
    const v = await runShell(serial, ["su", "-v"]);
    suVersion = firstLine(v.output || v.error || "");
    if (!suVersion) {
      const v2 = await runShell(serial, ["su", "--version"]);
      suVersion = firstLine(v2.output || v2.error || "");
    }
  } catch {
    // 忽略单项失败
  }

  try {
    const b = await runShell(serial, ["command", "-v", "busybox"]);
    if (b.success) busyboxPath = firstLine(b.output);
  } catch {
    // 忽略单项失败
  }

  return {
    rootState: rooted ? "rooted" : "not-rooted",
    uidLine: firstLine(idOut),
    suPath,
    suVersion,
    busyboxPath,
  };
}

const SuAppPanel: React.FC<SuAppPanelProps> = ({ device }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const serial = device?.serial || "";

  const [info, setInfo] = useState<SuInfo>(EMPTY_INFO);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!serial) {
      setInfo(EMPTY_INFO);
      setLogOpen(false);
      setLogLines([]);
      return;
    }

    setChecking(true);
    setError(null);
    setTestResult(null);
    detect(serial)
      .then((next) => {
        if (!cancelled) setInfo(next);
      })
      .catch((e) => {
        if (!cancelled) setError(t('root.su_cmd_error', { error: msgOf(e) }));
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [serial, refreshTick]);

  const testAuth = async () => {
    if (!serial || busy) return;
    setBusy("test");
    setTestResult(null);
    setError(null);
    try {
      const res = await runShell(serial, ["su", "-c", "id"]);
      const ok = !!(res.success && /uid=0/.test(res.output || ""));
      setTestResult(ok ? "ok" : "fail");
      setInfo((prev) => ({
        ...prev,
        rootState: ok ? "rooted" : "not-rooted",
        uidLine: firstLine(res.output || ""),
      }));
    } catch (e) {
      setError(t('root.su_cmd_error', { error: msgOf(e) }));
    } finally {
      setBusy(null);
    }
  };

  const viewLog = async () => {
    if (!serial || busy) return;
    setBusy("log");
    setError(null);
    try {
      const res = await runShell(serial, ["logcat", "-d", "-t", "200"]);
      if (!res.success) {
        throw new Error(res.error || res.output || "logcat failed");
      }
      const lines = (res.output || "")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) =>
          /magisk|kernelsu|apatch|grant|deny|authoriz|su\b|uid=0/i.test(line)
        );
      setLogLines(lines.slice(-80));
      setLogOpen(true);
    } catch (e) {
      setError(t('root.su_cmd_error', { error: msgOf(e) }));
    } finally {
      setBusy(null);
    }
  };

  const statusBadge =
    info.rootState === "rooted" ? (
      <Badge appearance="tint" color="success" icon={<CheckmarkCircle24Regular />}>
        {t('root.su_rooted')}
      </Badge>
    ) : info.rootState === "not-rooted" ? (
      <Badge appearance="tint" color="warning" icon={<Warning24Regular />}>
        {t('root.su_not_rooted')}
      </Badge>
    ) : (
      <Badge appearance="tint" color="subtle">{t('root.su_unknown')}</Badge>
    );

  const infoRows = [
    { label: t('root.su_path'), value: info.suPath },
    { label: t('root.su_version'), value: info.suVersion },
    { label: t('root.su_identity'), value: info.uidLine },
    { label: t('root.su_busybox'), value: info.busyboxPath },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <Text size={500} weight="semibold">{t('root.su_title')}</Text>
        <Button
          appearance="subtle"
          size="small"
          icon={<ArrowSync24Regular />}
          className={styles.pill}
          disabled={!serial || checking || busy !== null}
          onClick={() => setRefreshTick((x) => x + 1)}
        >
          {t('root.su_check')}
        </Button>
      </div>

      {!serial && <MessageBar intent="warning">{t('root.su_no_device')}</MessageBar>}
      {error && <MessageBar intent="error">{error}</MessageBar>}
      {checking && (
        <div className={styles.row}>
          <Spinner size="tiny" />
          <Text size={200} className={styles.label}>{t('root.su_checking')}</Text>
        </div>
      )}

      <Text size={200} className={styles.hint}>{t('root.su_desc')}</Text>

      <Card className={styles.card}>
        <CardHeader
          header={
            <div className={styles.titleRow}>
              <Key24Regular style={{ fontSize: "20px" }} />
              <Text weight="semibold">{t('root.su_status')}</Text>
            </div>
          }
        />
        <div className={styles.body}>
          <div className={styles.row}>{statusBadge}</div>
          {info.rootState === "not-rooted" && serial && (
            <MessageBar intent="info">{t('root.su_not_rooted_hint')}</MessageBar>
          )}
        </div>
      </Card>

      <Card className={styles.card}>
        <CardHeader
          header={<Text weight="semibold">{t('root.su_common_states')}</Text>}
        />
        <div>
          {infoRows.map((row) => (
            <div className={styles.infoRow} key={row.label}>
              <Text size={300} className={styles.label}>{row.label}</Text>
              <Text size={200} className={styles.value}>
                {row.value || t('root.su_na')}
              </Text>
            </div>
          ))}
        </div>
      </Card>

      <Card className={styles.card}>
        <CardHeader
          header={<Text weight="semibold">{t('root.su_actions')}</Text>}
        />
        <div className={styles.actions}>
          <Button
            appearance="primary"
            icon={<ShieldLock24Regular />}
            className={styles.pill}
            disabled={!serial || checking || busy !== null}
            onClick={testAuth}
          >
            {busy === "test" ? t('root.su_busy') : t('root.su_test')}
          </Button>
          <Button
            appearance="subtle"
            icon={<Document24Regular />}
            className={styles.pill}
            disabled={!serial || checking || busy !== null}
            onClick={viewLog}
          >
            {busy === "log" ? t('root.su_busy') : t('root.su_log')}
          </Button>
        </div>
        {testResult === "ok" && (
          <MessageBar intent="success">{t('root.su_test_ok')}</MessageBar>
        )}
        {testResult === "fail" && (
          <MessageBar intent="warning">{t('root.su_test_fail')}</MessageBar>
        )}
      </Card>

      {logOpen && (
        <Card className={styles.card}>
          <CardHeader
            header={
              <div className={styles.titleRow}>
                <Document24Regular style={{ fontSize: "20px" }} />
                <Text weight="semibold">{t('root.su_log_title')}</Text>
              </div>
            }
          />
          <div className={styles.logBox}>
            {logLines.length === 0 ? (
              <Text size={200} className={styles.label}>{t('root.su_log_empty')}</Text>
            ) : (
              logLines.map((line, index) => <div key={index}>{line}</div>)
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SuAppPanel;
