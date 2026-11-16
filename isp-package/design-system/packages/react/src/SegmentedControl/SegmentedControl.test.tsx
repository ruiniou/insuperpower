import { fireEvent, render, screen } from '@testing-library/react';
import { SegmentedControl } from './SegmentedControl';

const items = [{ value: 'list', icon: 'ri-list-check', 'aria-label': 'List' }, { value: 'card', icon: 'ri-layout-grid-line', 'aria-label': 'Cards' }, { value: 'x', label: 'X', disabled: true }];

describe('SegmentedControl', () => {
  it('默认选第一项，点击切换并回调', () => {
    const fn = vi.fn();
    render(<SegmentedControl items={items} onChange={fn} aria-label="View" />);
    expect(screen.getByRole('radio', { name: 'List' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: 'Cards' }));
    expect(fn).toHaveBeenCalledWith('card');
    expect(screen.getByRole('radio', { name: 'Cards' })).toBeChecked();
  });
  it('受控：不点击不变，value 驱动', () => {
    const { rerender } = render(<SegmentedControl items={items} value="list" />);
    fireEvent.click(screen.getByRole('radio', { name: 'Cards' }));
    expect(screen.getByRole('radio', { name: 'List' })).toBeChecked();
    rerender(<SegmentedControl items={items} value="card" />);
    expect(screen.getByRole('radio', { name: 'Cards' })).toBeChecked();
  });
  it('方向键切换并跳过禁用项', () => {
    render(<SegmentedControl items={items} defaultValue="card" />);
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Cards' }), { key: 'ArrowRight' });
    expect(screen.getByRole('radio', { name: 'List' })).toBeChecked();
  });
});
