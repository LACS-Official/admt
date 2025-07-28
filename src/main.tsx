import React from "react";
import ReactDOM from "react-dom/client";
import { FluentProvider, webLightTheme, webDarkTheme } from "@fluentui/react-components";
import App from "./App";
import { useThemeStore } from "./stores/themeStore";
import { SecurityProvider } from "./components/Security";
import "./styles/global.css";

function AppWithTheme() {
  const { isDarkMode } = useThemeStore();

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
      <SecurityProvider enableProtection={true}>
        <App />
      </SecurityProvider>
    </FluentProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppWithTheme />
  </React.StrictMode>
);
