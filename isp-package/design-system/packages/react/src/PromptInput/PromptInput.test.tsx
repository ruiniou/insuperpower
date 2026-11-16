import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PromptInput, type PromptAttachment } from './PromptInput';

describe('PromptInput', () => {
  it('Default：显示默认提示，发送键禁用', () => {
    const { container } = render(<PromptInput />);
    expect(screen.getByText('Type a prompt or press')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(container.firstChild).toHaveClass('wiz-prompt--idle');
  });
  it('Filled：有内容后发送键可用，点击触发 onSend 并清空（非受控）', () => {
    const onSend = vi.fn();
    render(<PromptInput onSend={onSend} />);
    const ta = screen.getByLabelText('Prompt') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: '  hello ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSend).toHaveBeenCalledWith('hello', []);
    expect(ta.value).toBe('');
  });
  it('Enter 发送，Shift+Enter 不发送，输入法组合中不发送', () => {
    const onSend = vi.fn();
    render(<PromptInput defaultValue="hi" onSend={onSend} />);
    const ta = screen.getByLabelText('Prompt');
    fireEvent.keyDown(ta, { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(ta, { key: 'Enter', isComposing: true });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(onSend).toHaveBeenCalledTimes(1);
  });
  it('受控：不自行清空', () => {
    const onChange = vi.fn();
    render(<PromptInput value="abc" onChange={onChange} onSend={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect((screen.getByLabelText('Prompt') as HTMLTextAreaElement).value).toBe('abc');
    fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: 'abcd' } });
    expect(onChange).toHaveBeenCalledWith('abcd');
  });
  it('Running：状态条 + 停止键，点击触发 onStop', () => {
    const onStop = vi.fn();
    const { container } = render(<PromptInput running runningText="AI analysis in progress, estimated time 10 minutes" onStop={onStop} />);
    expect(container.firstChild).toHaveClass('wiz-prompt--running');
    expect(screen.queryByLabelText('Prompt')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });
  it('Stopping：恢复输入框，停止键禁用，Enter 不发送', () => {
    const onSend = vi.fn();
    render(<PromptInput stopping running defaultValue="x" onSend={onSend} />);
    expect(screen.getByRole('button', { name: 'Stopping' })).toBeDisabled();
    fireEvent.keyDown(screen.getByLabelText('Prompt'), { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
  });
  it('Disabled：只读提示、输入与入口禁用', () => {
    const { container } = render(<PromptInput disabled defaultValue="x" />);
    expect(container.firstChild).toHaveClass('wiz-prompt--disabled');
    expect(screen.getByLabelText('Prompt')).toBeDisabled();
    expect(screen.getByLabelText('Prompt')).toHaveAttribute('placeholder', 'Historical session is read-only');
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mention scope or table' })).toBeDisabled();
  });
  it('强制预览状态 hover / focused', () => {
    const { container, rerender } = render(<PromptInput previewState="hover" />);
    expect(container.firstChild).toHaveClass('is-hover');
    rerender(<PromptInput previewState="focused" />);
    expect(container.firstChild).toHaveClass('is-focused');
  });
  const atts: PromptAttachment[] = [{ id: 'a', name: 'a.png' }, { id: 'b', name: 'b.png', status: 'uploading' }];
  it('With Attachments：仅附件也可发送；上传中禁用发送；可移除', () => {
    const onRemove = vi.fn();
    const { rerender } = render(<PromptInput attachments={[atts[0]]} onRemoveAttachment={onRemove} />);
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Remove a.png' }));
    expect(onRemove).toHaveBeenCalledWith('a');
    rerender(<PromptInput attachments={atts} defaultValue="x" />);
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });
  it('附件达到上限后回形针禁用', () => {
    const five = Array.from({ length: 5 }, (_, i) => ({ id: String(i), name: `${i}.png` }));
    render(<PromptInput attachments={five} />);
    expect(screen.getByRole('button', { name: 'Maximum attachments reached' })).toBeDisabled();
  });
  it('Max Height：高度不超过 maxRows 行（8 行 = 136px）', () => {
    function Host() {
      const [v, setV] = useState('');
      return <PromptInput value={v} onChange={setV} />;
    }
    render(<Host />);
    const ta = screen.getByLabelText('Prompt') as HTMLTextAreaElement;
    Object.defineProperty(ta, 'scrollHeight', { configurable: true, get: () => 400 });
    fireEvent.change(ta, { target: { value: 'x\n'.repeat(30) } });
    expect(ta.style.height).toBe('136px');
  });
});
