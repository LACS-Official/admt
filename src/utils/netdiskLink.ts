/**
 * 网盘分享链接识别与浏览器跳转。
 *
 * 夸克 / 123 云盘 / 百度网盘的分享页不是文件直链：后端 GET 会拿到 HTML 落地页，
 * 直接写盘只会产出假文件。因此在进入任何下载链路之前，先识别并交给系统浏览器，
 * 由用户在网页里完成「打开分享 → 输入提取码 → 另存」这一步。
 */

export type NetdiskProviderId = 'quark' | 'pan123' | 'baidu';

export interface NetdiskMatch {
  provider: NetdiskProviderId;
  /** 展示用名称，如「夸克网盘」 */
  label: string;
  /** 从原始文本中提取出的、可直接交给浏览器打开的地址 */
  url: string;
}

interface NetdiskRule {
  provider: NetdiskProviderId;
  label: string;
  /** 小写匹配，命中任意一个即认为属于该网盘 */
  keywords: string[];
}

/**
 * 关键字按「域名 + 品牌名」组织：
 * - 夸克：pan.quark.cn / quark.cn 及 quark 品牌词
 * - 123 云盘：123pan 主域、官方备用域名（123684 / 123865 / 123912）、中文名
 * - 百度网盘：pan.baidu / yun.baidu / baidupcs / 分享路径 / 中文名
 * 不加裸 `123`、`baidu`，避免把普通直链（query 参数里带数字或来源标记）误判。
 */
const NETDISK_RULES: NetdiskRule[] = [
  {
    provider: 'quark',
    label: '夸克网盘',
    keywords: ['quark', '夸克网盘', '夸克云盘', '夸克'],
  },
  {
    provider: 'pan123',
    label: '123 云盘',
    keywords: [
      '123pan',
      '123684',
      '123865',
      '123912',
      '123云盘',
      '123网盘',
      '123 云盘',
      '123 网盘',
    ],
  },
  {
    provider: 'baidu',
    label: '百度网盘',
    keywords: [
      'pan.baidu',
      'yun.baidu',
      'baidupcs',
      'baidu.com/s/',
      '百度网盘',
      '百度云盘',
      '百度云',
      '百度盘',
    ],
  },
];

/** 后端网盘兜底返回的错误码，前端据此自动打开浏览器 */
export const NETDISK_REDIRECT_CODE = 'NETDISK_REDIRECT_REQUIRED';

/** 从可能夹带「提取码: xxxx」「网盘：」等说明的文本中取出第一个 http(s) 链接 */
export function extractHttpUrl(raw: string): string | null {
  if (!raw) return null;
  const matched = raw.match(/https?:\/\/[^\s<>"'`，，、；;）)\]】]+/i);
  if (matched) {
    // 去掉粘连在尾部的中英文标点
    return matched[0].replace(/[.,;:!?，。；：！？、]+$/, '').trim() || null;
  }

  // 部分资源只登记了裸域名（如 pan.baidu.com/s/1abc），补协议后才能交给浏览器
  const bare = raw.match(/(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s<>"'`，，、；;）)\]】]*)?/i);
  if (!bare) return null;
  return `https://${bare[0].replace(/[.,;:!?，。；：！？、]+$/, '').trim()}`;
}

/** 识别下载链接是否属于三大网盘的分享页 */
export function detectNetdiskLink(raw?: string | null): NetdiskMatch | null {
  if (!raw) return null;
  const url = extractHttpUrl(raw);
  if (!url) return null;

  const haystack = raw.toLowerCase();
  for (const rule of NETDISK_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
      return { provider: rule.provider, label: rule.label, url };
    }
  }
  return null;
}

/**
 * 用系统默认浏览器打开链接。
 * 优先 Tauri opener 插件（权限 opener:default），其次 shell 插件（shell:allow-open），
 * 最后回退到 webview 的 window.open（开发模式 / 浏览器调试）。
 */
export async function openInBrowser(rawUrl: string): Promise<boolean> {
  const url = extractHttpUrl(rawUrl);
  if (!url) return false;

  try {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(url);
    return true;
  } catch (error) {
    console.warn('[netdisk] opener 打开失败，尝试 shell 插件', error);
  }

  try {
    const { open } = await import('@tauri-apps/plugin-shell');
    await open(url);
    return true;
  } catch (error) {
    console.warn('[netdisk] shell 打开失败，回退 window.open', error);
  }

  try {
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    return !!opened;
  } catch (error) {
    console.error('[netdisk] 无法打开浏览器', error);
    return false;
  }
}

/** service 层拦截网盘链接时抛出的可识别错误，UI 不应把它显示成「下载失败」 */
export class NetdiskRedirectError extends Error {
  readonly match: NetdiskMatch;

  constructor(match: NetdiskMatch) {
    super(`${NETDISK_REDIRECT_CODE}: 该链接为${match.label}分享页，已在浏览器中打开`);
    this.name = 'NetdiskRedirectError';
    this.match = match;
  }
}

export function isNetdiskRedirectError(error: unknown): boolean {
  if (error instanceof NetdiskRedirectError) return true;
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes(NETDISK_REDIRECT_CODE);
}
