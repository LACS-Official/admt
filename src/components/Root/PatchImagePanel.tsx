
import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Button,
  Card,
  CardHeader,
  CardFooter,
  Field,
  Input,
  ProgressBar,
  Dropdown,
  Option,
  Switch,
} from "@fluentui/react-components";
import { Folder24Regular, Laptop24Regular, DeviceEq24Regular, ShieldKeyhole24Regular } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { DeviceInfo } from "../../types/device";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "../../stores/appStore";
import logService from "../../services/logService";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    padding: "16px",
  },
  card: {
    width: "100%",
    maxWidth: "640px",
  },
  inputGroup: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  progressContainer: {
    marginTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  optionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px",
  },
  hintBox: {
    marginBottom: "12px",
    padding: "8px 14px",
    borderRadius: "10px",
    backgroundColor: "rgba(0, 113, 227, 0.06)",
    border: "1px solid rgba(0, 113, 227, 0.15)",
  },
  dangerBox: {
    marginBottom: "12px",
    padding: "8px 14px",
    borderRadius: "10px",
    borderLeft: "4px solid var(--colorPaletteRedBorder1)",
    backgroundColor: "var(--colorPaletteRedBackground1)",
  }
});

interface PatchImagePanelProps {
  device: DeviceInfo | null;
}

type PatchType = "Magisk" | "KernelSU" | "SukiSU Ultra" | "APatch";
type PartitionType = "auto" | "boot" | "init_boot" | "vendor_boot";

// 把 Tauri 的 reject 值（可能是字符串、Error、{message} 或 {code: detail}）转成可读文本，
// 避免直接 String(e) 得到 "[object Object]" 而丢失真实错误信息。
function extractErrorMessage(e: unknown): string {
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message || String(e);
  if (e && typeof e === "object") {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message.length > 0) return obj.message;
    const entries = Object.entries(obj);
    if (entries.length > 0) {
      const [key, val] = entries[0];
      if (typeof val === "string") return val.length > 0 ? `${key}: ${val}` : key;
      if (val && typeof val === "object") {
        const inner = extractErrorMessage(val);
        return inner === "[object Object]" ? key : `${key}: ${inner}`;
      }
      return key;
    }
    try {
      return JSON.stringify(obj);
    } catch {
      return String(e);
    }
  }
  return String(e);
}

