import React, { useState }  from 'react';
import {
  makeStyles,
  Text,
  Badge,
  TabList,
  Tab,

} from "@fluentui/react-components";
import {
  Wrench24Regular,
  Settings24Regular,
  Apps24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "24px",
    gap: "24px",
    backgroundColor: "var(--colorNeutralBackground2)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "16px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  tabContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    flex: 1,
    overflow: "hidden",
  },
  tabContent: {
    flex: 1,
    overflow: "hidden",
  },
  noDevice: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    textAlign: "center",
    color: "var(--colorNeutralForeground2)",
  },
  placeholder: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    textAlign: "center",
    color: "var(--colorNeutralForeground2)",
  },
  placeholderIcon: {
    fontSize: "48px",
    color: "var(--colorNeutralForeground3)",
  },
  placeholderTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
  },
  placeholderDescription: {
    fontSize: "14px",
    color: "var(--colorNeutralForeground2)",
    maxWidth: "400px",
    lineHeight: "1.5",
  },
});

type ExtendedFeaturesView = "tools" | "plugins" | "utilities";

const ExtendedFeaturesPanel: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice, devices } = useDeviceStore();
  const [currentView, setCurrentView] = useState<ExtendedFeaturesView>("tools");

  const connectedDevices = devices.filter(d => d.connected);

  const tabs = [
    {
      id: "tools" as ExtendedFeaturesView,
      label: "扩展工具",
      icon: <Wrench24Regular />,
    },
    {
      id: "plugins" as ExtendedFeaturesView,
      label: "插件管理",
      icon: <Apps24Regular />,
    },
    {
      id: "utilities" as ExtendedFeaturesView,
      label: "实用工具",
      icon: <Settings24Regular />,
    },
  ];

  const renderContent = () => {
    switch (currentView) {
      case "tools":
        return (
          <div className={styles.placeholder}>
            <Wrench24Regular className={styles.placeholderIcon} />
            <Text className={styles.placeholderTitle}>扩展工具</Text>
            <Text className={styles.placeholderDescription}>
              此功能正在开发中，将提供更多专业的Android设备管理工具，
              包括高级调试工具、性能分析工具等。
            </Text>
          </div>
        );
      case "plugins":
        return (
          <div className={styles.placeholder}>
            <Apps24Regular className={styles.placeholderIcon} />
            <Text className={styles.placeholderTitle}>插件管理</Text>
            <Text className={styles.placeholderDescription}>
              此功能正在开发中，将支持第三方插件扩展，
              让您可以根据需要添加更多功能模块。
            </Text>
          </div>
        );
      case "utilities":
        return (
          <div className={styles.placeholder}>
            <Settings24Regular className={styles.placeholderIcon} />
            <Text className={styles.placeholderTitle}>实用工具</Text>
            <Text className={styles.placeholderDescription}>
              此功能正在开发中，将提供各种实用的辅助工具，
              如批处理脚本、自动化任务等。
            </Text>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Wrench24Regular />
          <Text size={500} weight="semibold">扩展功能</Text>
          {selectedDevice && (
            <Badge appearance="filled" color="success">
              {selectedDevice.serial}
            </Badge>
          )}
        </div>
        
        <div className={styles.headerRight}>
          <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
            {connectedDevices.length} 台设备已连接
          </Text>
        </div>
      </div>

      {connectedDevices.length === 0 ? (
        <div className={styles.noDevice}>
          <Wrench24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
          <Text size={400}>未检测到设备</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            请确保设备已连接并启用USB调试
          </Text>
        </div>
      ) : !selectedDevice ? (
        <div className={styles.noDevice}>
          <Settings24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
          <Text size={400}>请选择一个设备</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            从设备信息页面选择要操作的设备
          </Text>
        </div>
      ) : (
        <div className={styles.tabContainer}>
          <TabList
            selectedValue={currentView}
            onTabSelect={(_, data) => setCurrentView(data.value as ExtendedFeaturesView)}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                value={tab.id}
                icon={tab.icon}
              >
                {tab.label}
              </Tab>
            ))}
          </TabList>

          <div className={styles.tabContent}>
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtendedFeaturesPanel;
