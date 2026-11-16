import { render, screen } from '@testing-library/react';
import { PipelineLegend } from './PipelineLegend';

describe('PipelineLegend', () => {
  it('默认 6 项', () => {
    render(<PipelineLegend />);
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByText('Update available')).toBeInTheDocument();
  });
  it('自定义项', () => {
    render(<PipelineLegend items={[{ state: 'locked', label: 'Done' }]} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});