const PatchImagePanel: React.FC<PatchImagePanelProps> = ({ device }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [imagePath, setImagePath] = useState("");
  const [patcherPath, setPatcherPath] = useState("");
  const [patchType, setPatchType] = useState<PatchType>("Magisk");
  const [partition, setPartition] = useState<PartitionType>("auto");
  const [kmi, setKmi] = useState("");
  const [superKey, setSuperKey] = useState("");
  const [disableAvb, setDisableAvb] = useState(false);
  const [isOffline, setIsOffline] = useState(true);
  const [isPatching, setIsPatching] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isInstallingTool, setIsInstallingTool] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [missingDependency, setMissingDependency] = useState<string | null>(null);
  const [toolInstallMsg, setToolInstallMsg] = useState<string | null>(null);
  const [patchedPath, setPatchedPath] = useState<string | null>(null);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);

  const navigationParams = useAppStore((state) => state.navigationParams);
  const setNavigationParams = useAppStore((state) => state.setNavigationParams);

  useEffect(() => {
    if (navigationParams?.imagePath) {
      setImagePath(navigationParams.imagePath);
      setNavigationParams(undefined);
    }
  }, [navigationParams, setNavigationParams]);

  useEffect(() => {
    const unlisten = listen<{ status: string; progress: number }>("patch-progress", (event) => {
      setStatusText(event.payload.status);
      setProgress(event.payload.progress);
    });
    return () => {
      unlisten.then(f => f());
    };
  }, []);

  // 切换引擎时，重置与引擎强相关的字段，避免残留错误输入
  useEffect(() => {
    setPatchedPath(null);
    setFlashMsg(null);
    setMissingDependency(null);
    setToolInstallMsg(null);
    if (patchType === "APatch") {
      setPartition("boot");
    }
  }, [patchType]);

  const serial = device?.serial || "";

  const handleSelectFile = async (setter: React.Dispatch<React.SetStateAction<string>>, type: 'img' | 'apk') => {
    const result = await open({
      multiple: false,
      filters: type === 'img'
        ? [{ name: t('root.img_filter_name'), extensions: ["img"] }]
        : [{ name: t('root.patch_tool_filter_name'), extensions: ["apk", "exe"] }],
    });
    if (typeof result === "string") {
      setter(result);
    }
  };

  const toolForEngine = (): string => {
    if (patchType === "KernelSU" || patchType === "SukiSU Ultra") return "ksud";
    if (patchType === "APatch") return "kptools";
    return "magiskboot";
  };

  const handleInstallTool = async () => {
    const tool = toolForEngine();
    setIsInstallingTool(true);
    setToolInstallMsg(null);
    logService.logInfo("开始安装修补工具", "PatchImagePanel", { tool });
    try {
      await invoke("ensure_root_patch_tool", { tool });
      logService.logInfo("修补工具安装完成", "PatchImagePanel", { tool });
      setToolInstallMsg(t('root.tool_installed', { tool }));
    } catch (e: unknown) {
      const error = extractErrorMessage(e);
      logService.logError("修补工具安装失败", "PatchImagePanel", { tool, error });
      setToolInstallMsg(t('root.tool_install_failed', { error }));
    } finally {
      setIsInstallingTool(false);
    }
  };

  const handleDetectKmi = async () => {
    if (!serial) {
      setStatusText(t('root.no_device'));
      return;
    }
    try {
      const detected = await invoke<string>("root_detect_kmi", { serial });
      setKmi(detected);
      setStatusText(t('root.kmi_detected', { kmi: detected }));
    } catch (e: unknown) {
      const error = extractErrorMessage(e);
      logService.logError("检测 KMI 失败", "PatchImagePanel", { serial, error });
      setStatusText(t('root.kmi_detect_failed', { error }));
    }
  };

  const handleStartPatch = async () => {
    setIsPatching(true);
    setProgress(0);
    setStatusText(t('root.patch_preparing'));
    setPatchedPath(null);
    setFlashMsg(null);
    try {
      setMissingDependency(null);
      const result = await invoke("patch_boot_image_local", {
        imagePath,
        patcherPath,
        patchType,
        partition: partition === "auto" ? null : partition,
        kmi: (patchType === "KernelSU" || patchType === "SukiSU Ultra") ? kmi : null,
        superKey: patchType === "APatch" ? superKey : null,
      }) as { success: boolean, output: string, error?: string, outputPath?: string };

      console.log("Patch Result:", result);

      if (result.success && result.outputPath) {
        setPatchedPath(result.outputPath);
        setStatusText(t('root.patch_success'));
        setProgress(100);
      } else {
        const errMsg = result.error || result.output || t('root.patch_local_error');
        setStatusText(t('root.patch_failed', { error: errMsg }));
        console.error("Patch logically failed:", result);
      }
    } catch (error: unknown) {
      console.error("Full Patch Exception:", error);
      const errorMsg = extractErrorMessage(error);
      logService.logError("本地镜像修补失败", "PatchImagePanel", {
        patchType,
        partition,
        error: errorMsg,
      });

      if (errorMsg.includes("DEPENDENCY_MISSING")) {
        const dep = errorMsg.match(/DEPENDENCY_MISSING:([^\s(:]+)/)?.[1] || toolForEngine();
        setMissingDependency(dep);
        setStatusText(t('root.missing_tool_title', { tool: dep }));
      } else if (errorMsg.includes("PATCH_ENGINE_REQUIRES_PATCHER")) {
        setStatusText(t('root.engine_requires_patcher'));
      } else if (errorMsg.includes("PATCH_ENGINE_REQUIRES_DEVICE")) {
        setStatusText(t('root.engine_requires_device'));
      } else if (errorMsg.includes("PATCH_OUTPUT_INVALID")) {
        setStatusText(`修补产物校验未通过：${errorMsg}`);
      } else {
        setStatusText(t('root.patch_failed', { error: errorMsg }));
      }
    } finally {
      setIsPatching(false);
    }
  };

  const handleFlash = async () => {
    if (!patchedPath || !serial) {
      setFlashMsg(t('root.flash_no_patch'));
      return;
    }
    const targetPartition = partition === "auto" ? "boot" : partition;
    const confirmMsg = t('root.flash_confirm', { partition: targetPartition, image: patchedPath });
    if (!window.confirm(confirmMsg)) {
      return;
    }
    setIsFlashing(true);
    setFlashMsg(t('root.flash_running'));
    try {
      const res = await invoke<{ success: boolean; output?: string; error?: string }>(
        "root_flash_patched_image",
        { serial, partition: targetPartition, imagePath: patchedPath, disableAvb }
      );
      if (res.success) {
        setFlashMsg(t('root.flash_done', { partition: targetPartition }));
      } else {
        setFlashMsg(t('root.flash_failed', { error: res.error || "" }));
      }
    } catch (e: unknown) {
      const error = extractErrorMessage(e);
      logService.logError("刷入修补镜像失败", "PatchImagePanel", {
        serial,
        partition: targetPartition,
        error,
      });
      setFlashMsg(t('root.flash_failed', { error }));
    } finally {
      setIsFlashing(false);
    }
  };

  const handleOpenToolDir = async () => {
    try {
      const path = await invoke("get_resource_path", { path: "tools/adb/windows" });
      await invoke("open_folder", { path });
    } catch (error) {
      console.error("Open dir error:", error);
    }
  };

  const needsPatcherApk = patchType === "Magisk";
  const needsKmi = patchType === "KernelSU" || patchType === "SukiSU Ultra";
  const needsSuperKey = patchType === "APatch";
  const usesNativePcTool = patchType !== "Magisk";

  return (
    <div className={styles.container}>
      {missingDependency && (
        <Card style={{ borderLeft: "4px solid var(--colorPaletteRedBorder1)", backgroundColor: "var(--colorPaletteRedBackground1)" }}>
          <CardHeader
            header={<Text weight="bold" size={400}>{t('root.missing_tool_title', { tool: missingDependency })}</Text>}
            description={
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                <Text>{t('root.missing_tool_desc')}</Text>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button size="small" onClick={handleInstallTool} disabled={isInstallingTool}>
                    {isInstallingTool ? t('root.installing_tool') : t('root.install_tool')}
                  </Button>
                  <Button size="small" onClick={handleOpenToolDir}>
                    {t('root.open_release_dir')}
                  </Button>
                </div>
                {toolInstallMsg && <Text size={200}>{toolInstallMsg}</Text>}
              </div>
            }
          />
        </Card>
      )}

      <Card className={styles.card}>
        <CardHeader
          header={<Text weight="semibold" size={400}>{t('root.patch_title')}</Text>}
          description={<Text size={300}>{t('root.patch_desc')}</Text>}
        />

        <div style={{ padding: "12px 0" }}>
          <div className={styles.optionsGrid}>
            <Field label={t('root.patch_type')}>
              <Dropdown
                value={patchType}
                onOptionSelect={(_, data) => setPatchType(data.selectedOptions[0] as PatchType)}
              >
                <Option value="Magisk">Magisk</Option>
                <Option value="KernelSU">KernelSU</Option>
                <Option value="SukiSU Ultra">SukiSU Ultra</Option>
                <Option value="APatch">APatch</Option>
              </Dropdown>
            </Field>

            <Field label={t('root.patch_partition')}>
              <Dropdown
                value={partition}
                onOptionSelect={(_, data) => setPartition(data.selectedOptions[0] as PartitionType)}
              >
                <Option value="auto">{t('root.partition_auto')}</Option>
                <Option value="boot">boot</Option>
                <Option value="init_boot">init_boot</Option>
                <Option value="vendor_boot">vendor_boot</Option>
              </Dropdown>
            </Field>

            <Text size={200} style={{ gridColumn: "1 / -1", color: "var(--colorNeutralForeground2)" }}>
              {t('root.patch_engine_hint')}
            </Text>
          </div>

          {partition === "auto" && (
            <div className={styles.hintBox}>
              <Text size={200} style={{ color: "var(--colorBrandForeground1)" }}>
                {t('root.partition_hint')}
              </Text>
            </div>
          )}

          <Field label={t('root.image_path')} hint={t('root.image_placeholder')}>
            <div className={styles.inputGroup}>
              <Input
                value={imagePath}
                onChange={(_, data) => setImagePath(data.value)}
                placeholder={t('root.image_placeholder')}
                style={{ flex: 1 }}
              />
              <Button icon={<Folder24Regular />} onClick={() => handleSelectFile(setImagePath, 'img')}>
                {t('flash.select_file_btn')}
              </Button>
            </div>
          </Field>

          {needsPatcherApk && (
            <Field label={t('root.patcher_path_magisk')} style={{ marginTop: "16px" }}>
              <div className={styles.inputGroup}>
                <Input
                  value={patcherPath}
                  onChange={(_, data) => setPatcherPath(data.value)}
                  placeholder={t('root.patcher_placeholder_magisk')}
                  style={{ flex: 1 }}
                />
                <Button icon={<Folder24Regular />} onClick={() => handleSelectFile(setPatcherPath, 'apk')}>
                  {t('flash.select_file_btn')}
                </Button>
              </div>
            </Field>
          )}

          {needsKmi && (
            <Field label={t('root.kmi_label')} style={{ marginTop: "16px" }}>
              <div className={styles.inputGroup}>
                <Input
                  value={kmi}
                  onChange={(_, data) => setKmi(data.value)}
                  placeholder={t('root.kmi_placeholder')}
                  style={{ flex: 1 }}
                />
                <Button icon={<DeviceEq24Regular />} onClick={handleDetectKmi} disabled={!serial}>
                  {t('root.detect_kmi')}
                </Button>
              </div>
            </Field>
          )}

          {needsSuperKey && (
            <Field label={t('root.superkey_label')} style={{ marginTop: "16px" }}>
              <Input
                type="password"
                value={superKey}
                onChange={(_, data) => setSuperKey(data.value)}
                placeholder={t('root.superkey_placeholder')}
                style={{ width: "100%" }}
              />
            </Field>
          )}

          {usesNativePcTool && (
            <div style={{ marginTop: "16px" }}>
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                {t('root.pc_tool_hint', { tool: toolForEngine() })}
              </Text>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <Button size="small" onClick={handleInstallTool} disabled={isInstallingTool}>
                  {isInstallingTool ? t('root.installing_tool') : t('root.install_tool')}
                </Button>
                {toolInstallMsg && <Text size={200}>{toolInstallMsg}</Text>}
              </div>
            </div>
          )}

          {(isPatching || progress > 0) && (
            <div className={styles.progressContainer}>
              <Text size={200}>{statusText} ({progress}%)</Text>
              <ProgressBar value={progress / 100} />
            </div>
          )}
        </div>

        <CardFooter style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "stretch" }}>
          <Button
            appearance="primary"
            disabled={!imagePath || (needsPatcherApk && !patcherPath) || isPatching}
            icon={isOffline ? <Laptop24Regular /> : <DeviceEq24Regular />}
            onClick={handleStartPatch}
          >
            {t('root.start_patch_offline')}
          </Button>

          {patchedPath && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div className={styles.dangerBox}>
                <Text size={200}>{t('root.flash_warning')}</Text>
              </div>
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                {t('root.patched_output', { path: patchedPath })}
              </Text>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Switch
                  checked={disableAvb}
                  onChange={(_, d) => setDisableAvb(d.checked)}
                  label={t('root.disable_avb')}
                />
              </div>
              <Button
                appearance="primary"
                disabled={!serial || isFlashing}
                icon={<ShieldKeyhole24Regular />}
                onClick={handleFlash}
              >
                {isFlashing ? t('root.flash_running') : t('root.flash_patched')}
              </Button>
              {flashMsg && <Text size={200}>{flashMsg}</Text>}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default PatchImagePanel;
