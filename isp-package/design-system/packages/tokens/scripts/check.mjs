import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, varName, refs } from './lib.mjs';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'tokens.css');
const tokens = load();
const errs = [];
const paths = new Set(tokens.map((t) => t.path.join('.')));

// 1. 所有别名都能解析
for (const t of tokens) {
  const vals = t.type === 'shadow' ? t.value.map((s) => s.color) : [t.value];
  for (const v of vals) for (const r of refs(v)) if (!paths.has(r)) errs.push(`未解析的别名 ${r}（${t.path.join('.')}）`);
}
// 2. semantic 与 agent 层只能是别名，不写色值
for (const t of tokens.filter((t) => t.layer !== 'primitive' && t.type === 'color'))
  if (!/^\{[^}]+\}$/.test(t.value)) errs.push(`${t.layer} 层不能写色值：${t.path.join('.')} = ${t.value}`);
// 3. 亮暗成对：带 dark 的 token 必须是 primitive
for (const t of tokens.filter((t) => t.dark && t.layer !== 'primitive')) errs.push(`只有 primitive 能有 dark：${t.path.join('.')}`);
// 4. CSS 里用到的 var 都已定义，且没有 --isp
const css = readFileSync(dist, 'utf8');
const defined = new Set([...css.matchAll(/^\s+(--wiz-[a-z0-9-]+):/gm)].map((m) => m[1]));
for (const m of css.matchAll(/var\((--[a-z0-9-]+)\)/g)) if (!defined.has(m[1])) errs.push(`CSS 引用了未定义变量 ${m[1]}`);
if (/--isp-/.test(css)) errs.push('CSS 里出现 --isp-');
// 5. 与 Wiz Figma 读到的值对账（2026-11-12 从 Wiz 文件读取）
const want = {
  'palette.brand-blue.60': ['#2A6DE7', '#4382F8'], 'palette.brand-blue.50': ['#4382F8', '#2A6DE7'], 'palette.brand-blue.10': ['#F4F8FF', '#001E56'],
  'palette.grey.100': ['#222222', '#FAFAFA'], 'palette.grey.80': ['#666666', '#F0F0F0'], 'palette.grey.70': ['#999999', '#E5E5E5'],
  'palette.main.brand-blue': ['#0049CD', '#87B0FB'], 'palette.main.white': ['#FFFFFF', '#000000'], 'palette.alpha.black-8': ['#00000014', '#FFFFFF14'],
  'palette.alpha.error-bg': ['#DA1E281A', '#FA4D561A'], 'palette.red.80': ['#A00009', '#FFB3B8'], 'palette.green.70': ['#156115', '#3EC23E'],
  'spacing.xs-sm': ['6px'], 'radius.lg': ['16px'], 'radius.full': ['9999px'],
};
for (const [p, [l, d]] of Object.entries(want)) {
  const t = tokens.find((x) => x.path.join('.') === p);
  if (!t) errs.push(`缺少 ${p}`);
  else if (String(t.value).toUpperCase() !== l.toUpperCase() || (d && (t.dark ?? '').toUpperCase() !== d.toUpperCase())) errs.push(`${p} 与 Figma 不一致：${t.value}/${t.dark}，应为 ${l}/${d}`);
}
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(`check ok：${tokens.length} 个 token，${defined.size} 个 CSS 变量`);
