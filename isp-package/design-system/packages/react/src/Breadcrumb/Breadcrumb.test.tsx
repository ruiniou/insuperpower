import { render, screen, fireEvent } from '@testing-library/react';
import { Breadcrumb } from './Breadcrumb';
import { SideBar } from '../SideBar/SideBar';
import { Dropdown } from '../Dropdown/Dropdown';

const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];

describe('Breadcrumb', () => {
  it('末项 aria-current；点 ▾ 打开、搜索、切换；Esc 关闭', () => {
    const onSwitch = vi.fn();
    render(<Breadcrumb items={[{ label: 'Home', onClick: () => {} }, { label: 'Alpha', options, currentValue: 'a', onSwitch }]} />);
    expect(screen.getByText('Alpha', { selector: '.wiz-crumb__text' }).closest('[aria-current]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Switch Alpha' }));
    expect(screen.getByRole('menuitemradio', { name: 'Alpha' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'bet' } });
    expect(screen.queryByRole('menuitemradio', { name: 'Alpha' })).toBeNull();
    fireEvent.click(screen.getByText('Beta'));
    expect(onSwitch).toHaveBeenCalledWith('b', expect.objectContaining({ label: 'Beta' }));
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Switch Alpha' }));
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });
  it('悬停不自动打开；点名称只导航', () => {
    const onClick = vi.fn();
    render(<Breadcrumb items={[{ label: 'Home' }, { label: 'Studies', onClick, options }, { label: 'Cur' }]} />);
    fireEvent.mouseEnter(screen.getByText('Studies').closest('.wiz-crumb-mw')!);
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByText('Studies'));
    expect(onClick).toHaveBeenCalled();
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('SideBar / Dropdown', () => {
  it('SideBar：选中、分组、折叠按钮在 Logo 行，收起后不渲染', () => {
    const onSelect = vi.fn(); const onToggle = vi.fn();
    const { container, rerender } = render(<SideBar collapsible logo="ISP" onToggle={onToggle} items={[{ label: 'Home' }, { group: 'Recent events' }, { label: 'EV-1', description: 'STU-001' }]} onSelect={onSelect} />);
    expect(screen.getByText('Recent events')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /EV-1/ }));
    expect(onSelect).toHaveBeenCalledWith('EV-1');
    expect(container.querySelector('.wiz-sidebar__logo')).toContainElement(screen.getByRole('button', { name: 'Collapse navigation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Collapse navigation' }));
    expect(onToggle).toHaveBeenCalledWith(true);
    rerender(<SideBar collapsed items={[{ label: 'Home' }]} />);
    expect(container.querySelector('nav')).toBeNull();
  });
  it('Dropdown：打开、方向键、选择、Esc', () => {
    const onSelect = vi.fn();
    render(<Dropdown label="Act" items={[{ label: 'One', value: '1' }, { label: 'Two', value: '2', disabled: true }, { label: 'Three', value: '3' }]} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /Act/ }));
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    fireEvent.keyDown(screen.getAllByRole('menuitem')[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Three' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Three' }));
    expect(onSelect).toHaveBeenCalledWith('3', expect.anything());
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
