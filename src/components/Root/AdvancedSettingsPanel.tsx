import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Switch,
  Card,
  CardHeader,
  Field,
  Button,
  Spinner,
  MessageBar,
  Badge,
} from "@fluentui/react-components";
import {
  Sparkle24Regular,
  Flash24Regular,
  WeatherMoon24Regular,
  ShieldLock24Regular,
  ArrowSync24Regular,
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
  section: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
  },
  card: {
    borderRadius: "14px",
    padding: "16px 18px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  pill: {
    borderRadius: "9999px",
  },
  caption: {
    color: "var(--colorNeutralForeground2)",
  },
  mono: {
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, "Cascadia Code", monospace',
    fontSize: "12px",
  },
});

type SettingKey = "perf" | "dark" | "anim" | "selinux";

interface SettingState {
  value: boolean;
  loading: boolean;
  supported: boolean;
  applying: boolean;
}

const SETTING_KEYS: SettingKey[] = ["perf", "dark", "anim", "selinux"];

const DEFAULT_VALUES: Record<SettingKey, boolean> = {
  perf: true,
  dark: false,
  anim: true,
  selinux: true,
};

// 通过 adb shell 读取各项初值
const READ_ARGS: Record<SettingKey, string[]> = {
  perf: ["settings", "get", "global", "low_power"],
  dark: ["settings", "get", "secure", "ui_night_mode"],
  anim: ["settings", "get", "global", "window_animation_scale"],
  selinux: ["getenforce"],
};

function runShell(serial: string, args: string[]): Promise<CommandResult> {
  return invoke<CommandResult>("execute_adb_command", {
    serial,
    command: "shell",
    args,
  });
}

function firstLine(output: string): string {
  return (output || "").trim().split("\n")[0].trim().toLowerCase();
}

// 将设备返回值解析为开关状态；返回 null 表示设备未给出可判定值
function parseValue(key: SettingKey, output: string): boolean | null {
  const v = firstLine(output);
  if (!v || v === "null") return null;
  switch (key) {
    case "perf":
      // low_power: 0 = 未开启省电（性能优先），1 = 开启省电
      if (v === "0") return true;
      if (v === "1") return false;
      return null;
    case "dark":
      // ui_night_mode: 2 = MODE_NIGHT_YES（强制深色）
      if (v === "2") return true;
      if (v === "0" || v === "1" || v === "3") return false;
      return null;
    case "anim":
      // 动画缩放 1 = 系统默认动画，0 = 关闭动画
      if (v === "1" || v === "1.0") return true;
      if (v === "0" || v === "0.0") return false;
      return null;
    case "selinux":
      if (v.startsWith("enforcing")) return true;
      if (v.startsWith("permissive")) return false;
      return null;
    default:
      return null;
  }
}

function writeArgs(key: SettingKey, on: boolean): string[][] {
  switch (key) {
    case "perf":
      return [["settings", "put", "global", "low_power", on ? "0" : "1"]];
    case "dark":
      return [["cmd", "uimode", "night", on ? "yes" : "no"]];
    case "anim": {
      const scale = on ? "1" : "0";
      return [
        ["settings", "put", "global", "window_animation_scale", scale],
        ["settings", "put", "global", "transition_animation_scale", scale],
        ["settings", "put", "global", "animator_duration_scale", scale],
      ];
    }
    case "selinux":
      // setenforce 需要 root 权限，通过 su 执行
      return [["su", "-c", "setenforce", on ? "1" : "0"]];
    default:
      return [];
  }
}

function storageKey(serial: string, key: SettingKey): string {
  return `admt.root.adv.${serial}.${key}`;
}

function readStored(serial: string, key: SettingKey): boolean | null {
  try {
    const raw = localStorage.getItem(storageKey(serial, key));
    return raw === null ? null : raw === "1";
  } catch {
    return null;
  }
}

function writeStored(serial: string, key: SettingKey, value: boolean): void {
  try {
    localStorage.setItem(storageKey(serial, key), value ? "1" : "0");
  } catch {
    // localStorage 不可用时忽略
  }
}

function buildInitialStates(serial: string): Record<SettingKey, SettingState> {
  const make = (key: SettingKey): SettingState => ({
    value: serial ? (readStored(serial, key) ?? DEFAULT_VALUES[key]) : DEFAULT_VALUES[key],
    loading: !!serial,
    supported: true,
    applying: false,
  });
  return {
    perf: make("perf"),
    dark: make("dark"),
    anim: make("anim"),
    selinux: make("selinux"),
  };
}

interface AdvancedSettingsPanelProps {
  device: DeviceInfo | null;
}

