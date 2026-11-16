import { render, screen } from '@testing-library/react';
import { LabelStatus, type LabelStatusValue } from './LabelStatus';

const all: LabelStatusValue[] = ['normal', 'running', 'queued', 'blocked', 'failed', 'skipped', 'interrupted', 'done'];

describe('LabelStatus', () => {
  it('默认 normal 并渲染文字', () => {
    const { container } = render(<LabelStatus>Table 14.1.1</LabelStatus>);
    expect(screen.getByText('Table 14.1.1')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('wiz-label-status--normal');
  });
  it.each(all)('%s 变体有对应 class', (s) => {
    const { container } = render(<LabelStatus status={s}>x</LabelStatus>);
    expect(container.firstChild).toHaveClass(`wiz-label-status--${s}`);
  });
  it('skipped 用短横线，其余用 ri 图标', () => {
    const a = render(<LabelStatus status="skipped">x</LabelStatus>).container;
    expect(a.querySelector('.wiz-label-status__dash')).not.toBeNull();
    expect(a.querySelector('i')).toBeNull();
    const b = render(<LabelStatus status="done">x</LabelStatus>).container;
    expect(b.querySelector('i.ri-check-line')).not.toBeNull();
  });
});

describe('LabelStatus 副文字与右侧操作', () => {
  it('渲染 description 与 trailing', () => {
    render(<LabelStatus status="failed" description="Missing AGE" trailing={<button>Retry</button>}>T</LabelStatus>);
    expect(screen.getByText('Missing AGE')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});
