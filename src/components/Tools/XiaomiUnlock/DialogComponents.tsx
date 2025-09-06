/**
 * 小米解锁工具对话框组件
 * 重构点：将对话框组件提取为可复用组件，减少主组件复杂度
 */

import React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Text,
} from "@fluentui/react-components";
import { XiaomiTool } from './types';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTool: XiaomiTool | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 确认操作对话框
 * 重构点：提取确认对话框为独立组件，提高复用性
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  selectedTool,
  onConfirm,
  onCancel
}) => {
  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogTitle>确认危险操作</DialogTitle>
        <DialogContent>
          <DialogBody>
            <Text>
              您即将执行 "{selectedTool?.label}" 操作。
              此操作具有风险，可能导致设备变砖或数据丢失。
            </Text>
            <br />
            <Text weight="semibold" style={{ color: "var(--colorPaletteRedForeground1)" }}>
              请确认您已了解风险并备份了重要数据。
            </Text>
          </DialogBody>
        </DialogContent>
        <DialogActions>
          <Button appearance="secondary" onClick={onCancel}>
            取消
          </Button>
          <Button appearance="primary" onClick={onConfirm}>
            确认执行
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

interface ResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  onClose: () => void;
}

/**
 * 结果显示对话框
 * 重构点：提取结果对话框为独立组件，支持不同类型的结果展示
 */
export const ResultDialog: React.FC<ResultDialogProps> = ({
  open,
  onOpenChange,
  title,
  message,
  onClose
}) => {
  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <DialogBody>
            <Text style={{ whiteSpace: "pre-wrap" }}>{message}</Text>
          </DialogBody>
        </DialogContent>
        <DialogActions>
          <Button appearance="primary" onClick={onClose}>
            知道了
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};