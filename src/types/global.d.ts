/// <reference types="react" />

interface ImportMetaEnv {
  VITE_BUILD_ID: string;
  DEV: boolean
  PROD: boolean
  MODE: string
}

interface ImportMeta {
  env: ImportMetaEnv
}

declare namespace JSX {
  interface IntrinsicElements {
    div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    br: React.DetailedHTMLProps<React.HTMLAttributes<HTMLBRElement>, HTMLBRElement>;
    span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
    button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
    input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement> & { 
      directory?: string | boolean;
      webkitdirectory?: string | boolean;
    }, HTMLInputElement>;
    // 添加其他常用HTML元素类型声明
  }
}
