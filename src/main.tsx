import React from "react";
import ReactDOM from "react-dom/client";
import { FluentProvider, webLightTheme, webDarkTheme } from "@fluentui/react-components";
import App from "./App";
import { useThemeStore } from "./stores/themeStore";
import "./styles/global.css";

function AppWithTheme() {
  const { isDarkMode } = useThemeStore();

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
      <App />
    </FluentProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppWithTheme />
  </React.StrictMode>
);
