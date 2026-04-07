
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
import { Folder24Regular, Laptop24Regular, DeviceEq24Regular } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { DeviceInfo } from "../../types/device";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    padding: "16px",
  },
  card: {
    width: "100%",
    maxWidth: "600px",
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
  }
});

interface PatchImagePanelProps {
  device: DeviceInfo | null;
}

type PatchType = "Magisk" | "KernelSU" | "APatch";

const PatchImagePanel: React.FC<PatchImagePanelProps> = ({ device }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [imagePath, setImagePath] = useState("");
  const [patcherPath, setPatcherPath] = useState("");
  const [patchType, setPatchType] = useState<PatchType>("Magisk");
  const [isOffline, setIsOffline] = useState(true);
  const [isPatching, setIsPatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [missingDependency, setMissingDependency] = useState<string | null>(null);

  useEffect(() => {
    const unlisten = listen<{ status: string; progress: number }>("patch-progress", (event) => {
      setStatusText(event.payload.status);
      setProgress(event.payload.progress);
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

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

  const handleStartPatch = async () => {
    if (isOffline) {
        setIsPatching(true);
        setProgress(0);
        setStatusText(t('root.patch_preparing'));
        try {
            setMissingDependency(null);
            const result = await invoke("patch_boot_image_local", {
                imagePath,
                patcherPath,
                patchType,
            }) as { success: boolean, output: string, error?: string };
            
            console.log("Patch Result:", result);
            
            if (result.success) {
                setStatusText(t('root.patch_success'));
                setProgress(100);
            } else {
                const errMsg = result.error || result.output || t('root.patch_local_error');
                setStatusText(t('root.patch_failed', { error: errMsg }));
                console.error("Patch logically failed:", result);
            }
        } catch (error: any) {
            console.error("Full Patch Exception:", error);
            
            // Extract error message from Tauri error object
            let errorMsg = "";
            if (typeof error === 'string') {
                errorMsg = error;
            } else if (typeof error === 'object' && error !== null) {
                // Tauri Rust error format: { Variant: "message" } or { Variant: { message: "..." } }
                const keys = Object.keys(error);
                if (keys.length > 0) {
                    const firstKey = keys[0];
                    const firstValue = error[firstKey];
                    if (typeof firstValue === 'string') {
                        errorMsg = firstValue;
                    } else if (typeof firstValue === 'object' && firstValue !== null && 'message' in firstValue) {
                        errorMsg = (firstValue as any).message;
                    } else {
                        errorMsg = JSON.stringify(error);
                    }
                } else {
                    errorMsg = JSON.stringify(error);
                }
            } else {
                errorMsg = String(error);
            }

            if (errorMsg.includes("DEPENDENCY_MISSING")) {
                const dep = errorMsg.split(":")[1];
                setMissingDependency(dep);
                setStatusText(t('root.missing_tool_title', { tool: dep }));
            } else {
                setStatusText(t('root.patch_failed', { error: errorMsg }));
            }
        } finally {
            setIsPatching(false);
        }
    } else {
        // TODO: Implement online patching logic
        alert(t('root.patch_online_not_implemented'));
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
                    <Button 
                        size="small" 
                        onClick={() => window.open("https://github.com/PinNaCode/magiskboot_build/releases", "_blank")}
                    >
                      {t('root.download_pinna_code')}
                    </Button>
                    <Button size="small" onClick={handleOpenToolDir}>
                      {t('root.open_release_dir')}
                    </Button>
                </div>
                <Text size={200} italic>
                  {t('root.patch_tool_hint')}
                </Text>
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
                <Option>Magisk</Option>
                <Option>KernelSU</Option>
                <Option>APatch</Option>
              </Dropdown>
            </Field>

            <Field label={t('root.patch_mode')}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "32px" }}>
                <Switch 
                  checked={isOffline} 
                  onChange={(_, data) => setIsOffline(data.checked)}
                  label={isOffline ? t('root.mode_offline') : t('root.mode_online')}
                />
              </div>
            </Field>
          </div>

          <Field label={t('root.image_path')} validationMessage={t('root.image_placeholder')}>
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

          {isOffline && (
            <Field label={patchType === "Magisk" ? t('root.patcher_path_magisk') : t('root.patcher_path_other', { type: patchType })} style={{ marginTop: "16px" }}>
              <div className={styles.inputGroup}>
                <Input 
                  value={patcherPath} 
                  onChange={(_, data) => setPatcherPath(data.value)} 
                  placeholder={patchType === "Magisk" ? t('root.patcher_placeholder_magisk') : t('root.patcher_placeholder_other', { type: patchType })}
                  style={{ flex: 1 }}
                />
                <Button icon={<Folder24Regular />} onClick={() => handleSelectFile(setPatcherPath, 'apk')}>
                  {t('flash.select_file_btn')}
                </Button>
              </div>
            </Field>
          )}

          {(isPatching || progress > 0) && (
            <div className={styles.progressContainer}>
              <Text size={200}>{statusText} ({progress}%)</Text>
              <ProgressBar value={progress / 100} />
            </div>
          )}
        </div>

        <CardFooter>
          <Button 
            appearance="primary" 
            disabled={!imagePath || (isOffline && !patcherPath) || isPatching}
            icon={isOffline ? <Laptop24Regular /> : <DeviceEq24Regular />}
            onClick={handleStartPatch}
          >
            {isOffline ? t('root.start_patch_offline') : t('root.start_patch_online')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PatchImagePanel;
