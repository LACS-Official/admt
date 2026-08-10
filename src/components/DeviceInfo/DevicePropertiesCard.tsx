import React, { useState } from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Tooltip,
  Button,
  mergeClasses,
  shorthands,
} from "@fluentui/react-components";
import {
  Settings24Regular,
  Copy16Regular,
  Checkmark16Regular,
  Info16Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { DeviceInfo } from "../../types/device";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke1)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  },
  cardHeader: {
    ...shorthands.padding("12px", "16px"),
    ...shorthands.borderBottom("1px", "solid", "var(--colorNeutralStroke2)"),
  },
  content: {
    flex: 1,
    ...shorthands.padding("16px"),
    ...shorthands.overflow("auto"),
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  categorySection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  categoryTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  },
  categoryTitleText: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground3)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  categoryDivider: {
    height: "1px",
    flex: 1,
    backgroundColor: "var(--colorNeutralStroke3)",
  },
  propertyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)", // Tile grid
    gap: "10px",
    "@media (max-width: 600px)": {
      gridTemplateColumns: "1fr",
    },
  },
  propertyTile: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    ...shorthands.padding("10px", "12px"),
    backgroundColor: "var(--colorNeutralBackground2)",
    ...shorthands.borderRadius("8px"),
    transition: "all 0.2s ease",
    position: "relative",
    ...shorthands.border("1px", "solid", "transparent"),
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)",
      ...shorthands.borderColor("var(--colorNeutralStroke3)"),
    },
    "&:hover .copy-button": {
      opacity: 1,
    },
  },
  propertyLabel: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
    fontWeight: "500",
  },
  valueWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  propertyValue: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    wordBreak: "break-all",
    lineHeight: "1.4",
  },
  copyButton: {
    opacity: 0,
    transition: "opacity 0.2s ease",
    minWidth: "24px",
    height: "24px",
    padding: "0",
    "&.fui-Button": {
      backgroundColor: "transparent",
      border: "none",
    },
  },
  noData: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
    gap: "8px",
    color: "var(--colorNeutralForeground3)",
  },
});

interface CopyButtonProps {
  value: string;
  label: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ value, label }) => {
  const styles = useStyles();
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Tooltip content={(copied ? t("common.success") : t("common.copy_value", "复制内容")) as string} relationship="label">
      <Button
        size="small"
        className={mergeClasses(styles.copyButton, "copy-button")}
        icon={copied ? <Checkmark16Regular style={{ color: "var(--colorPaletteGreenForeground1)" }} /> : <Copy16Regular />}
        onClick={handleCopy}
        appearance="subtle"
      />
    </Tooltip>
  );
};

interface DevicePropertiesCardProps {
  device: DeviceInfo;
}

