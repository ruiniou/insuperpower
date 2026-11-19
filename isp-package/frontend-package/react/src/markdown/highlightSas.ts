export type SasTokenType = 'comment' | 'string' | 'keyword' | 'function' | 'variable' | 'number';
export interface SasToken { type: SasTokenType | null; text: string }

// 规则取自 Atlas highlightSAS：注释、字符串、关键字、宏（%xxx）、参数名、数字
const RE =
  /(\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(\b(?:proc sql|proc|sql|quit|data|run|create table|select|from|where|left join|group by|on|and|not|options|title\d|footnote\d|as|in)\b)|(%[a-zA-Z_0-9]+)|(\b(?:inds|inda|cols|col_labels|freeze_cols|page_cols|page_num|orientation|out_rtf)\b)|(\b\d+\b)/gi;

/** 把一段 SAS 代码切成带类型的片段；type 为 null 表示无高亮的普通文本 */
export function tokenizeSas(code: string): SasToken[] {
  const out: SasToken[] = [];
  const re = new RegExp(RE.source, RE.flags);
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) out.push({ type: null, text: code.slice(last, m.index) });
    const type: SasTokenType = m[1] ? 'comment' : m[2] || m[3] ? 'string' : m[4] ? 'keyword' : m[5] ? 'function' : m[6] ? 'variable' : 'number';
    out.push({ type, text: m[0] });
    last = re.lastIndex;
  }
  if (last < code.length) out.push({ type: null, text: code.slice(last) });
  return out;
}
