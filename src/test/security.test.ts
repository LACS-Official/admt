import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();

describe('权限契约', () => {
  it('HTTP 权限不含明文全网通配与任意协议通配', () => {
    const raw = readFileSync(
      resolve(ROOT, 'src-tauri/capabilities/default.json'),
      'utf-8',
    );
    const cap = JSON.parse(raw) as { permissions: unknown[] };
    const http = cap.permissions.find(
      (p): p is { identifier: string; allow: { url: string }[] } =>
        typeof p === 'object' &&
        p !== null &&
        (p as { identifier?: string }).identifier === 'http:default',
    );
    expect(http).toBeDefined();
    const urls = (http?.allow ?? []).map((item) => item.url);
    expect(urls).not.toContain('http://*');
    expect(urls).not.toContain('*://*');
  });

  it('CSP 不启用 unsafe-eval', () => {
    const conf = JSON.parse(
      readFileSync(resolve(ROOT, 'src-tauri/tauri.conf.json'), 'utf-8'),
    ) as { app?: { security?: { csp?: string } } };
    expect(conf.app?.security?.csp ?? '').not.toContain('unsafe-eval');
  });
});

describe('命令输出 XSS 防护', () => {
  it('Fastboot 输出放进 innerHTML 前逐段 HTML 转义', () => {
    const src = readFileSync(
      resolve(ROOT, 'src/components/FlashZone/FastbootCommandCard.tsx'),
      'utf-8',
    );
    expect(src).toContain('const escapeHtml');
    expect(src).toContain('return escapeHtml(output);');
    expect(src).toContain('escapeHtml(output.slice(start, end))');
    expect(src).not.toContain('${matchText}</mark>');
    // 旧实现无匹配时直接把原始设备回显塞进 dangerouslySetInnerHTML
    expect(src).not.toMatch(
      /searchMatches\.length === 0\)\s*\{\s*return output;\s*\}/,
    );
  });
});
