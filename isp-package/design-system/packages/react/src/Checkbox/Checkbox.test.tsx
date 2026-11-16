import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Checkbox } from './Checkbox';
import { Radio } from '../Radio/Radio';
import { Switch } from '../Switch/Switch';
import { Chip } from '../Chip/Chip';

describe('Checkbox / Radio / Switch / Chip', () => {
  it('Checkbox 非受控切换并回调 checked', () => {
    const onChange = vi.fn();
    render(<Checkbox label="A" onChange={onChange} />);
    const c = screen.getByRole('checkbox', { name: 'A' });
    fireEvent.click(c);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(c).toBeChecked();
  });
  it('Checkbox indeterminate 为 mixed；disabled 不触发', () => {
    const onChange = vi.fn();
    render(<Checkbox state="indeterminate" disabled onChange={onChange} aria-label="m" />);
    const c = screen.getByRole('checkbox');
    expect(c).toHaveAttribute('aria-checked', 'mixed');
    fireEvent.click(c);
    expect(onChange).not.toHaveBeenCalled();
  });
  it('Radio 选中并回调', () => {
    const onChange = vi.fn();
    render(<Radio label="R" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'R' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('radio')).toBeChecked();
  });
  it('Switch 受控 / 非受控与尺寸类', () => {
    const onChange = vi.fn();
    render(<Switch size="large" label="S" onChange={onChange} />);
    const s = screen.getByRole('switch');
    expect(s).toHaveClass('wiz-switch--large');
    fireEvent.click(s);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(s).toHaveAttribute('aria-checked', 'true');
  });
  it('Chip 关闭回调', () => {
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove}>Tag</Chip>);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemove).toHaveBeenCalled();
  });
});
