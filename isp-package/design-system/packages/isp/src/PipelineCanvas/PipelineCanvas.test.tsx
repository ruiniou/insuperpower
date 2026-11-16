import { fireEvent, render, screen } from '@testing-library/react';
import { PipelineCanvas, PipelineLaneLabel } from './PipelineCanvas';

describe('PipelineCanvas', () => {
  it('内容区使用固定尺寸，舞台上的点击可用于关闭展开卡', () => {
    const fn = vi.fn();
    const { container } = render(<PipelineCanvas width={300} height={200} onClick={fn}><PipelineLaneLabel left={10} width={100}>Generate Shell</PipelineLaneLabel></PipelineCanvas>);
    const pipe = container.querySelector('.wiz-isp-pipe') as HTMLElement;
    expect(pipe.style.width).toBe('300px');
    expect(pipe.style.height).toBe('200px');
    fireEvent.click(screen.getByText('Generate Shell'));
    expect(fn).toHaveBeenCalled();
  });
});
