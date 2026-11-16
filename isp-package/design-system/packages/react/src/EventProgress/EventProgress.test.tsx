import { render, screen } from '@testing-library/react';
import { EventProgress, type EventProgressItem } from './EventProgress';

const items: EventProgressItem[] = [
  { status: 'done', label: 'Table 14.1.1' }, { status: 'running', label: 'Table 14.1.2' }, { status: 'queued', label: 'Table 14.2.1' },
];
describe('EventProgress', () => {
  it('计数为已完成/总数；有进行中项时转圈', () => {
    const { container } = render(<EventProgress items={items} />);
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByText('Event Progress')).toBeInTheDocument();
    expect(container.querySelector('.wiz-addon__spinner')).not.toBeNull();
  });
  it('展开后每行是 LabelStatus；默认最大高度 180；无进行中不转圈', () => {
    const { container } = render(<EventProgress items={[items[0]]} defaultExpanded />);
    expect(container.querySelectorAll('.wiz-label-status--done')).toHaveLength(1);
    expect(container.querySelector('.wiz-addon__body')).toHaveStyle({ maxHeight: '180px' });
    expect(container.querySelector('.wiz-addon__spinner')).toBeNull();
  });
});
