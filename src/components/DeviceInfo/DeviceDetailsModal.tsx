import React, { useState, useMemo } from "react";
import {
  makeStyles,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogBody,
  Button,
  Input,
  Text,
  Badge,
  Tooltip,
  Select,
  Field,
  Divider,
} from "@fluentui/react-components";
import {
  Dismiss24Regular,
  Copy24Regular,
  Search24Regular,
  Filter24Regular,
  Settings24Regular,
  CheckmarkCircle24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: "800px",
    width: "90vw",
    maxHeight: "80vh",
  },
  searchSection: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
    alignItems: "end",
  },
  searchInput: {
    flex: 1,
  },
  filterSelect: {
    minWidth: "150px",
  },
  content: {
    maxHeight: "500px",
    overflow: "auto",
    padding: "8px 0",
  },
  categorySection: {
    marginBottom: "24px",
  },
  categoryTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  propertyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "8px 16px",
    alignItems: "center",
  },
  propertyRow: {
    display: "contents",
  },
  propertyLabel: {
    fontSize: "13px",
    color: "var(--colorNeutralForeground2)",
    fontWeight: "500",
    padding: "8px 0",
  },
  propertyValue: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    padding: "8px 0",
    wordBreak: "break-all",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  copyButton: {
    minWidth: "auto",
    padding: "4px",
  },
  noResults: {
    textAlign: "center",
    padding: "40px 20px",
    color: "var(--colorNeutralForeground3)",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  copyAllButton: {
    flex: 1,
  },
});

