import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

let isOpeningAIWindow = false;

export const windowService = {
  async openAIChatWindow(isDarkMode: boolean = true) {
    if (isOpeningAIWindow) return null;
    isOpeningAIWindow = true;

    console.log("尝试打开 AI 聊天窗口...");
    try {
      const label = "ai-chat";
      let aiWindow = await WebviewWindow.getByLabel(label);
      
      if (aiWindow) {
        console.log("找到存量 AI 窗口，正在显示并置于焦点...");
        try {
          await aiWindow.unminimize();
          await aiWindow.show();
          await aiWindow.setFocus();
        } catch (e) {
          console.warn("聚焦已有 AI 窗口失败(非关键):", e);
        }
        return aiWindow;
      } else {
        console.log("正在创建新 AI 窗口...");
        const win = new WebviewWindow(label, {
          url: "index.html",
          title: "AI 助手",
          width: 900,
          height: 700,
          minWidth: 600,
          minHeight: 500,
          decorations: false,
          transparent: true,
          theme: isDarkMode ? 'dark' : 'light',
        });
        
        win.once('tauri://created', function () {
          console.log("AI 窗口创建成功");
          win.show();
        });
        win.once('tauri://error', function (e) {
          console.error("AI 窗口创建失败:", e);
        });
        return win;
      }
    } catch (error) {
      const errorStr = String(error);
      if (errorStr.includes("already exists") || errorStr.includes("Label already exists")) {
        console.warn("AI 窗口已在创建或显示过程中:", error);
      } else {
        console.error("打开AI聊天窗口异常:", error);
      }
      return null;
    } finally {
      setTimeout(() => {
        isOpeningAIWindow = false;
      }, 500);
    }
  }
};
