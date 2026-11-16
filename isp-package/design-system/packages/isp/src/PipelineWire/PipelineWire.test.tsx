import { render } from '@testing-library/react';
import { PipelineWire, PipelineWires } from './PipelineWire';

describe('PipelineWire', () => {
  it('按状态加修饰类，svg 隐藏于辅助技术', () => {
    const { container } = render(<PipelineWires width={100} height={50}><PipelineWire d="M 0 0 H 10" state="stale" /></PipelineWires>);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('path')).toHaveClass('wiz-isp-wire--stale');
  });
});
