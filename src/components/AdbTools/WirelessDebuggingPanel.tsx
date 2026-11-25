import React, {useEffect, useState} from 'react';
import {
  makeStyles,
  Text,
  Button,
  Field,
  Input,
  Spinner,
  Badge,
  TabList,
  Tab,
} from "@fluentui/react-components";
import {
  Wifi124Regular,
  UsbPlug24Regular,
  Link24Regular,
  Key24Regular,
  LinkDismiss24Regular,
} from "@fluentui/react-icons";

import { useAppStore } from "../../stores/appStore";
import { useDeviceStore } from "../../stores/deviceStore";
import { DeviceInfo } from "../../types/device";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { wirelessService, QrPairingInfo, PairingProgressEvent } from "../../services/wirelessService";
import { useDeviceService } from "../../services/deviceService";

type TabValue = "qr" | "ip" | "pair";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  pane: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    paddingTop: "12px",
    minHeight: "264px",
  },
  centered: {
    alignItems: "center",
    textAlign: "center",
    justifyContent: "center",
    gap: "8px",
  },
  inputRow: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
  },
  usbRow: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    padding: "4px 0",
  },
  usbText: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  },
  qrBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    // 二维码识别需要白底，不随主题变化
    backgroundColor: "#ffffff",
    borderRadius: "var(--admt-radius-card)",
    alignSelf: "center",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  hint: {
    color: "var(--colorNeutralForeground2)",
    fontSize: "12px",
    lineHeight: 1.5,
    textAlign: "center",
  },
  subtle: {
    color: "var(--colorNeutralForeground3)",
    fontSize: "12px",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "auto",
    paddingTop: "4px",
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
  const { deviceService } = useDeviceService();

  const [tab, setTab] = useState<TabValue>("qr");

  // USB 转无线
  const [isSwitching, setIsSwitching] = useState(false);

  // IP 连接
  const [targetIp, setTargetIp] = useState("");
  const [targetPort, setTargetPort] = useState("5555");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // 手动配对
  const [pairIp, setPairIp] = useState("");
  const [pairPort, setPairPort] = useState("");
  const [pairCode, setPairCode] = useState("");
  const [isPairing, setIsPairing] = useState(false);

  // 扫码配对
  const [qrPairingInfo, setQrPairingInfo] = useState<QrPairingInfo | null>(null);
  const [qrStatus, setQrStatus] = useState<PairingProgressEvent | null>(null);
  const [isStartingQrServer, setIsStartingQrServer] = useState(false);

  // 订阅配对进度事件（wireless-pairing-progress）
  useEffect(() => {
    let disposed = false;
    let unlistenFn: (() => void) | null = null;
    wirelessService
      .onPairingProgress((event) => {
        if (disposed) return;
        setQrStatus(event);
        if (event.status === "connected") {
          setStatusBarMessage({ type: "success", message: t('wireless.qr_pairing_success') });
          // 刷新设备列表，让无线设备立即出现
          deviceService
            .scanDevices()
            .then((devices) => useDeviceStore.getState().setDevices(devices))
            .catch(() => {});
          // 配对完成，收起 QR 界面
          wirelessService.stopPairingServer().catch(() => {});
          setQrPairingInfo(null);
        } else if (event.status === "failed") {
          setStatusBarMessage({ type: "error", message: event.message || t('wireless.qr_status_failed') });
        }
      })
      .then((unlisten) => {
        if (disposed) unlisten();
        else unlistenFn = unlisten;
      })
      .catch(() => {});
    return () => {
      disposed = true;
      if (unlistenFn) unlistenFn();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startQrPairing = async () => {
    try {
      setIsStartingQrServer(true);
      setQrStatus(null);
      const info = await wirelessService.startPairingServer();
      setQrPairingInfo(info);
      setStatusBarMessage({ type: "info", message: t('wireless.qr_pairing_waiting') });
    } catch (error) {
      setStatusBarMessage({ type: "error", message: t('wireless.qr_pairing_failed') });
    } finally {
      setIsStartingQrServer(false);
    }
  };

  const stopQrPairing = async () => {
    try {
      await wirelessService.stopPairingServer();
      setQrPairingInfo(null);
      setQrStatus(null);
    } catch (error) {
      // Ignore
    }
  };

  const qrValue = qrPairingInfo
    ? `WIFI:T:ADB;S:${qrPairingInfo.serviceName};P:${qrPairingInfo.pairingCode};;`
    : "";

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

        // 自动探测 IP 并填入连接表单
        const ip = await wirelessService.getDeviceIp(device.serial);
        if (ip) {
          setTargetIp(ip);
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

  const handleDisconnect = async (all = false) => {
    try {
      setIsDisconnecting(true);
      const ip = all ? undefined : targetIp;
      const port = all ? undefined : (parseInt(targetPort) || 5555);

      setStatusBarMessage({ type: "info", message: t('wireless.msg_disconnecting') });
      const result = await wirelessService.disconnectWireless(ip, port);

      if (result.success) {
        setStatusBarMessage({ type: "success", message: t('wireless.msg_disconnect_success') });
      } else {
        setStatusBarMessage({ type: "error", message: result.error || t('wireless.msg_disconnect_failed', { error: "" }) });
      }
    } catch (error) {
      setStatusBarMessage({ type: "error", message: String(error) });
    } finally {
      setIsDisconnecting(false);
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
    <div className={styles.root}>
      <TabList selectedValue={tab} onTabSelect={(_, data) => setTab(data.value as TabValue)}>
        <Tab value="qr">{t('wireless.qr_pairing_title')}</Tab>
        <Tab value="ip">{t('wireless.standalone_connection')}</Tab>
        <Tab value="pair">{t('wireless.pairing_section')}</Tab>
      </TabList>

      {tab === "qr" && (
        <div className={`${styles.pane} ${!qrPairingInfo ? styles.centered : ""}`}>
          {!qrPairingInfo ? (
            <>
              <Text>{t('wireless.qr_pairing_desc')}</Text>
              <Button
                appearance="primary"
                icon={isStartingQrServer ? <Spinner size="tiny" /> : <Wifi124Regular />}
                onClick={startQrPairing}
                disabled={isStartingQrServer}
              >
                {t('wireless.qr_pairing_start')}
              </Button>
              <Text className={styles.subtle}>{t('wireless.qr_pairing_fallback_tip')}</Text>
            </>
          ) : (
            <>
              <div className={styles.qrBlock}>
                <QRCodeSVG value={qrValue} size={160} />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Badge appearance="filled" color="brand">{qrPairingInfo.pairingCode}</Badge>
                  <Text size={200} className={styles.subtle}>{qrPairingInfo.serviceName}</Text>
                </div>
              </div>

              {qrStatus && (
                <div className={styles.statusRow}>
                  {qrStatus.status !== 'connected' && qrStatus.status !== 'failed' && <Spinner size="tiny" />}
                  <Text
                    size={200}
                    weight="semibold"
                    style={{
                      color: qrStatus.status === 'failed'
                        ? 'var(--colorPaletteRedForeground1)'
                        : qrStatus.status === 'connected'
                          ? 'var(--colorPaletteGreenForeground1)'
                          : undefined,
                    }}
                  >
                    {t(`wireless.qr_status_${qrStatus.status}`)}
                  </Text>
                  {qrStatus.target && (
                    <Text size={100} className={styles.subtle}>{qrStatus.target}</Text>
                  )}
                </div>
              )}
              {qrStatus?.status === 'failed' && qrStatus.message && (
                <Text size={100} style={{ color: 'var(--colorPaletteRedForeground1)', textAlign: 'center', lineHeight: 1.4 }}>
                  {qrStatus.message}
                </Text>
              )}

              <Text className={styles.hint}>{t('wireless.qr_pairing_steps')}</Text>
              <Button appearance="secondary" onClick={stopQrPairing}>
                {t('wireless.qr_pairing_stop')}
              </Button>
            </>
          )}
        </div>
      )}

      {tab === "ip" && (
        <div className={styles.pane}>
          <div className={styles.usbRow}>
            <UsbPlug24Regular />
            <div className={styles.usbText}>
              <Text size={200} weight="semibold">{t('wireless.usb_to_wireless')}</Text>
              <Text size={100} className={styles.subtle}>{t('wireless.usb_to_wireless_desc')}</Text>
            </div>
            <Button
              icon={isSwitching ? <Spinner size="tiny" /> : <Wifi124Regular />}
              onClick={handleSwitchToTcpIp}
              disabled={!device || isSwitching}
            >
              {t('wireless.switch_to_tcpip')}
            </Button>
          </div>

          <div className={styles.inputRow}>
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
            <Button
              appearance="primary"
              icon={isConnecting ? <Spinner size="tiny" /> : <Link24Regular />}
              onClick={handleConnect}
              disabled={isConnecting || isDisconnecting}
            >
              {t('wireless.connect_btn')}
            </Button>
            <Button
              appearance="secondary"
              icon={isDisconnecting ? <Spinner size="tiny" /> : <LinkDismiss24Regular />}
              onClick={() => handleDisconnect(false)}
              disabled={isConnecting || isDisconnecting}
            >
              {t('wireless.disconnect_btn')}
            </Button>
          </div>

          <div className={styles.footer}>
            <Button
              appearance="subtle"
              size="small"
              onClick={() => handleDisconnect(true)}
              disabled={isConnecting || isDisconnecting}
            >
              {t('wireless.disconnect_all')}
            </Button>
          </div>
        </div>
      )}

      {tab === "pair" && (
        <div className={styles.pane}>
          <Text className={styles.hint} style={{ textAlign: 'left' }}>{t('wireless.pairing_desc')}</Text>

          <div className={styles.inputRow}>
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
                placeholder="00000"
              />
            </Field>
          </div>
          <div className={styles.inputRow}>
            <Field label={t('wireless.pairing_code')} style={{ flex: 1 }}>
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

          <Text className={styles.subtle}>{t('wireless.pair_manual_hint')}</Text>
        </div>
      )}
    </div>
  );
};

export default WirelessDebuggingPanel;
