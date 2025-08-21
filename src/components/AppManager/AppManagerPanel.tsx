import React, { useState } from 'react';
import {
  makeStyles,
  Text,
  Tab,
  TabList,
  Badge,
} from "@fluentui/react-components";
import {
  Apps24Regular,
  DocumentAdd24Regular,
  Info24Regular,
  History24Regular,
  StoreMicrosoft24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import ApkInstallCard from "../FileManager/ApkInstallCard";
import AppListCard from "./AppListCard";
import ApkInfoCard from "./ApkInfoCard";
import InstallHistoryCard from "./InstallHistoryCard";
import DeviceConnectionStatus from "./DeviceConnectionStatus";
import ErrorDialog from "../Common/ErrorDialog";
import { InstalledApp } from "../../types/device";
import { ErrorInfo } from "../../utils/errorHandler";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "12px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 4px",
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
  tabContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  gridLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "12px",
    height: "100%",
  },
  threeColumnLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "12px",
    height: "100%",
  },
  fullLayout: {
    height: "100%",
  },
});

const AppManagerPanel: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const [selectedTab, setSelectedTab] = useState<string>("market");
  const [errorInfo] = useState<ErrorInfo | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  const handleAppUninstall = (_app: InstalledApp) => {
    // 可以在这里添加额外的处理逻辑
    // console.log("App uninstalled:", app);
  };

  const handleShowAppInfo = (_app: InstalledApp) => {
    // 可以在这里显示应用详细信息对话框
    // console.log("Show app info:", app);
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case "install":
        return (
          <div className={styles.threeColumnLayout}>
            <ApkInstallCard />
            <ApkInfoCard />
            <DeviceConnectionStatus />
          </div>
        );
      case "manage":
        return (
          <div className={styles.fullLayout}>
            <AppListCard
              onUninstall={handleAppUninstall}
              onShowInfo={handleShowAppInfo}
            />
          </div>
        );
      case "info":
        return (
          <div className={styles.fullLayout}>
            <ApkInfoCard />
          </div>
        );
      case "history":
        return (
          <div className={styles.fullLayout}>
            <InstallHistoryCard />
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
          <Apps24Regular />
          <Text size={500} weight="semibold">APK管理</Text>
        </div>
        
        <div className={styles.headerRight}>
          {selectedDevice && (
            <Badge appearance="filled" color="success">
              {selectedDevice.serial}
            </Badge>
          )}
        </div>
      </div>

      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_, data) => setSelectedTab(data.value as string)}
      >
        <Tab id="market" value="market" icon={<StoreMicrosoft24Regular />}>
          APK市场
        </Tab>
        <Tab id="install" value="install" icon={<DocumentAdd24Regular />}>
          APK安装
        </Tab>
        <Tab id="manage" value="manage" icon={<Apps24Regular />}>
          应用管理
        </Tab>
        <Tab id="info" value="info" icon={<Info24Regular />}>
          APK信息
        </Tab>
        <Tab id="history" value="history" icon={<History24Regular />}>
          安装历史
        </Tab>
      </TabList>

      <div className={styles.tabContent}>
        {renderTabContent()}
      </div>

      <ErrorDialog
        open={errorDialogOpen}
        errorInfo={errorInfo}
        onClose={() => setErrorDialogOpen(false)}
        onRetry={() => {
          // 实现重试逻辑
          setErrorDialogOpen(false);
        }}
        showDetails={true}
      />
    </div>
  );
};

export default AppManagerPanel;
