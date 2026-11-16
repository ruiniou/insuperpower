import { render, screen } from '@testing-library/react';
import { ChatStream, type ChatMessage } from './ChatStream';

const all: ChatMessage[] = [
  { id: '1', type: 'user', props: { content: 'hello user' } },
  { id: '2', type: 'assistant-text', props: { children: 'hello **ai**' } },
  { id: '3', type: 'thinking-status', props: { status: 'loading' } },
  { id: '4', type: 'tool-call', props: { toolName: 'Run SAS' } },
  { id: '5', type: 'image-render', props: { state: 'complete' } },
  { id: '6', type: 'diff', props: { lines: [{ type: 'add', line: 1, text: 'x' }] } },
  { id: '7', type: 'ask-user', props: { question: 'Which?', options: ['A1', 'B1'] } },
  { id: '8', type: 'scope-card', props: { items: [{ title: 'T1' }] } },
  { id: '9', type: 'progress-card', props: { items: [{ status: 'running', title: 'P1' }] } },
  { id: '10', type: 'summary-card', props: { items: [{ status: 'done', title: 'S1' }] } },
  { id: '11', type: 'error', props: { title: 'Boom' } },
  { id: '12', type: 'risk-summary', props: { items: [{ level: 'attention', title: 'R1' }] } },
];

describe('ChatStream', () => {
  it('12 种消息类型都能渲染', () => {
    render(<ChatStream messages={all} />);
    for (const t of ['hello user', 'ai', 'Thinking…', 'Run SAS', 'V1.0', 'Edited code', 'Which?', 'T1', 'P1', 'S1', 'Error: Boom', 'Risk Summary']) {
      expect(screen.getAllByText(t).length).toBeGreaterThan(0);
    }
  });
  it('用户消息靠右缩进，AI 回复另一侧缩进', () => {
    const { container } = render(<ChatStream messages={all.slice(0, 2)} />);
    expect(container.querySelector('.wiz-chat-stream__item--user')).not.toBeNull();
    expect(container.querySelector('.wiz-chat-stream__item--ai')).not.toBeNull();
  });
  it('footer 插槽在滚动区之外', () => {
    const { container } = render(<ChatStream messages={[]} footer={<input aria-label="f" />} />);
    expect(container.querySelector('.wiz-chat-stream__footer')).toContainElement(screen.getByLabelText('f'));
    expect(container.querySelector('.wiz-chat-stream__scroll')).not.toContainElement(screen.getByLabelText('f'));
  });
  it('新消息时滚到底部；用户上滑后不强制', () => {
    const { container, rerender } = render(<ChatStream messages={all.slice(0, 2)} />);
    const el = container.querySelector('.wiz-chat-stream__scroll') as HTMLElement;
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: 400 });
    rerender(<ChatStream messages={all.slice(0, 3)} />);
    expect(el.scrollTop).toBe(1000);
    // 用户上滑
    el.scrollTop = 100;
    el.dispatchEvent(new Event('scroll'));
    rerender(<ChatStream messages={all.slice(0, 4)} />);
    expect(el.scrollTop).toBe(100);
    // 用户自己发送新消息：强制回底
    rerender(<ChatStream messages={[...all.slice(0, 4), { id: 'u2', type: 'user', props: { content: 'more' } }]} />);
    expect(el.scrollTop).toBe(1000);
  });
});