interface DeviceDetailsModalProps {
  device: DeviceInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  device,
  open,
  onOpenChange,
}) => {
  const styles = useStyles();
  const { addNotification } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

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
      categories.push({ id: "basic", title: "设备信息", items: basicInfo });
    }

    // 系统版本信息
    const systemInfo = [];
    if (props.androidVersion) systemInfo.push({ property: "Android版本", value: `Android ${props.androidVersion}` });
    if (props.sdkVersion) systemInfo.push({ property: "SDK版本", value: `API ${props.sdkVersion}` });
    if (props.buildId) systemInfo.push({ property: "构建ID", value: props.buildId });
    if (props.buildDisplayId) systemInfo.push({ property: "构建显示ID", value: props.buildDisplayId });
    if (props.securityPatchLevel) systemInfo.push({ property: "安全补丁", value: props.securityPatchLevel });
    if (props.buildDate) systemInfo.push({ property: "构建日期", value: props.buildDate });
    if (props.buildUser) systemInfo.push({ property: "构建用户", value: props.buildUser });
    if (props.buildHost) systemInfo.push({ property: "构建主机", value: props.buildHost });
    if (props.buildFingerprint) systemInfo.push({ property: "构建指纹", value: props.buildFingerprint });
    if (systemInfo.length > 0) {
      categories.push({ id: "system", title: "系统信息", items: systemInfo });
    }

    // 硬件信息
    const hardwareInfo = [];
    if (props.cpuAbi) hardwareInfo.push({ property: "CPU架构", value: props.cpuAbi });
    if (props.cpuAbiList) hardwareInfo.push({ property: "支持架构", value: props.cpuAbiList });
    if (props.socManufacturer) hardwareInfo.push({ property: "SoC制造商", value: props.socManufacturer });
    if (props.socModel) hardwareInfo.push({ property: "SoC型号", value: props.socModel });
    if (props.hardware) hardwareInfo.push({ property: "硬件平台", value: props.hardware });
    if (props.hardwareChipname) hardwareInfo.push({ property: "芯片名称", value: props.hardwareChipname });
    if (props.boardPlatform) hardwareInfo.push({ property: "主板平台", value: props.boardPlatform });
    if (props.productBoard) hardwareInfo.push({ property: "产品主板", value: props.productBoard });
    if (props.lcdDensity) hardwareInfo.push({ property: "屏幕密度", value: `${props.lcdDensity} DPI` });
    if (hardwareInfo.length > 0) {
      categories.push({ id: "hardware", title: "硬件信息", items: hardwareInfo });
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
      categories.push({ id: "security", title: "安全信息", items: securityInfo });
    }

    // 系统配置
    const configInfo = [];
    if (props.locale) configInfo.push({ property: "语言区域", value: props.locale });
    if (props.timezone) configInfo.push({ property: "时区", value: props.timezone });
    if (props.defaultNetwork) configInfo.push({ property: "默认网络", value: props.defaultNetwork });
    if (props.vndkVersion) configInfo.push({ property: "VNDK版本", value: props.vndkVersion });
    if (props.firstApiLevel) configInfo.push({ property: "首次API级别", value: props.firstApiLevel });
    if (configInfo.length > 0) {
      categories.push({ id: "config", title: "系统配置", items: configInfo });
    }

    // 运行时信息
    const runtimeInfo = [];
    if (props.batteryLevel !== undefined) runtimeInfo.push({ property: "电池电量", value: `${props.batteryLevel}%` });
    if (props.screenResolution) runtimeInfo.push({ property: "屏幕分辨率", value: props.screenResolution });
    if (props.totalMemory) runtimeInfo.push({ property: "总内存", value: props.totalMemory });
    if (props.availableStorage) runtimeInfo.push({ property: "可用存储", value: props.availableStorage });
    if (runtimeInfo.length > 0) {
      categories.push({ id: "runtime", title: "运行时信息", items: runtimeInfo });
    }

    return categories;
  };

  const filteredCategories = useMemo(() => {
    const categories = getPropertyCategories();
    
    let filtered = categories;
    
    // 按分类筛选
    if (selectedCategory !== "all") {
      filtered = categories.filter(cat => cat.id === selectedCategory);
    }
    
    // 按搜索词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.map(category => ({
        ...category,
        items: category.items.filter(item => 
          item.property.toLowerCase().includes(query) ||
          item.value.toLowerCase().includes(query)
        )
      })).filter(category => category.items.length > 0);
    }
    
    return filtered;
  }, [searchQuery, selectedCategory, device.properties]);

  const copyProperty = async (property: string, value: string) => {
    try {
      await navigator.clipboard.writeText(`${property}: ${value}`);
      addNotification({
        type: "success",
        title: "复制成功",
        message: `已复制 ${property}`,
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "复制失败",
        message: "无法访问剪贴板",
      });
    }
  };

  const copyAllProperties = async () => {
    try {
      const allText = getPropertyCategories()
        .map(category => 
          `${category.title}:\n` +
          category.items.map(item => `  ${item.property}: ${item.value}`).join('\n')
        )
        .join('\n\n');
      
      await navigator.clipboard.writeText(allText);
      addNotification({
        type: "success",
        title: "复制成功",
        message: "已复制所有设备属性",
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "复制失败",
        message: "无法访问剪贴板",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody>
          <DialogTitle>
            <Settings24Regular />
            设备详细信息
          </DialogTitle>
          
          <DialogContent>
            <div className={styles.searchSection}>
              <Field label="搜索属性" className={styles.searchInput}>
                <Input
                  contentBefore={<Search24Regular />}
                  placeholder="搜索属性名称或值..."
                  value={searchQuery}
                  onChange={(_, data) => setSearchQuery(data.value)}
                />
              </Field>
              
              <Field label="分类筛选">
                <Select
                  className={styles.filterSelect}
                  value={selectedCategory}
                  onChange={(_, data) => setSelectedCategory(data.value)}
                >
                  <option value="all">全部分类</option>
                  <option value="basic">设备信息</option>
                  <option value="system">系统信息</option>
                  <option value="hardware">硬件信息</option>
                  <option value="security">安全信息</option>
                  <option value="config">系统配置</option>
                  <option value="runtime">运行时信息</option>
                </Select>
              </Field>
            </div>

            <div className={styles.content}>
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category, index) => (
                  <div key={category.id} className={styles.categorySection}>
                    <Text className={styles.categoryTitle}>
                      {category.title}
                      <Badge appearance="outline">{category.items.length}</Badge>
                    </Text>
                    <div className={styles.propertyGrid}>
                      {category.items.map((item, itemIndex) => (
                        <div key={itemIndex} className={styles.propertyRow}>
                          <Text className={styles.propertyLabel}>{item.property}</Text>
                          <div className={styles.propertyValue}>
                            <Text>{item.value}</Text>
                            <Tooltip content="复制此属性" relationship="label">
                              <Button
                                appearance="subtle"
                                icon={<Copy24Regular />}
                                size="small"
                                className={styles.copyButton}
                                onClick={() => copyProperty(item.property, item.value)}
                              />
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                    {index < filteredCategories.length - 1 && <Divider />}
                  </div>
                ))
              ) : (
                <div className={styles.noResults}>
                  <Search24Regular style={{ fontSize: "32px", marginBottom: "8px" }} />
                  <Text size={300}>未找到匹配的属性</Text>
                  <Text size={200}>请尝试其他搜索词或选择不同的分类</Text>
                </div>
              )}
            </div>
          </DialogContent>
          
          <DialogActions>
            <div className={styles.actions}>
              <Button
                appearance="secondary"
                icon={<Copy24Regular />}
                onClick={copyAllProperties}
                className={styles.copyAllButton}
              >
                复制全部
              </Button>
              <Button
                appearance="primary"
                onClick={() => onOpenChange(false)}
              >
                关闭
              </Button>
            </div>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default DeviceDetailsModal;
