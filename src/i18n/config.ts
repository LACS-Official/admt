import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import enUS from './locales/en-US.json';

const resources = {
  "zh-CN": {
    translation: zhCN,
  },
  "zh-TW": {
    translation: zhTW,
  },
  "en-US": {
    translation: enUS,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh-CN', // 默认语言，后续会在 App 初始化时同步 store 中的设置
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
