import { fireEvent, render, screen } from '@testing-library/react';
import { DatasetCard, DatasetCardMore } from './DatasetCard';

describe('DatasetCard', () => {
  it('内容与点击', () => {
    const open = vi.fn();
    render(<DatasetCard name="ADSL" version="v2" description="Subject-Level" footerLeft="ADaM, 2 versions" footerRight="1 event" onOpen={open} />);
    expect(screen.getByText('ADSL')).toBeInTheDocument();
    expect(screen.getByText('ADaM, 2 versions')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(open).toHaveBeenCalled();
  });
  it('More 占位', () => {
    const { container } = render(<DatasetCardMore>+ 2 more</DatasetCardMore>);
    expect(container.firstElementChild).toHaveClass('wiz-isp-dc--more');
  });
});
