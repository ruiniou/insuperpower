import { fireEvent, render, screen } from '@testing-library/react';
import { Drawer, DrawerRow, DrawerSectionHead } from './Drawer';

describe('Drawer', () => {
  it('标题 / 关闭 / 默认宽 440 / 偏移', () => {
    const onClose = vi.fn();
    render(<Drawer title="A.pdf" subtitle="Versions" top={56} onClose={onClose} aria-label="Version history"><p>body</p></Drawer>);
    const d = screen.getByLabelText('Version history');
    expect(d).toHaveStyle({ width: '440px', top: '56px' });
    expect(screen.getByText('body')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
  it('键盘拖宽并夹在 320–560', () => {
    const onWidthChange = vi.fn();
    render(<Drawer title="t" onWidthChange={onWidthChange} aria-label="d">x</Drawer>);
    const sp = screen.getByRole('separator', { name: 'Resize drawer' });
    fireEvent.keyDown(sp, { key: 'ArrowLeft' });
    expect(onWidthChange).toHaveBeenLastCalledWith(456); // reverse：向左拖 = 变宽
    for (let i = 0; i < 20; i++) fireEvent.keyDown(sp, { key: 'ArrowLeft' });
    expect(screen.getByLabelText('d')).toHaveStyle({ width: '560px' });
    for (let i = 0; i < 40; i++) fireEvent.keyDown(sp, { key: 'ArrowRight' });
    expect(screen.getByLabelText('d')).toHaveStyle({ width: '320px' });
  });
  it('Esc 关闭；resizable=false 无分隔条；open=false 不渲染', () => {
    const onClose = vi.fn();
    const { rerender } = render(<Drawer title="t" resizable={false} onClose={onClose}>x</Drawer>);
    expect(screen.queryByRole('separator')).toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(<Drawer title="t" open={false}>x</Drawer>);
    expect(screen.queryByText('x')).toBeNull();
  });
  it('DrawerRow / DrawerSectionHead', () => {
    render(<><DrawerRow label="Name" action={<button>Rename</button>}>A</DrawerRow><DrawerSectionHead title="Versions" count={3} actions={<button>Up</button>} /></>);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
  });
});
