import React from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
} from "@fluentui/react-components";
import {
  Settings24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { DeviceInfo } from "../../types/device";

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  content: {
    flex: 1,
    padding: "12px",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  categorySection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  categoryTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    paddingBottom: "4px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  propertyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "6px",
  },
  propertyRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 6px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "3px",
    minHeight: "28px",
  },
  propertyLabel: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
    fontWeight: "500",
    minWidth: "80px",
  },
  propertyValue: {
    fontSize: "12px",
    fontWeight: "600",
    textAlign: "right",
    wordBreak: "break-all",
    flex: 1,
    marginLeft: "8px",
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
        value: props.bootloaderLocked ? `🔒 ${t('device_info.locked')}` : `🔓 ${t('device_info.unlocked')}`
      });
    }
    if (props.verifiedBootState) securityInfo.push({ property: t('device_overview.verified_boot'), value: props.verifiedBootState });
    if (props.verityMode) securityInfo.push({ property: t('device_overview.integrity_verity'), value: props.verityMode });
    if (props.debuggable !== undefined) {
      securityInfo.push({
        property: t('device_overview.debug_mode'),
        value: props.debuggable ? `✅ ${t('device_overview.enabled')}` : `❌ ${t('device_overview.disabled')}`
      });
    }
    if (props.secure !== undefined) {
      securityInfo.push({
        property: t('device_overview.secure_mode'),
        value: props.secure ? `✅ ${t('device_overview.enabled')}` : `❌ ${t('device_overview.disabled')}`
      });
    }
    if (props.adbSecure !== undefined) {
      securityInfo.push({
        property: t('device_overview.adb_secure'),
        value: props.adbSecure ? `✅ ${t('device_overview.enabled')}` : `❌ ${t('device_overview.disabled')}`
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
        image={<Settings24Regular />}
        header={<Text weight="semibold">{t('device_properties.card_title')}</Text>}
        description={
          <Text size={200}>
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
              <Text className={styles.categoryTitle}>{category.title}</Text>
              <div className={styles.propertyGrid}>
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className={styles.propertyRow}>
                    <Text className={styles.propertyLabel}>{item.property}</Text>
                    <Text className={styles.propertyValue}>{item.value}</Text>
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
