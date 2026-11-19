export type CalloutType = 'note' | 'tip' | 'warning' | 'caution';
const RE = /^\[!(NOTE|TIP|WARNING|CAUTION)\][ \t]*\r?\n?/i;

interface Node { type: string; value?: string; children?: Node[]; data?: Record<string, unknown> }

/** GFM Alert：`> [!NOTE]` 开头的引用块转成 div[data-callout]；不匹配的保持普通引用 */
export function remarkAlerts() {
  const walk = (node: Node) => {
    if (node.type === 'blockquote' && node.children?.length) {
      const p = node.children[0];
      const t = p.type === 'paragraph' ? p.children?.[0] : undefined;
      const m = t && t.type === 'text' && t.value ? RE.exec(t.value) : null;
      if (t && m) {
        t.value = (t.value as string).slice(m[0].length);
        if (!t.value) p.children!.shift();
        if (!p.children!.length) node.children.shift();
        node.data = { hName: 'div', hProperties: { 'data-callout': m[1].toLowerCase() } };
      }
    }
    node.children?.forEach(walk);
  };
  return (tree: Node) => walk(tree);
}
