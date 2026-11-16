import { render, screen } from '@testing-library/react';
import { AttentionRow, AttentionSection } from './AttentionRow';

describe('AttentionRow', () => {
  it('显示类型、标题、说明、按钮', () => {
    render(<AttentionRow tag="Update" tagTone="yellow" title="QC Code can use Shell v2" description="Re-runs this step only" actions={<button>Update</button>} />);
    expect(screen.getByText('Update', { selector: 'span span' })).toBeInTheDocument();
    expect(screen.getByText('QC Code can use Shell v2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });
  it('Section 为 0 条显示 All caught up.，否则渲染子行', () => {
    const a = render(<AttentionSection title="Next steps" count={0} />);
    expect(a.getByText('All caught up.')).toBeInTheDocument();
    a.unmount();
    render(<AttentionSection title="Next steps" count={1}><div>row</div></AttentionSection>);
    expect(screen.getByText('row')).toBeInTheDocument();
    expect(screen.queryByText('All caught up.')).toBeNull();
  });
});
