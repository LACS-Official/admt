import React from 'react';
import { Text } from "@fluentui/react-components";

interface DeviceInfoItemProps {
  label: string;
  value: string;
  copyLabel: string;
  onCopyValue: (value: string, label: string) => void;
  styles: any;
}

export const DeviceInfoItem: React.FC<DeviceInfoItemProps> = ({ label, value, copyLabel, onCopyValue, styles }) => (
  <div className={styles.infoItem}>
    <Text className={styles.infoLabel}>{label}</Text>
    <div
      className={styles.infoValue}
      onClick={() => onCopyValue(value, copyLabel)}
    >
      <Text>{value}</Text>
    </div>
  </div>
);