import { fireEvent, render, screen } from '@testing-library/react';
import { EdgeButton } from './EdgeButton';

describe('EdgeButton', () => {
  it('locked 无图标，其余按状态出图标', () => {
    const a = render(<EdgeButton state="locked" aria-label="Workflow: Generate TOC" />);
    expect(a.container.querySelector('i')).toBeNull();
    const b = render(<EdgeButton state="ready" aria-label="Workflow: Generate Shell" />);
    expect(b.container.querySelector('i.ri-play-fill')).not.toBeNull();
    const c = render(<EdgeButton state="stale" aria-label="x" />);
    expect(c.container.querySelector('i.ri-restart-line')).not.toBeNull();
  });
  it('selected 加选中环并标 aria-expanded；点击回调', () => {
    const fn = vi.fn();
    render(<EdgeButton state="review" selected aria-label="Workflow: Prod Code" onClick={fn} />);
    const b = screen.getByRole('button', { name: 'Workflow: Prod Code' });
    expect(b).toHaveClass('is-selected');
    expect(b).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(b);
    expect(fn).toHaveBeenCalled();
  });
});
