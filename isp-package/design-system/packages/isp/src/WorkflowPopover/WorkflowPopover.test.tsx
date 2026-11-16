import { fireEvent, render, screen } from '@testing-library/react';
import { WorkflowPopover } from './WorkflowPopover';

describe('WorkflowPopover', () => {
  const base = { title: 'Generate Shell', badge: 'Update available', badgeTone: 'yellow' as const, footer: <button>Update</button>, tailLeft: 40 };
  it('显示名称、状态、行；有 onOpen 的行可点', () => {
    const open = vi.fn();
    render(<WorkflowPopover {...base} placement="below" lines={[{ label: 'Inputs', text: 'TOC v2', onOpen: open }, { label: 'Output', text: 'Shell' }]} />);
    expect(screen.getByRole('dialog', { name: 'Generate Shell' })).toBeInTheDocument();
    expect(screen.getByText('Update available')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'TOC v2' }));
    expect(open).toHaveBeenCalled();
    expect(screen.getByText('Shell')).toBeInTheDocument();
  });
  it('placement=above 箭头朝下', () => {
    const { container } = render(<WorkflowPopover {...base} placement="above" lines={[]} />);
    expect(container.querySelector('.wiz-popover__tail')).toHaveClass('is-down');
  });
});