const AdvancedSettingsPanel: React.FC<AdvancedSettingsPanelProps> = ({ device }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const serial = device?.serial || "";

  const [states, setStates] = useState<Record<SettingKey, SettingState>>(() =>
    buildInitialStates(serial)
  );
  const [isRooted, setIsRooted] = useState(false);
  const [selinuxRaw, setSelinuxRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // 挂载 / 切换设备 / 刷新时读取设备初值，并检测 root 用于 SELinux 开关
  useEffect(() => {
    let cancelled = false;

    if (!serial) {
      setStates(buildInitialStates(""));
      setIsRooted(false);
      setSelinuxRaw("");
      return;
    }

    setStates(buildInitialStates(serial));
    setSelinuxRaw("");
    setError(null);

    SETTING_KEYS.forEach((key) => {
      runShell(serial, READ_ARGS[key])
        .then((res) => {
          if (cancelled) return;
          const parsed = res.success ? parseValue(key, res.output) : null;
          if (key === "selinux") setSelinuxRaw((res.output || "").trim());
          setStates((prev) => ({
            ...prev,
            [key]: {
              ...prev[key],
              loading: false,
              supported: !!res.success,
              value: parsed ?? prev[key].value,
            },
          }));
          if (res.success && parsed !== null) writeStored(serial, key, parsed);
        })
        .catch(() => {
          if (cancelled) return;
          setStates((prev) => ({
            ...prev,
            [key]: { ...prev[key], loading: false, supported: false },
          }));
        });
    });

    runShell(serial, ["su", "-c", "id"])
      .then((res) => {
        if (!cancelled) setIsRooted(!!(res.success && /uid=0/.test(res.output || "")));
      })
      .catch(() => {
        if (!cancelled) setIsRooted(false);
      });

    return () => {
      cancelled = true;
    };
  }, [serial, refreshTick]);

  const handleToggle = async (key: SettingKey, next: boolean) => {
    if (!serial) return;
    if (key === "selinux" && !isRooted) return;

    const prevValue = states[key].value;
    if (next === prevValue) return;

    setError(null);
    setStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], value: next, applying: true },
    }));

    try {
      for (const args of writeArgs(key, next)) {
        const res = await runShell(serial, args);
        if (!res.success) {
          throw new Error(res.error || res.output || "command failed");
        }
      }
      writeStored(serial, key, next);
      setStates((prev) => ({
        ...prev,
        [key]: { ...prev[key], applying: false },
      }));
      if (key === "selinux") setSelinuxRaw(next ? "Enforcing" : "Permissive");
    } catch (e) {
      // 失败回滚 UI 状态并提示
      setStates((prev) => ({
        ...prev,
        [key]: { ...prev[key], value: prevValue, applying: false },
      }));
      const message = e instanceof Error ? e.message : String(e);
      setError(t('root.apply_failed', { error: message }));
    }
  };

  const renderCard = (
    key: SettingKey,
    title: string,
    description: string,
    icon: React.ReactNode
  ) => {
    const st = states[key];
    const needRoot = key === "selinux" && !isRooted;
    const disabled =
      !serial || st.loading || !st.supported || st.applying || needRoot;

    let label: string;
    if (st.loading) label = t('root.switch_reading');
    else if (!st.supported) label = t('root.switch_unsupported');
    else label = st.value ? t('root.switch_on') : t('root.switch_off');

    return (
      <Card className={styles.card}>
        <CardHeader
          header={
            <div className={styles.titleRow}>
              {icon}
              <Text weight="semibold">{title}</Text>
            </div>
          }
          description={description}
        />
        <div className={styles.cardBody}>
          <Field>
            <Switch
              checked={st.value}
              disabled={disabled}
              label={label}
              onChange={(_, data) => handleToggle(key, data.checked)}
            />
          </Field>
          {st.applying && (
            <div className={styles.row}>
              <Spinner size="tiny" />
              <Text size={200} className={styles.caption}>{t('root.switch_applying')}</Text>
            </div>
          )}
          {needRoot && (
            <Badge appearance="tint" color="warning">{t('root.switch_need_root')}</Badge>
          )}
          {key === "selinux" && selinuxRaw && (
            <Text size={200} className={styles.mono}>
              {t('root.selinux_current', { mode: selinuxRaw })}
            </Text>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <Text size={500} weight="semibold">{t('root.tab_settings', '高级设置')}</Text>
        <Button
          appearance="subtle"
          size="small"
          icon={<ArrowSync24Regular />}
          className={styles.pill}
          disabled={!serial}
          onClick={() => setRefreshTick((x) => x + 1)}
        >
          {t('root.refresh_status')}
        </Button>
      </div>

      {!serial && <MessageBar intent="warning">{t('root.no_device')}</MessageBar>}
      {error && <MessageBar intent="error">{error}</MessageBar>}

      <Text size={200} className={styles.hint}>{t('root.setting_hint')}</Text>

      <Text size={400} weight="semibold">{t('root.sys_optimization')}</Text>
      <div className={styles.section}>
        {renderCard(
          "perf",
          t('root.perf_mode'),
          t('root.perf_mode_desc'),
          <Flash24Regular style={{ fontSize: "20px" }} />
        )}
        {renderCard(
          "dark",
          t('root.dark_mode_forced'),
          t('root.dark_mode_forced_desc'),
          <WeatherMoon24Regular style={{ fontSize: "20px" }} />
        )}
        {renderCard(
          "anim",
          t('root.smooth_anim'),
          t('root.smooth_anim_desc'),
          <Sparkle24Regular style={{ fontSize: "20px" }} />
        )}
      </div>

      <Text size={400} weight="semibold" style={{ marginTop: "8px" }}>
        {t('root.advanced_ops')}
      </Text>
      <div className={styles.section}>
        {renderCard(
          "selinux",
          t('root.selinux_status'),
          t('root.selinux_mode_desc'),
          <ShieldLock24Regular style={{ fontSize: "20px" }} />
        )}
      </div>
    </div>
  );
};

export default AdvancedSettingsPanel;
