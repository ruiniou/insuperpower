import { render, screen } from '@testing-library/react';
import { LabelScope } from './LabelScope';

describe('LabelScope', () => {
  it('selected + none：勾选、无 Tag', () => {
    const { container } = render(<LabelScope title="T" description="D" />);
    expect(screen.getByLabelText('Selected')).toHaveClass('is-checked');
    expect(container.querySelector('.wiz-event-status-badge')).toBeNull();
    expect(screen.getByText('D')).toBeInTheDocument();
  });
  it('unselected + skipped：未勾选，带 Skipped', () => {
    render(<LabelScope selection="unselected" tag="skipped" title="T" />);
    expect(screen.getByLabelText('Unselected')).not.toHaveClass('is-checked');
    expect(screen.getByText('Skipped')).toBeInTheDocument();
  });
  it('selected + blocked：带 Blocked', () => {
    render(<LabelScope tag="blocked" title="T" />);
    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });
});
