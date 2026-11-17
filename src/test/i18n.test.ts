import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();
const LOCALE_DIR = resolve(ROOT, 'src/i18n/locales');
const SRC_DIR = resolve(ROOT, 'src');

type LeafMap = Record<string, string>;

function load(name: string): unknown {
  return JSON.parse(readFileSync(join(LOCALE_DIR, name), 'utf-8')) as unknown;
}

function flatten(input: unknown, prefix = '', out: LeafMap = {}): LeafMap {
  if (input !== null && typeof input === 'object' && !Array.isArray(input)) {
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      flatten(value, prefix ? `${prefix}.${key}` : key, out);
    }
  } else {
    out[prefix] = String(input ?? '');
  }
  return out;
}

const locales = {
  'zh-CN': flatten(load('zh-CN.json')),
  'en-US': flatten(load('en-US.json')),
  'zh-TW': flatten(load('zh-TW.json')),
};

function placeholders(text: string): string {
  return (text.match(/\{\{\s*[\w.]+\s*\}\}/g) ?? [])
    .map((item) => item.replace(/\s/g, ''))
    .sort()
    .join('|');
}

function collectSourceFiles(dir: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      result.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\./.test(entry)) {
      result.push(full);
    }
  }
  return result;
}

describe('i18n 契约', () => {
  it('三份语言文件的叶子 key 集合完全一致', () => {
    const base = Object.keys(locales['zh-CN']).sort();
    expect(base.length).toBeGreaterThan(1000);
    for (const [name, leaf] of Object.entries(locales)) {
      expect(Object.keys(leaf).sort(), name).toEqual(base);
    }
  });

  it('每个 key 的插值占位符在三语中一致', () => {
    const mismatches: string[] = [];
    for (const key of Object.keys(locales['zh-CN'])) {
      const shapes = Object.values(locales).map((leaf) => placeholders(leaf[key] ?? ''));
      if (new Set(shapes).size > 1) mismatches.push(key);
    }
    expect(mismatches).toEqual([]);
  });

  it('源码中静态 t() 引用的 key 均已定义', () => {
    const missing = new Set<string>();
    const pattern = /\bt\(\s*['"`]([^'"`]+)['"`]/g;
    for (const file of collectSourceFiles(SRC_DIR)) {
      const content = readFileSync(file, 'utf-8');
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        const key = match[1];
        if (key.includes('${') || !key.includes('.')) continue;
        if (!(key in locales['zh-CN'])) missing.add(key);
      }
    }
    expect([...missing].sort()).toEqual([]);
  });

  it('三份语言文件不存在重复的顶层段', () => {
    for (const name of Object.keys(locales)) {
      const raw = readFileSync(join(LOCALE_DIR, `${name}.json`), 'utf-8');
      const topKeys = [...raw.matchAll(/^ {2}"([^"]+)":\s*\{/gm)].map((m) => m[1]);
      expect(new Set(topKeys).size, name).toBe(topKeys.length);
    }
  });
});
