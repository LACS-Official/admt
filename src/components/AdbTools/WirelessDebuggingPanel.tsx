import React, { useState, useCallback } from 'react';
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Button,
  Field,
  Input,
  Spinner,
  Badge,
} from "@fluentui/react-components";
import {
  Wifi124Regular,
  UsbPlug24Regular,
  Link24Regular,
  Key24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";
import { DeviceInfo } from "../../types/device";
import { useTranslation } from "react-i18next";
import { wirelessService } from "../../services/wirelessService";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "12px",
    overflowY: "auto",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "12px",
  },
  card: {
    width: "100%",
    borderRadius: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  content: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
  },
  actionSection: {
    marginTop: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  infoText: {
    color: "var(--colorNeutralForeground2)",
    fontSize: "12px",
  },
});

interface WirelessDebuggingPanelProps {
  device: DeviceInfo | null;
  onAdbRequired: () => void;
}

const WirelessDebuggingPanel: React.FC<WirelessDebuggingPanelProps> = ({ device, onAdbRequired }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { setStatusBarMessage } = useAppStore();
  
  // USB to Wireless State
  const [isSwitching, setIsSwitching] = useState(false);
  const [detectedIp, setDetectedIp] = useState("");
  
  // Standalone Connection State
  const [targetIp, setTargetIp] = useState("");
  const [targetPort, setTargetPort] = useState("5555");
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Pairing State
  const [pairIp, setPairIp] = useState("");
  const [pairPort, setPairPort] = useState("");
  const [pairCode, setPairCode] = useState("");
  const [isPairing, setIsPairing] = useState(false);

  const handleSwitchToTcpIp = async () => {
    if (!device) {
      setStatusBarMessage({ type: "warning", message: t('error.no_device') });
      return;
    }
    
    if (!device.connected) {
      onAdbRequired();
      return;
    }

    try {
      setIsSwitching(true);
      setStatusBarMessage({ type: "info", message: t('wireless.msg_switching') });
      
      const result = await wirelessService.switchToTcpIp(device.serial);
      if (result.success) {
        setStatusBarMessage({ type: "success", message: t('wireless.msg_switch_success') });
        
        // Try to detect IP automatically
        const ip = await wirelessService.getDeviceIp(device.serial);
        if (ip) {
          setDetectedIp(ip);
          setStatusBarMessage({ type: "success", message: t('wireless.msg_detect_ip_success', { ip }) });
        } else {
          setStatusBarMessage({ type: "warning", message: t('wireless.msg_detect_ip_failed') });
        }
      } else {
        setStatusBarMessage({ type: "error", message: result.error || t('common.fail') });
      }
    } catch (error) {
      setStatusBarMessage({ type: "error", message: String(error) });
    } finally {
      setIsSwitching(false);
    }
  };

  const handleConnect = async () => {
    if (!targetIp) {
      setStatusBarMessage({ type: "warning", message: t('wireless.msg_detect_ip_failed') });
      return;
    }

    try {
      setIsConnecting(true);
      const port = parseInt(targetPort) || 5555;
      setStatusBarMessage({ type: "info", message: t('wireless.msg_connecting', { ip: targetIp, port }) });
      
      const result = await wirelessService.connectWireless(targetIp, port);
      if (result.success && !result.output.includes("failed")) {
        setStatusBarMessage({ type: "success", message: t('wireless.msg_connect_success', { ip: targetIp, port }) });
      } else {
        setStatusBarMessage({ type: "error", message: result.output || result.error || t('wireless.msg_connect_failed', { error: "" }) });
      }
    } catch (error) {
      setStatusBarMessage({ type: "error", message: String(error) });
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePair = async () => {
    if (!pairIp || !pairPort || !pairCode) {
      setStatusBarMessage({ type: "warning", message: t('common.invalid_input', "请输入完整信息") });
      return;
    }

    try {
      setIsPairing(true);
      const port = parseInt(pairPort);
      setStatusBarMessage({ type: "info", message: t('wireless.msg_pairing', { ip: pairIp, port }) });
      
      const result = await wirelessService.pairWireless(pairIp, port, pairCode);
      if (result.success && !result.output.includes("failed")) {
        setStatusBarMessage({ type: "success", message: t('wireless.msg_pair_success') });
        // After pairing, typically you need to connect.
        // Usually the connection port is different from pairing port in Android 11+ UI.
        // But some devices use the same. Let's just notify success.
      } else {
        setStatusBarMessage({ type: "error", message: result.output || result.error || t('wireless.msg_pair_failed', { error: "" }) });
      }
    } catch (error) {
      setStatusBarMessage({ type: "error", message: String(error) });
    } finally {
      setIsPairing(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        {/* USB to Wireless Card */}
        <Card className={styles.card}>
          <CardHeader
            image={<UsbPlug24Regular />}
            header={<Text weight="semibold">{t('wireless.usb_to_wireless')}</Text>}
            description={<Text size={200}>{t('wireless.usb_to_wireless_desc')}</Text>}
          />
          <div className={styles.content}>
            <div className={styles.actionSection}>
              <Button
                appearance="primary"
                icon={isSwitching ? <Spinner size="tiny" /> : <Wifi124Regular />}
                onClick={handleSwitchToTcpIp}
                disabled={!device || isSwitching}
              >
                {t('wireless.switch_to_tcpip')}
              </Button>
              
              {detectedIp && (
                <div className={styles.inputGroup}>
                   <Field label={t('wireless.device_ip')} style={{ flex: 1 }}>
                     <Input value={detectedIp} readOnly />
                   </Field>
                   <Button onClick={() => setTargetIp(detectedIp)}>
                     {t('common.copy_to', "复制到")}连接
                   </Button>
                </div>
              )}
              
              <Text className={styles.infoText}>
                {t('wireless.usb_hint', "提示：点击切换后，当显示成功即可断开 USB 线。")}
              </Text>
            </div>
          </div>
        </Card>

        {/* Standalone Connection Card */}
        <Card className={styles.card}>
          <CardHeader
            image={<Link24Regular />}
            header={<Text weight="semibold">{t('wireless.standalone_connection')}</Text>}
            description={<Text size={200}>{t('wireless.standalone_connection_desc')}</Text>}
          />
          <div className={styles.content}>
            <div className={styles.inputGroup}>
              <Field label={t('wireless.device_ip')} style={{ flex: 2 }}>
                <Input
                  value={targetIp}
                  onChange={(_, data) => setTargetIp(data.value)}
                  placeholder="192.168.x.x"
                />
              </Field>
              <Field label={t('wireless.port')} style={{ flex: 1 }}>
                <Input
                  value={targetPort}
                  onChange={(_, data) => setTargetPort(data.value)}
                  placeholder="5555"
                />
              </Field>
            </div>
            <Button
              appearance="primary"
              icon={isConnecting ? <Spinner size="tiny" /> : <Link24Regular />}
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {t('wireless.connect_btn')}
            </Button>
          </div>
        </Card>

        {/* Wireless Pairing Card */}
        <Card className={styles.card}>
          <CardHeader
            image={<Key24Regular />}
            header={<Text weight="semibold">{t('wireless.pairing_section')}</Text>}
            description={<Text size={200}>{t('wireless.pairing_desc')}</Text>}
          />
          <div className={styles.content}>
            <div className={styles.inputGroup}>
              <Field label={t('wireless.device_ip')} style={{ flex: 2 }}>
                <Input
                  value={pairIp}
                  onChange={(_, data) => setPairIp(data.value)}
                  placeholder="192.168.x.x"
                />
              </Field>
              <Field label={t('wireless.port')} style={{ flex: 1 }}>
                <Input
                  value={pairPort}
                  onChange={(_, data) => setPairPort(data.value)}
                  placeholder="Port"
                />
              </Field>
            </div>
            <Field label={t('wireless.pairing_code')}>
              <Input
                value={pairCode}
                onChange={(_, data) => setPairCode(data.value)}
                placeholder="6-digit code"
              />
            </Field>
            <Button
              appearance="primary"
              icon={isPairing ? <Spinner size="tiny" /> : <Key24Regular />}
              onClick={handlePair}
              disabled={isPairing}
            >
              {t('wireless.pair_btn')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WirelessDebuggingPanel;
