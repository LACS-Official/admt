import React  from 'react';
import { useTranslation } from "react-i18next";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
} from "@fluentui/react-components";
import {
  LockOpen24Regular,
  Settings24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import XiaomiUnlockCard from "../Tools/XiaomiUnlockCard";

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
  content: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    overflow: "auto",
  },
  warningCard: {
    gridColumn: "1 / -1",
    backgroundColor: "var(--colorPaletteRedBackground1)",
  },
  warningContent: {
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  warningText: {
    flex: 1,
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
});

const UnlockZonePanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { selectedDevice, devices } = useDeviceStore();

  const connectedDevices = devices.filter(d => d.connected);

  return (
    <div className={styles.container}>

      {connectedDevices.length === 0 ? (
        <div className={styles.noDevice}>
          <LockOpen24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
          <Text size={400}>{t('unlock.no_device_title')}</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            {t('unlock.no_device_hint')}
          </Text>
        </div>
      ) : !selectedDevice ? (
        <div className={styles.noDevice}>
          <Settings24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
          <Text size={400}>{t('unlock.select_device_title')}</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            {t('unlock.select_device_hint')}
          </Text>
        </div>
      ) : (
        <div className={styles.content}>
          <Card className={styles.warningCard}>
            <CardHeader>
              <div className={styles.warningContent}>
                <Warning24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
                <div className={styles.warningText}>
                  <Text weight="semibold" style={{ color: "var(--colorPaletteRedForeground1)" }}>
                    {t('unlock.warning_title')}
                  </Text>
                  <Text size={300} style={{ color: "var(--colorPaletteRedForeground2)" }}>
                    {t('unlock.warning_desc')}
                  </Text>
                </div>
              </div>
            </CardHeader>
          </Card>
          
          <XiaomiUnlockCard device={selectedDevice} />
        </div>
      )}
    </div>
  );
};

export default UnlockZonePanel;
