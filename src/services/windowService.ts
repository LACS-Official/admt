import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export const windowService = {
  async openAIChatWindow(isDarkMode: boolean = true) {
    console.log("尝试打开 AI 聊天窗口...");
    try {
      const label = "ai-chat";
      let aiWindow = await WebviewWindow.getByLabel(label);
      
      if (aiWindow) {
        console.log("找到存量 AI 窗口，正在显示并置于焦点...");
        await aiWindow.show();
        await aiWindow.unminimize();
        await aiWindow.setFocus();
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
        });
        win.once('tauri://error', function (e) {
          console.error("AI 窗口创建失败:", e);
        });
        return win;
      }
    } catch (error) {
      console.error("打开AI聊天窗口异常:", error);
      return null;
    }
  }
};
