import { render, screen } from '@testing-library/react';
import { EventStatusBadge } from './EventStatusBadge';

describe('EventStatusBadge', () => {
  it('默认 blocked，带警告图标', () => {
    const { container } = render(<EventStatusBadge />);
    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(container.querySelector('i.ri-alert-line')).not.toBeNull();
  });
  it('skipped 无图标', () => {
    const { container } = render(<EventStatusBadge status="skipped" />);
    expect(screen.getByText('Skipped')).toHaveClass('wiz-event-status-badge--skipped');
    expect(container.querySelector('i')).toBeNull();
  });
});
