import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Divider,
  Tooltip,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogBody,
  Input,
  Field,
  Select,
} from "@fluentui/react-components";
import {
  Add24Regular,
  Settings24Regular,
  Edit24Regular,
  Delete24Regular,
  Phone24Regular,
  Battery024Regular,
  Storage24Regular,
  DesktopPulse24Regular,
  Wifi124Regular,
  People24Regular,
  CalendarLtr24Regular,
  Location24Regular,
  Heart24Regular,
  Star24Regular,
  Apps24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";

// 定义自定义信息卡片的类型
interface CustomInfoCard {
  id: string;
  title: string;
  value: string;
  icon: string;
  color: string;
}

// 定义可用的图标选项
const iconOptions = [
  { key: "phone", label: "设备", icon: <Phone24Regular /> },
  { key: "battery", label: "电池", icon: <Battery024Regular /> },
  { key: "storage", label: "存储", icon: <Storage24Regular /> },
  { key: "network", label: "网络", icon: <Wifi124Regular /> },
  { key: "users", label: "用户", icon: <People24Regular /> },
  { key: "calendar", label: "日期", icon: <CalendarLtr24Regular /> },
  { key: "location", label: "位置", icon: <Location24Regular /> },
  { key: "heart", label: "健康", icon: <Heart24Regular /> },
  { key: "star", label: "评级", icon: <Star24Regular /> },
  { key: "apps", label: "应用", icon: <Apps24Regular /> },
  { key: "desktop", label: "桌面", icon: <DesktopPulse24Regular /> },
];

// 定义颜色选项
const colorOptions = [
  { key: "brand", label: "品牌色", value: "var(--colorBrandBackground)" },
  { key: "success", label: "成功", value: "var(--colorPaletteGreenBackground2)" },
  { key: "warning", label: "警告", value: "var(--colorPaletteYellowBackground2)" },
  { key: "error", label: "错误", value: "var(--colorPaletteRedBackground2)" },
  { key: "info", label: "信息", value: "var(--colorPaletteBlueBackground2)" },
];

const useStyles = makeStyles({
  container: {
    padding: "16px",
    height: "100%",
    overflow: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
  },
  card: {
    height: "120px",
    display: "flex",
    flexDirection: "column",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    },
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px",
  },
  cardContent: {
    padding: "0 12px 12px 12px",
    flex: 1,
    display: "flex",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: "600",
  },
  cardValue: {
    fontSize: "18px",
    fontWeight: "700",
  },
  addButton: {
    minWidth: "40px",
    minHeight: "40px",
  },
  customButtonContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    minHeight: "120px",
  },
  customButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "16px",
    width: "100%",
    height: "100%",
  },
  customButtonIcon: {
    fontSize: "24px",
  },
  customButtonText: {
    fontSize: "14px",
    fontWeight: "500",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
});

interface CustomInfoPanelProps {
  device: DeviceInfo;
}

const CustomInfoPanel: React.FC<CustomInfoPanelProps> = ({ device }) => {
  const styles = useStyles();
  const [cards, setCards] = useState<CustomInfoCard[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CustomInfoCard | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    value: "",
    icon: "phone",
    color: "brand",
  });

  // 初始化9个空卡片
  useEffect(() => {
    const initialCards: CustomInfoCard[] = [];
    for (let i = 0; i < 9; i++) {
      initialCards.push({
        id: `card-${i}`,
        title: "未设置",
        value: "点击编辑",
        icon: "phone",
        color: "brand",
      });
    }
    setCards(initialCards);
  }, []);

  // 获取图标组件
  const getIconComponent = (iconKey: string) => {
    const icon = iconOptions.find(option => option.key === iconKey);
    return icon ? icon.icon : <Phone24Regular />;
  };

  // 处理添加卡片
  const handleAddCard = () => {
    setEditingCard(null);
    setFormData({
      title: "",
      value: "",
      icon: "phone",
      color: "brand",
    });
    setIsDialogOpen(true);
  };

  // 处理编辑卡片
  const handleEditCard = (card: CustomInfoCard) => {
    setEditingCard(card);
    setFormData({
      title: card.title,
      value: card.value,
      icon: card.icon,
      color: card.color,
    });
    setIsDialogOpen(true);
  };

  // 处理删除卡片
  const handleDeleteCard = (cardId: string) => {
    setCards(cards.filter(card => card.id !== cardId));
  };

  // 保存卡片
  const handleSaveCard = () => {
    if (formData.title && formData.value) {
      if (editingCard) {
        // 更新现有卡片
        setCards(cards.map(card => 
          card.id === editingCard.id 
            ? { ...formData, id: editingCard.id } 
            : card
        ));
      } else {
        // 添加新卡片
        const newCard: CustomInfoCard = {
          ...formData,
          id: Date.now().toString(),
        };
        if (cards.length < 9) {
          setCards([...cards, newCard]);
        }
      }
      setIsDialogOpen(false);
    }
  };

  // 处理表单变化
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size={500} weight="semibold">自定义信息</Text>
      </div>

      <div className={styles.grid}>
        {cards.map(card => (
          <Card
            key={card.id}
            className={styles.card}
            style={{ backgroundColor: colorOptions.find(c => c.key === card.color)?.value }}
            onClick={() => handleEditCard(card)}
          >
            <div className={styles.cardHeader}>
              {getIconComponent(card.icon)}
              <Text className={styles.cardTitle}>{card.title}</Text>
            </div>
            <div className={styles.cardContent}>
              <Text className={styles.cardValue}>{card.value}</Text>
            </div>
          </Card>
        ))}
      </div>

      {/* 添加/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              编辑自定义信息
            </DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                <Field label="标题">
                  <Input
                    value={formData.title}
                    onChange={(_, data) => handleFormChange("title", data.value)}
                    placeholder="输入标题"
                  />
                </Field>
                <Field label="值">
                  <Input
                    value={formData.value}
                    onChange={(_, data) => handleFormChange("value", data.value)}
                    placeholder="输入值"
                  />
                </Field>
                <Field label="图标">
                  <Select
                    value={formData.icon}
                    onChange={(_, data) => handleFormChange("icon", data.value)}
                  >
                    {iconOptions.map(option => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="颜色">
                  <Select
                    value={formData.color}
                    onChange={(_, data) => handleFormChange("color", data.value)}
                  >
                    {colorOptions.map(option => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button appearance="primary" onClick={handleSaveCard}>
                保存
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default CustomInfoPanel;