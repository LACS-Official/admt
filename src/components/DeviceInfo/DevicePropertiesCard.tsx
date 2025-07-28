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

  const getPropertyCategories = () => {
    if (!device.properties) return [];

    const props = device.properties;
    const categories = [];

    // 设备基本信息
    const basicInfo = [];
    if (props.marketName) basicInfo.push({ property: "商品名称", value: props.marketName });
    if (props.brand) basicInfo.push({ property: "品牌", value: props.brand });
    if (props.model) basicInfo.push({ property: "型号", value: props.model });
    if (props.manufacturer) basicInfo.push({ property: "制造商", value: props.manufacturer });
    if (props.deviceName) basicInfo.push({ property: "设备代号", value: props.deviceName });
    if (props.serialNumber) basicInfo.push({ property: "序列号", value: props.serialNumber });
    if (basicInfo.length > 0) {
      categories.push({ title: "设备信息", items: basicInfo });
    }

    // 系统版本信息
    const systemInfo = [];
    if (props.androidVersion) systemInfo.push({ property: "Android版本", value: `Android ${props.androidVersion}` });
    if (props.sdkVersion) systemInfo.push({ property: "SDK版本", value: `API ${props.sdkVersion}` });
    if (props.buildId) systemInfo.push({ property: "构建ID", value: props.buildId });
    if (props.buildDisplayId) systemInfo.push({ property: "构建显示ID", value: props.buildDisplayId });
    if (props.securityPatchLevel) systemInfo.push({ property: "安全补丁", value: props.securityPatchLevel });
    if (props.buildDate) systemInfo.push({ property: "构建日期", value: props.buildDate });
    if (props.firstApiLevel) systemInfo.push({ property: "首次API级别", value: props.firstApiLevel });
    if (systemInfo.length > 0) {
      categories.push({ title: "系统版本", items: systemInfo });
    }

    // 硬件信息
    const hardwareInfo = [];
    if (props.cpuAbi) hardwareInfo.push({ property: "CPU架构", value: props.cpuAbi });
    if (props.cpuAbiList) hardwareInfo.push({ property: "支持架构", value: props.cpuAbiList });
    if (props.socManufacturer) hardwareInfo.push({ property: "SoC制造商", value: props.socManufacturer });
    if (props.socModel) hardwareInfo.push({ property: "SoC型号", value: props.socModel });
    if (props.hardware) hardwareInfo.push({ property: "硬件平台", value: props.hardware });
    if (props.boardPlatform) hardwareInfo.push({ property: "主板平台", value: props.boardPlatform });
    if (props.lcdDensity) hardwareInfo.push({ property: "屏幕密度", value: `${props.lcdDensity} DPI` });
    if (hardwareInfo.length > 0) {
      categories.push({ title: "硬件信息", items: hardwareInfo });
    }

    // 安全信息
    const securityInfo = [];
    if (props.bootloaderLocked !== undefined) {
      securityInfo.push({
        property: "Bootloader",
        value: props.bootloaderLocked ? "🔒 已锁定" : "🔓 已解锁"
      });
    }
    if (props.verifiedBootState) securityInfo.push({ property: "验证启动", value: props.verifiedBootState });
    if (props.verityMode) securityInfo.push({ property: "完整性验证", value: props.verityMode });
    if (props.debuggable !== undefined) {
      securityInfo.push({
        property: "调试模式",
        value: props.debuggable ? "✅ 已启用" : "❌ 已禁用"
      });
    }
    if (props.secure !== undefined) {
      securityInfo.push({
        property: "安全模式",
        value: props.secure ? "✅ 已启用" : "❌ 已禁用"
      });
    }
    if (props.adbSecure !== undefined) {
      securityInfo.push({
        property: "ADB安全",
        value: props.adbSecure ? "✅ 已启用" : "❌ 已禁用"
      });
    }
    if (securityInfo.length > 0) {
      categories.push({ title: "安全信息", items: securityInfo });
    }

    // 系统配置
    const configInfo = [];
    if (props.locale) configInfo.push({ property: "语言区域", value: props.locale });
    if (props.timezone) configInfo.push({ property: "时区", value: props.timezone });
    if (props.defaultNetwork) configInfo.push({ property: "默认网络", value: props.defaultNetwork });
    if (props.vndkVersion) configInfo.push({ property: "VNDK版本", value: props.vndkVersion });
    if (configInfo.length > 0) {
      categories.push({ title: "系统配置", items: configInfo });
    }

    return categories;
  };

  const propertyCategories = getPropertyCategories();

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Settings24Regular />}
        header={<Text weight="semibold">设备属性</Text>}
        description={
          <Text size={200}>
            {propertyCategories.length > 0
              ? `${propertyCategories.reduce((total, cat) => total + cat.items.length, 0)} 个属性，${propertyCategories.length} 个分类`
              : "无属性数据"
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
            <Text size={300}>暂无设备属性数据</Text>
            <Text size={200}>请确保设备已连接并授权</Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DevicePropertiesCard;
