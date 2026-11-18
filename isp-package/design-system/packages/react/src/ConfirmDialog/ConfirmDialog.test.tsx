import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

const base = { title: 'Discard Changes?', description: 'This Study has not been created yet.', confirmLabel: 'Discard Changes', cancelLabel: 'Keep Editing' };

describe('ConfirmDialog', () => {
  it('danger：安全选项是主按钮且初始聚焦，破坏性动作在其左侧；Esc / 关闭 / 取消都走 onCancel', () => {
    const onConfirm = vi.fn(); const onCancel = vi.fn();
    render(<ConfirmDialog {...base} tone="danger" onConfirm={onConfirm} onCancel={onCancel} />);
    const [first, second] = screen.getAllByRole('button').filter((b) => /Discard|Keep/.test(b.textContent ?? ''));
    expect(first).toHaveTextContent('Discard Changes');
    expect(second).toHaveTextContent('Keep Editing');
    expect(second.className).toMatch(/primary/);
    expect(document.activeElement).toBe(second);
    fireEvent.click(second); fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(2); expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(first);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
  it('default：取消在左，确认为主按钮在右', () => {
    render(<ConfirmDialog {...base} confirmLabel="Archive Study" cancelLabel="Not Now" onConfirm={() => {}} onCancel={() => {}} />);
    const [first, second] = screen.getAllByRole('button').filter((b) => /Archive|Not Now/.test(b.textContent ?? ''));
    expect(first).toHaveTextContent('Not Now'); expect(second).toHaveTextContent('Archive Study');
    expect(second.className).toMatch(/primary/);
  });
});
