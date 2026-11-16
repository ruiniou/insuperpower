import { fireEvent, render, screen } from '@testing-library/react';
import { Markdown, MarkdownCodeBlock, MarkdownImage, tokenizeSas } from '../index';

const html = (md: string) => render(<Markdown>{md}</Markdown>).container;

describe('Markdown', () => {
  it('H1–H3 都用同一个标题 class，保留语义标签', () => {
    const c = html('# a\n\n## b\n\n### c');
    expect(c.querySelectorAll('h1.wiz-md-heading,h2.wiz-md-heading,h3.wiz-md-heading')).toHaveLength(3);
  });
  it('GFM Alert 渲染为 Callout，四类', () => {
    for (const t of ['NOTE', 'TIP', 'WARNING', 'CAUTION']) {
      const c = html(`> [!${t}]\n> body ${t}`);
      const el = c.querySelector(`.wiz-md-callout--${t.toLowerCase()}`);
      expect(el).not.toBeNull();
      expect(el!.textContent).toContain(`body ${t}`);
      expect(el!.textContent).not.toContain('[!');
    }
  });
  it('普通引用块不变成 Callout', () => {
    const c = html('> plain quote');
    expect(c.querySelector('.wiz-md-blockquote')).not.toBeNull();
    expect(c.querySelector('.wiz-md-callout')).toBeNull();
  });
  it('不渲染原始 HTML：script/iframe/事件属性不进 DOM', () => {
    const c = html('<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\n<iframe src="//evil"></iframe>\n\n<b>bold</b>');
    expect(c.querySelector('script,iframe,b')).toBeNull();
    expect(c.querySelector('[onerror]')).toBeNull();
  });
  it('危险链接协议被清除；http 链接新窗口 + noopener', () => {
    const c = html('[x](javascript:alert(1)) [y](https://example.com)');
    const as = c.querySelectorAll('a');
    expect(as[0].getAttribute('href') ?? '').not.toMatch(/^javascript:/i);
    expect(as[1]).toHaveAttribute('target', '_blank');
    expect(as[1]).toHaveAttribute('rel', 'noopener noreferrer');
  });
  it('图片 data: 地址被丢弃', () => {
    const c = html('![a](data:text/html;base64,AAAA)');
    expect(c.querySelector('img')).toBeNull();
  });
  it('表格：横向滚动容器，右对齐列', () => {
    const c = html('| a | b |\n|:--|--:|\n| 1 | 2 |');
    expect(c.querySelector('.wiz-md-table table')).not.toBeNull();
    const td = c.querySelectorAll('td')[1];
    expect(td.getAttribute('align') === 'right' || td.getAttribute('style')?.includes('right')).toBe(true);
  });
  it('任务列表：勾选与未勾选', () => {
    const c = html('- [x] done\n- [ ] todo');
    expect(c.querySelectorAll('.wiz-md-task')).toHaveLength(2);
    expect(c.querySelectorAll('.wiz-md-task--checked')).toHaveLength(1);
    expect(c.querySelectorAll('[role=checkbox][aria-checked=true]')).toHaveLength(1);
  });
  it('行内代码与围栏代码块区分；无语言显示 Code', () => {
    const c = html('use `x` here\n\n```\nplain\n```');
    expect(c.querySelectorAll('.wiz-md-inline-code')).toHaveLength(1);
    expect(c.querySelector('.wiz-md-code__lang')).toHaveTextContent('Code');
    expect(c.querySelector('.wiz-md-code__body')).toHaveTextContent('plain');
  });
  it('脚注：引用与脚注区', () => {
    const c = html('text[^1]\n\n[^1]: the note');
    expect(c.querySelector('.wiz-md-citation')).not.toBeNull();
    expect(c.querySelector('.wiz-md-footnotes')).toHaveTextContent('the note');
  });
});

describe('CodeBlock', () => {
  it('SAS 高亮、非 SAS 纯文本', () => {
    const { container, rerender } = render(<MarkdownCodeBlock language="sas" code={'proc sql;\n  /* c */ select 1 from "x";'} />);
    expect(container.querySelector('.wiz-md-tok--keyword')).not.toBeNull();
    expect(container.querySelector('.wiz-md-tok--comment')).not.toBeNull();
    expect(container.querySelector('.wiz-md-tok--string')).not.toBeNull();
    expect(container.querySelector('.wiz-md-tok--number')).not.toBeNull();
    rerender(<MarkdownCodeBlock language="python" code="select 1" />);
    expect(container.querySelector('.wiz-md-tok')).toBeNull();
  });
  it('Copy → Copied，并写入剪贴板', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<MarkdownCodeBlock language="json" code="{}" />);
    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(await screen.findByText('Copied')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith('{}');
  });
  it('受控 copyState 与 showHeader', () => {
    const { container, rerender } = render(<MarkdownCodeBlock code="a" copyState="copied" />);
    expect(screen.getByText('Copied')).toBeInTheDocument();
    rerender(<MarkdownCodeBlock code="a" showHeader={false} />);
    expect(container.querySelector('.wiz-md-code__header')).toBeNull();
  });
  it('tokenizeSas：宏与参数名', () => {
    const t = tokenizeSas('%macro x; cols');
    expect(t.map((x) => x.type)).toEqual(['function', null, 'variable']);
  });
});

describe('Image', () => {
  it('loading / error 占位与图注', () => {
    const { container, rerender } = render(<MarkdownImage src="a.png" caption="Figure 1" state="loading" />);
    expect(screen.getByText('Loading image…')).toBeInTheDocument();
    expect(screen.getByText('Figure 1')).toBeInTheDocument();
    rerender(<MarkdownImage src="a.png" state="error" />);
    expect(screen.getByText('Image could not be loaded')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
  it('真实加载：onError 切到 error，onLoad 切到 loaded', () => {
    const { container } = render(<MarkdownImage src="a.png" />);
    const img = container.querySelector('img')!;
    expect(img).toHaveAttribute('hidden');
    fireEvent.load(img);
    expect(container.querySelector('img')).not.toHaveAttribute('hidden');
    expect(container.querySelector('.wiz-md-image__placeholder')).toBeNull();
  });
});
