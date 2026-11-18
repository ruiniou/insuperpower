import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Modal } from './Modal';
import { Message } from '../Message/Message';
import { Snackbar, SnackbarProvider, useSnackbar } from '../Snackbar/Snackbar';
import { Tooltip } from '../Tooltip/Tooltip';
import { Upload } from '../Upload/Upload';
import { IconButton } from '../IconButton/IconButton';
import { ButtonGroup } from '../ButtonGroup/ButtonGroup';
import { Divider } from '../Divider/Divider';
import { OnStatusButton } from '../OnStatusButton/OnStatusButton';
import { CloseButton } from '../CloseButton/CloseButton';

describe('Modal', () => {
  it('open=false 不渲染；open 渲染 dialog，标题关联，默认按钮', () => {
    const { rerender } = render(<Modal open={false} title="T">x</Modal>);
    expect(screen.queryByRole('dialog')).toBeNull();
    const onConfirm = vi.fn(); const onClose = vi.fn();
    rerender(<Modal title="Hello" onConfirm={onConfirm} onClose={onClose}>body</Modal>);
    expect(screen.getByRole('dialog', { name: 'Hello' })).toHaveAttribute('aria-modal', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
  it('Esc 关闭、遮罩点击关闭、焦点进入对话框并循环', () => {
    const onClose = vi.fn();
    render(<Modal title="T" onClose={onClose}>x</Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(dialog.parentElement!);
    expect(onClose).toHaveBeenCalledTimes(2);
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    confirm.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getAllByRole('button')[0]);
  });
  it('footer={null} 不显示确认栏', () => {
    render(<Modal title="T" footer={null}>x</Modal>);
    expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
  });
});

describe('Message / Snackbar', () => {
  it('Message 关闭', () => {
    const onClose = vi.fn();
    render(<Message tone="error" closable onClose={onClose}>Oops</Message>);
    expect(screen.getByRole('alert')).toHaveTextContent('Oops');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
  it('Snackbar single / detailed、操作与关闭', () => {
    const onAction = vi.fn(); const onClose = vi.fn();
    const { rerender } = render(<Snackbar type="success" title="Saved" description="ok" actionLabel="View" onAction={onAction} onClose={onClose} />);
    expect(document.querySelector('.wiz-snackbar--single.wiz-snackbar--success')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onAction).toHaveBeenCalled(); expect(onClose).toHaveBeenCalled();
    rerender(<Snackbar type="info" title="T" details={[{ text: 'a', status: 'done' }, { text: 'b', status: 'loading' }]} />);
    expect(document.querySelector('.wiz-snackbar--detailed')).not.toBeNull();
    expect(document.querySelectorAll('.wiz-snackbar__detail')).toHaveLength(2);
  });
  it('SnackbarProvider：show 后自动消失', () => {
    vi.useFakeTimers();
    function Btn() { const s = useSnackbar(); return <button onClick={() => s.show({ title: 'Hi', duration: 1000 })}>go</button>; }
    render(<SnackbarProvider><Btn /></SnackbarProvider>);
    fireEvent.click(screen.getByText('go'));
    expect(screen.getByText('Hi')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1100); });
    expect(screen.queryByText('Hi')).toBeNull();
    vi.useRealTimers();
  });
});

describe('Tooltip / Upload / 按钮', () => {
  it('Tooltip：open 强制显示，role=tooltip，aria-describedby', () => {
    render(<Tooltip content="Tip" open direction="right"><button>x</button></Tooltip>);
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('Tip');
    expect(tip).toHaveClass('wiz-tooltip--right');
    expect(screen.getByRole('button').parentElement).toHaveAttribute('aria-describedby', tip.id);
  });
  it('Tooltip：聚焦显示，Esc 关闭', () => {
    vi.useFakeTimers();
    render(<Tooltip content="Tip" delay={0}><button>x</button></Tooltip>);
    const btn = screen.getByRole('button');
    vi.spyOn(btn, 'matches').mockReturnValue(true); // 键盘聚焦（:focus-visible）
    fireEvent.focus(btn);
    act(() => { vi.advanceTimersByTime(10); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    vi.useRealTimers();
  });
  it('Upload：选择文件追加，chip 可移除，受控 files', () => {
    const onFilesChange = vi.fn();
    const { rerender } = render(<Upload files={['a.xlsx']} onFilesChange={onFilesChange} />);
    expect(screen.getByText('a.xlsx')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove a.xlsx' }));
    expect(onFilesChange).toHaveBeenCalledWith([]);
    const input = screen.getByTestId('wiz-upload-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'b.docx')] } });
    expect(onFilesChange).toHaveBeenLastCalledWith(['a.xlsx', 'b.docx']);
    rerender(<Upload files={[]} onFilesChange={onFilesChange} />);
    expect(screen.queryByText('a.xlsx')).toBeNull();
  });
  it('IconButton：变体 / 尺寸 / disable', () => {
    const onClick = vi.fn();
    const { rerender } = render(<IconButton icon="ri-add-line" aria-label="add" variant="primary" size="big" onClick={onClick} />);
    const b = screen.getByRole('button', { name: 'add' });
    expect(b).toHaveClass('wiz-icon-button--primary', 'wiz-icon-button--big', 'is-circle');
    fireEvent.click(b); expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<IconButton icon="ri-add-line" aria-label="add" status="disable" onClick={onClick} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
  it('ButtonGroup：点击回调、单选 aria-pressed', () => {
    const onChange = vi.fn();
    render(<ButtonGroup aria-label="g" value="b" onChange={onChange} items={[{ value: 'a', icon: 'ri-add-line', ariaLabel: 'A' }, { value: 'b', icon: 'ri-edit-line', ariaLabel: 'B' }]} />);
    expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'A' }));
    expect(onChange).toHaveBeenCalledWith('a');
  });
  it('Divider / OnStatusButton / CloseButton', () => {
    render(<><Divider align="left">OR</Divider><OnStatusButton status="disable">Go</OnStatusButton><CloseButton /></>);
    expect(screen.getByRole('separator')).toHaveClass('wiz-divider--left');
    expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
