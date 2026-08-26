import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    padding: "16px 20px",
    gap: "16px",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "12px",
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
  headerTabList: {
    flexShrink: 0,
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "9999px",
    padding: "4px",
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    minHeight: "36px",
    border: "1px solid var(--colorNeutralStroke2)",
    "& .fui-Tab": {
      fontSize: "13px",
      padding: "6px 14px",
      minHeight: "30px",
      borderRadius: "9999px",
      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      border: "none",
      fontWeight: 500,
      color: "var(--colorNeutralForeground2)",
      margin: "0 2px",

      "&:hover": {
        backgroundColor: "var(--colorNeutralBackground1Hover)",
        color: "var(--colorNeutralForeground1)",
      },

      "&[aria-selected='true']": {
        backgroundColor: "var(--colorNeutralBackground1)",
        color: "var(--colorBrandForeground1)",
        boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
        fontWeight: 600,
      },
    },

    "@media (max-width: 768px)": {
      "& .fui-Tab": {
        fontSize: "12px",
        padding: "4px 10px",
      },
    },
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
  const { t } = useTranslation();
  const { selectedDevice, devices } = useDeviceStore();
  const [currentView, setCurrentView] = useState<ExtendedFeaturesView>("tools");

  const connectedDevices = devices.filter(d => d.connected);

  const tabs = [
    {
      id: "tools" as ExtendedFeaturesView,
      label: t('extended_features.tabs.tools'),
      icon: <Wrench24Regular />,
    },
    {
      id: "plugins" as ExtendedFeaturesView,
      label: t('extended_features.tabs.plugins'),
      icon: <Apps24Regular />,
    },
    {
      id: "utilities" as ExtendedFeaturesView,
      label: t('extended_features.tabs.utilities'),
      icon: <Settings24Regular />,
    },
  ];

  const renderContent = () => {
    switch (currentView) {
      case "tools":
        return (
          <div className={styles.placeholder}>
            <Wrench24Regular className={styles.placeholderIcon} />
            <Text className={styles.placeholderTitle}>{t('extended_features.placeholders.tools_title')}</Text>
            <Text className={styles.placeholderDescription}>
              {t('extended_features.placeholders.tools_description')}
            </Text>
          </div>
        );
      case "plugins":
        return (
          <div className={styles.placeholder}>
            <Apps24Regular className={styles.placeholderIcon} />
            <Text className={styles.placeholderTitle}>{t('extended_features.placeholders.plugins_title')}</Text>
            <Text className={styles.placeholderDescription}>
              {t('extended_features.placeholders.plugins_description')}
            </Text>
          </div>
        );
      case "utilities":
        return (
          <div className={styles.placeholder}>
            <Settings24Regular className={styles.placeholderIcon} />
            <Text className={styles.placeholderTitle}>{t('extended_features.placeholders.utilities_title')}</Text>
            <Text className={styles.placeholderDescription}>
              {t('extended_features.placeholders.utilities_description')}
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
          <Text size={400}>{t('extended_features.placeholders.no_device_title')}</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            {t('extended_features.placeholders.no_device_description')}
          </Text>
        </div>
      ) : !selectedDevice ? (
        <div className={styles.noDevice}>
          <Settings24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
          <Text size={400}>{t('extended_features.placeholders.select_device_title')}</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            {t('extended_features.placeholders.select_device_description')}
          </Text>
        </div>
      ) : (
        <div className={styles.tabContainer}>
          <TabList
            id="tour-extended-tabs"
            selectedValue={currentView}
            onTabSelect={(_, data) => setCurrentView(data.value as ExtendedFeaturesView)}
            className={styles.headerTabList}
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
