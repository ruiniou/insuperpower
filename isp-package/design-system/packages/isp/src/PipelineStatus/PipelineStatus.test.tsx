import { render } from '@testing-library/react';
import { PipelineStatusIcon, type PipelineState } from './PipelineStatus';

describe('PipelineStatusIcon', () => {
  const states: PipelineState[] = ['locked', 'ready', 'stale', 'todo', 'running', 'review'];
  it.each(states)('%s 渲染对应修饰类且对辅助技术隐藏', (s) => {
    const { container } = render(<PipelineStatusIcon state={s} />);
    const el = container.firstElementChild!;
    expect(el).toHaveClass(`wiz-isp-sicon--${s}`);
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });
  it('running 旋转，still 时静止', () => {
    const a = render(<PipelineStatusIcon state="running" />);
    expect(a.container.firstElementChild).toHaveClass('is-spin');
    const b = render(<PipelineStatusIcon state="running" still />);
    expect(b.container.firstElementChild).not.toHaveClass('is-spin');
  });
});
