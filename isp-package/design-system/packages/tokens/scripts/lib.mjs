// 读取 src 下全部 DTCG JSON，展开成扁平 token 列表。零依赖。
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
export const LAYERS = ['primitive', 'semantic', 'agent'];

export function load() {
  const tokens = [];
  for (const layer of LAYERS) {
    for (const f of readdirSync(join(SRC, layer)).filter((n) => n.endsWith('.json')).sort()) {
      walk(JSON.parse(readFileSync(join(SRC, layer, f), 'utf8')), [], undefined, layer, f, tokens);
    }
  }
  return tokens;
}

function walk(node, path, type, layer, file, out) {
  const t = node.$type ?? type;
  if ('$value' in node) {
    out.push({ path, type: t, value: node.$value, dark: node.$extensions?.wiz?.dark, layer, file });
    return;
  }
  for (const [k, v] of Object.entries(node)) if (!k.startsWith('$')) walk(v, [...path, k], t, layer, file, out);
}

// palette.grey.90 -> --wiz-grey-90；其余路径直接拼接
export const varName = (path) => '--wiz-' + (path[0] === 'palette' ? path.slice(1) : path).join('-');
const aliasRe = /\{([^}]+)\}/g;
export const isAlias = (v) => typeof v === 'string' && /^\{[^}]+\}$/.test(v);
export const refs = (v) => (typeof v === 'string' ? [...v.matchAll(aliasRe)].map((m) => m[1]) : []);
const toVar = (s) => s.replace(aliasRe, (_, p) => `var(${varName(p.split('.'))})`);

export function cssValue(tok) {
  const v = tok.value;
  if (tok.type === 'shadow')
    return v.map((s) => `${s.inset ? 'inset ' : ''}${s.offsetX} ${s.offsetY} ${s.blur} ${s.spread} ${toVar(s.color)}`).join(', ');
  if (tok.type === 'cubicBezier') return `cubic-bezier(${v.join(', ')})`;
  return toVar(String(v));
}
