import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from './Tabs';

describe('Tabs', () => {
  it('非受控：点击切换并触发 onChange', () => {
    const fn = vi.fn();
    render(<Tabs items={['A', 'B', 'C']} onChange={fn} />);
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'B' }));
    expect(fn).toHaveBeenCalledWith('B');
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
  });
  it('受控 + 方向键跳过禁用项', () => {
    const fn = vi.fn();
    render(<Tabs value="A" items={[{ value: 'A', label: 'A' }, { value: 'B', label: 'B', disabled: true }, { value: 'C', label: 'C' }]} onChange={fn} />);
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(fn).toHaveBeenCalledWith('C');
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('aria-selected', 'true');
  });
  it('旧包 variant 别名映射（pill → style-b）', () => {
    const { container } = render(<Tabs variant="pill" items={['A']} />);
    expect(container.firstChild).toHaveClass('wiz-tabs--style-b');
  });
  it('underline 为独立变体，选中项带 is-selected', () => {
    const { container } = render(<Tabs variant="underline" items={['A', 'B']} value="B" />);
    expect(container.firstChild).toHaveClass('wiz-tabs--underline');
    expect(screen.getByRole('tab', { name: 'B' })).toHaveClass('wiz-tab--underline', 'is-selected');
  });
});
