import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('标题 / 说明 / 操作', () => {
    render(<EmptyState title="No events yet" description="Create one." action={<button>New Event</button>} />);
    expect(screen.getByRole('status')).toHaveTextContent('No events yet');
    expect(screen.getByText('Create one.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New Event' })).toBeInTheDocument();
  });
});
