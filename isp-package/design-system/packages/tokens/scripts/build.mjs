import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, varName, cssValue } from './lib.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const FIGMA_OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'figma-map', 'figma-variables.json');
mkdirSync(OUT, { recursive: true });
const tokens = load();

// --- CSS
const light = tokens.map((t) => `  ${varName(t.path)}: ${cssValue(t)};`);
const dark = tokens.filter((t) => t.dark).map((t) => `  ${varName(t.path)}: ${t.dark};`);

// 文字样式类：.wiz-text-h1 等
const styles = [...new Set(tokens.filter((t) => t.path[0] === 'text').map((t) => t.path[1]))];
const classes = styles.map((s) => {
  const v = (p) => `var(--wiz-text-${s}-${p})`;
  const has = tokens.some((t) => t.path.join('.') === `text.${s}.transform`);
  return `.wiz-text-${s} {\n  font-family: ${v('family')};\n  font-weight: ${v('weight')};\n  font-size: ${v('size')};\n  letter-spacing: ${v('letter-spacing')};\n  line-height: var(--wiz-font-line-height-normal);${has ? `\n  text-transform: ${v('transform')};` : ''}\n}`;
});

const css = `/* 由 packages/tokens/scripts/build.mjs 生成，勿手改。源文件在 packages/tokens/src */
:root {
  color-scheme: light;
${light.join('\n')}
}

:root[data-theme='dark'], [data-theme='dark'] {
  color-scheme: dark;
${dark.join('\n')}
}

${classes.join('\n\n')}
`;
writeFileSync(join(OUT, 'tokens.css'), css);

// --- JSON / JS（值为 CSS 变量引用 + 亮暗原值）
const flat = Object.fromEntries(tokens.map((t) => [varName(t.path), { type: t.type, light: cssValue(t), ...(t.dark ? { dark: t.dark } : {}) }]));
writeFileSync(join(OUT, 'tokens.json'), JSON.stringify(flat, null, 2) + '\n');
const js = Object.keys(flat).map((n) => `  '${n.slice(6).replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())}': 'var(${n})'`);
writeFileSync(join(OUT, 'tokens.js'), `export const tokens = {\n${js.join(',\n')}\n};\n`);
writeFileSync(join(OUT, 'tokens.d.ts'), `export declare const tokens: Record<string, string>;\n`);

// --- Figma 变量导入文件（名称对齐 Wiz 文件现有命名）
const title = (s) => s.split('-').map((w) => (w === 'greenblue' ? 'GreenBlue' : w[0].toUpperCase() + w.slice(1))).join(' ');
const alphaNames = { 'white-50': 'White 50%', 'white-0': 'White 0%', 'black-50': 'Black 50%', 'black-8': 'Black 8%', 'success-bg': 'SuccessBG', 'progress-bg': 'ProgressBG', 'warning-bg': 'WarningBG', 'error-bg': 'ErrorBG' };
function figmaName(t) {
  const [a, b, c] = t.path;
  if (a === 'palette' && b === 'main') return `Main Color/${title(c)}`;
  if (a === 'palette' && b === 'alpha') return alphaNames[c];
  if (a === 'palette' && b === 'fixed') return null;
  if (a === 'palette') return `${title(b)}/${title(b)} ${c}`;
  if (a === 'agent') return `agent/${t.path.slice(1).join('-')}`;
  if (a === 'spacing' || a === 'radius') return `${a}/${b}`;
  return null; // 语义层、文字、阴影不导入（Figma 里是别名或样式）
}
const figma = tokens.filter((t) => ['color', 'dimension'].includes(t.type) && figmaName(t)).map((t) => ({
  collection: t.path[0] === 'agent' ? 'Agent Tools · Semantic' : t.path[0] === 'palette' ? 'Collection' : t.path[0] === 'spacing' ? 'Spacing' : 'Radius',
  name: figmaName(t),
  type: t.type === 'color' ? 'COLOR' : 'FLOAT',
  values: t.type === 'dimension' ? { Value: parseFloat(t.value) } : { Light: t.value, ...(t.dark ? { Dark: t.dark } : {}) },
}));
writeFileSync(FIGMA_OUT, JSON.stringify(figma, null, 2) + '\n');
console.log(`tokens=${tokens.length} css-vars=${light.length} dark=${dark.length} text-classes=${styles.length} figma=${figma.length}`);