const DevicePropertiesCard: React.FC<DevicePropertiesCardProps> = ({ device }) => {
  const styles = useStyles();
  const { t } = useTranslation();

  const getPropertyCategories = () => {
    if (!device.properties) return [];

    const props = device.properties;
    const categories = [];

    // 设备基本信息
    const basicInfo = [];
    if (props.marketName) basicInfo.push({ property: t('device_properties.market_name'), value: props.marketName });
    if (props.brand) basicInfo.push({ property: t('device_overview.brand'), value: props.brand });
    if (props.model) basicInfo.push({ property: t('device_overview.model'), value: props.model });
    if (props.manufacturer) basicInfo.push({ property: t('device_properties.manufacturer'), value: props.manufacturer });
    if (props.deviceName) basicInfo.push({ property: t('device_overview.device_code'), value: props.deviceName });
    if (props.serialNumber) basicInfo.push({ property: t('device_overview.serial_number'), value: props.serialNumber });
    if (basicInfo.length > 0) {
      categories.push({ title: t('device_properties.category_device'), items: basicInfo });
    }

    // 系统版本信息
    const systemInfo = [];
    if (props.androidVersion) systemInfo.push({ property: t('device_overview.android_version'), value: `Android ${props.androidVersion}` });
    if (props.sdkVersion) systemInfo.push({ property: t('device_overview.sdk_version'), value: `API ${props.sdkVersion}` });
    if (props.buildId) systemInfo.push({ property: t('device_overview.build_id'), value: props.buildId });
    if (props.buildDisplayId) systemInfo.push({ property: t('device_overview.build_display_id'), value: props.buildDisplayId });
    if (props.securityPatchLevel) systemInfo.push({ property: t('device_properties.security_patch'), value: props.securityPatchLevel });
    if (props.buildDate) systemInfo.push({ property: t('device_overview.build_date'), value: props.buildDate });
    if (props.firstApiLevel) systemInfo.push({ property: t('device_overview.first_api'), value: props.firstApiLevel });
    if (systemInfo.length > 0) {
      categories.push({ title: t('device_properties.category_system'), items: systemInfo });
    }

    // 硬件信息
    const hardwareInfo = [];
    if (props.cpuAbi) hardwareInfo.push({ property: t('device_overview.cpu_arch'), value: props.cpuAbi });
    if (props.cpuAbiList) hardwareInfo.push({ property: t('device_properties.supported_arch'), value: props.cpuAbiList });
    if (props.socManufacturer) hardwareInfo.push({ property: t('device_overview.soc_manufacturer'), value: props.socManufacturer });
    if (props.socModel) hardwareInfo.push({ property: t('device_overview.soc_model'), value: props.socModel });
    if (props.hardware) hardwareInfo.push({ property: t('device_properties.hardware_platform'), value: props.hardware });
    if (props.boardPlatform) hardwareInfo.push({ property: t('device_overview.board_platform'), value: props.boardPlatform });
    if (props.lcdDensity) hardwareInfo.push({ property: t('device_overview.lcd_density'), value: `${props.lcdDensity} DPI` });
    if (hardwareInfo.length > 0) {
      categories.push({ title: t('device_properties.category_hardware'), items: hardwareInfo });
    }

    // 安全信息
    const securityInfo = [];
    if (props.bootloaderLocked !== undefined) {
      securityInfo.push({
        property: t('device_info.bootloader'),
        value: props.bootloaderLocked ? t('device_info.locked') : t('device_info.unlocked'),
        icon: props.bootloaderLocked ? "🔒" : "🔓"
      });
    }
    if (props.verifiedBootState) securityInfo.push({ property: t('device_overview.verified_boot'), value: props.verifiedBootState });
    if (props.verityMode) securityInfo.push({ property: t('device_overview.integrity_verity'), value: props.verityMode });
    if (props.debuggable !== undefined) {
      securityInfo.push({
        property: t('device_overview.debug_mode'),
        value: props.debuggable ? t('device_overview.enabled') : t('device_overview.disabled'),
        icon: props.debuggable ? "✅" : "❌"
      });
    }
    if (props.secure !== undefined) {
      securityInfo.push({
        property: t('device_overview.secure_mode'),
        value: props.secure ? t('device_overview.enabled') : t('device_overview.disabled'),
        icon: props.secure ? "✅" : "❌"
      });
    }
    if (props.adbSecure !== undefined) {
      securityInfo.push({
        property: t('device_overview.adb_secure'),
        value: props.adbSecure ? t('device_overview.enabled') : t('device_overview.disabled'),
        icon: props.adbSecure ? "✅" : "❌"
      });
    }
    if (securityInfo.length > 0) {
      categories.push({ title: t('device_properties.category_security'), items: securityInfo });
    }

    // 系统配置
    const configInfo = [];
    if (props.locale) configInfo.push({ property: t('device_overview.locale'), value: props.locale });
    if (props.timezone) configInfo.push({ property: t('device_overview.timezone'), value: props.timezone });
    if (props.defaultNetwork) configInfo.push({ property: t('device_overview.default_network'), value: props.defaultNetwork });
    if (props.vndkVersion) configInfo.push({ property: t('device_overview.vndk_version'), value: props.vndkVersion });
    if (configInfo.length > 0) {
      categories.push({ title: t('device_properties.category_config'), items: configInfo });
    }

    return categories;
  };

  const propertyCategories = getPropertyCategories();

  return (
    <Card className={styles.card}>
      <CardHeader
        className={styles.cardHeader}
        image={<Settings24Regular />}
        header={<Text weight="semibold" size={400}>{t('device_properties.card_title')}</Text>}
        description={
          <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
            {propertyCategories.length > 0
              ? t('device_properties.properties_summary', { 
                  count: propertyCategories.reduce((total, cat) => total + cat.items.length, 0),
                  categories: propertyCategories.length 
                })
              : t('device_properties.no_properties')
            }
          </Text>
        }
      />

      <div className={styles.content}>
        {propertyCategories.length > 0 ? (
          propertyCategories.map((category, index) => (
            <div key={index} className={styles.categorySection}>
              <div className={styles.categoryTitle}>
                <Text className={styles.categoryTitleText}>{category.title}</Text>
                <div className={styles.categoryDivider} />
              </div>
              <div className={styles.propertyGrid}>
                {category.items.map((item: any, itemIndex) => (
                  <div key={itemIndex} className={styles.propertyTile}>
                    <Text className={styles.propertyLabel}>{item.property}</Text>
                    <div className={styles.valueWrapper}>
                      <Text className={styles.propertyValue}>
                        {item.icon && <span style={{ marginRight: '4px' }}>{item.icon}</span>}
                        {item.value}
                      </Text>
                      <CopyButton value={item.value} label={item.property} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noData}>
            <Settings24Regular style={{ fontSize: "32px" }} />
            <Text size={300}>{t('device_properties.no_data')}</Text>
            <Text size={200}>{t('device_properties.ensure_connected')}</Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DevicePropertiesCard;
