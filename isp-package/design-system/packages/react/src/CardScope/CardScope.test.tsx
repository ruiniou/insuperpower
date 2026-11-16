import { fireEvent, render, screen } from '@testing-library/react';
import { CardScope } from './CardScope';

const scopeItems = [
  { title: 'T1', description: 'D1' },
  { title: 'T2', description: 'D2', tag: 'blocked' as const },
  { title: 'T3', description: 'D3', selected: false },
];

describe('CardScope · scope', () => {
  it('pending：计数角标、Blocked 标签、Cancel/Confirm 回调', () => {
    const onCancel = vi.fn(); const onConfirm = vi.fn();
    render(<CardScope items={scopeItems} onCancel={onCancel} onConfirm={onConfirm} />);
    expect(screen.getByText('Affected TFLs')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Unselected')).toHaveLength(1);
    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.click(screen.getByText('Confirm'));
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalled();
  });
  it('confirmed：Applied、无底栏', () => {
    const { container } = render(<CardScope state="confirmed" items={scopeItems} />);
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(container.querySelector('.wiz-card-scope__footer')).toBeNull();
  });
  it('cancelled：Cancelled 与 Selection cancelled', () => {
    render(<CardScope state="cancelled" items={scopeItems} />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('Selection cancelled')).toBeInTheDocument();
  });
});

describe('CardScope · progress', () => {
  const items = [{ status: 'done' as const, title: 'a' }, { status: 'running' as const, title: 'b' }, { status: 'queued' as const, title: 'c' }];
  it('running：默认标题与进度文字', () => {
    render(<CardScope type="progress" items={items} />);
    expect(screen.getByText('Applying Updates')).toBeInTheDocument();
    expect(screen.getByText('1 of 3 completed')).toBeInTheDocument();
  });
  it('completed：All Updates Applied、3 of 3', () => {
    render(<CardScope type="progress" state="completed" items={items.map((i) => ({ ...i, status: 'done' as const }))} />);
    expect(screen.getByText('All Updates Applied')).toBeInTheDocument();
    expect(screen.getByText('3 of 3 completed')).toBeInTheDocument();
  });
});

describe('CardScope · summary', () => {
  it('默认标题；失败行带 Retry 回调', () => {
    const onAction = vi.fn();
    render(<CardScope type="summary" items={[{ status: 'failed', title: 'x', description: 'Missing', actionLabel: 'Retry', onAction }]} />);
    expect(screen.getByText('Update Summary')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(onAction).toHaveBeenCalled();
  });
});
