import { render, screen } from '@testing-library/react';
import { VersionRow } from './VersionRow';

describe('VersionRow', () => {
  it('Latest / Official / 引用与 behind', () => {
    const { rerender } = render(<VersionRow label="v3" latest official by="Chen Yu" date="Oct 28" note="Draft 3" usedBy={['Primary Analysis']} />);
    expect(screen.getByText('Latest')).toBeInTheDocument();
    expect(screen.getByText('Official')).toBeInTheDocument();
    expect(screen.getByText('Chen Yu, Oct 28, Draft 3')).toBeInTheDocument();
    expect(screen.getByText(/Used by: Primary Analysis/)).toBeInTheDocument();
    expect(screen.queryByText('behind')).toBeNull();
    rerender(<VersionRow label="v1" by="A" date="d" usedBy={['E1', 'E2']} behind action={<button>more</button>} />);
    expect(screen.getByText('behind')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'more' })).toBeInTheDocument();
  });
  it('无引用显示 —，且不显示 behind', () => {
    render(<VersionRow label="v1" by="A" date="d" usedBy={[]} behind />);
    expect(screen.getByText(/Used by: —/)).toBeInTheDocument();
    expect(screen.queryByText('behind')).toBeNull();
  });
});
