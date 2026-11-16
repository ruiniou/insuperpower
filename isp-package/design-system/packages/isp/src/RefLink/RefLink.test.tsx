import { fireEvent, render, screen } from '@testing-library/react';
import { RefLink } from './RefLink';

describe('RefLink', () => {
  it('点击回调，默认带外链图标', () => {
    const fn = vi.fn();
    const { container } = render(<RefLink onClick={fn}>SAP v2</RefLink>);
    fireEvent.click(screen.getByRole('button', { name: 'SAP v2' }));
    expect(fn).toHaveBeenCalled();
    expect(container.querySelector('i.ri-external-link-line')).not.toBeNull();
  });
  it('icon=null 不显示图标', () => {
    const { container } = render(<RefLink icon={null}>x</RefLink>);
    expect(container.querySelector('i')).toBeNull();
  });
});
