import { fireEvent, render, screen } from '@testing-library/react';
import { PipelinePill, PipelineNote } from './PipelinePill';

describe('PipelinePill', () => {
  it('显示名称与计数，点击触发回调', () => {
    const fn = vi.fn();
    render(<PipelinePill state="locked" name="TOC" count="24/24" onClick={fn} aria-label="TOC, Locked v2" />);
    const b = screen.getByRole('button', { name: 'TOC, Locked v2' });
    expect(b).toHaveClass('wiz-isp-pill--locked');
    expect(b).toHaveTextContent('24/24');
    fireEvent.click(b);
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('count 为空不渲染计数', () => {
    const { container } = render(<PipelinePill state="todo" name="Package" count="" />);
    expect(container.querySelector('.wiz-isp-pill__count')).toBeNull();
  });
  it('PipelineNote 渲染文字', () => {
    render(<PipelineNote>Shell v2 available</PipelineNote>);
    expect(screen.getByText('Shell v2 available')).toBeInTheDocument();
  });
});
