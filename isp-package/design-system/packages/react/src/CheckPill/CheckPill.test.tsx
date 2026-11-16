import { fireEvent, render, screen } from '@testing-library/react';
import { CheckPill } from './CheckPill';

describe('CheckPill', () => {
  it('点击切换并回调；选中态有勾', () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<CheckPill checked={false} onChange={onChange}>Register rule</CheckPill>);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(container.querySelector('.ri-check-line')).toBeNull();
    rerender(<CheckPill checked onChange={onChange}>Register rule</CheckPill>);
    expect(container.firstElementChild).toHaveClass('is-on');
    expect(container.querySelector('.ri-check-line')).not.toBeNull();
  });
});
