import { fireEvent, render, screen } from '@testing-library/react';
import { AIImageRenderCard } from './AIImageRenderCard';

describe('AIImageRenderCard', () => {
  it('generating：文案与无图片区', () => {
    const { container } = render(<AIImageRenderCard state="generating" />);
    expect(screen.getByText('Generating Preview...')).toBeInTheDocument();
    expect(container.querySelector('.wiz-image-card__image')).toBeNull();
  });
  it('failed：文案与 Retry 回调', () => {
    const on = vi.fn();
    render(<AIImageRenderCard state="failed" onRetry={on} />);
    expect(screen.getByText('Preview generation failed')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(on).toHaveBeenCalled();
  });
  it('complete：版本与角标、占位文字', () => {
    render(<AIImageRenderCard state="complete" />);
    expect(screen.getByText('V1.0')).toBeInTheDocument();
    expect(screen.getByText('Latest')).toBeInTheDocument();
    expect(screen.getByText('AI generated figure preview')).toBeInTheDocument();
  });
  it('三个 complete 变体各有 class', () => {
    const { container, rerender } = render(<AIImageRenderCard state="complete-hover" />);
    expect(container.firstChild).toHaveClass('wiz-image-card--complete-hover');
    rerender(<AIImageRenderCard state="complete-focused" />);
    expect(container.firstChild).toHaveClass('wiz-image-card--complete-focused');
  });
  it('点击图片区默认打开全屏预览，Esc 关闭', () => {
    render(<AIImageRenderCard state="complete" />);
    fireEvent.click(screen.getByRole('button', { name: 'View V1.0' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('传入 onView 时不打开内置预览', () => {
    const on = vi.fn();
    render(<AIImageRenderCard state="complete" onView={on} />);
    fireEvent.click(screen.getByRole('button', { name: 'View V1.0' }));
    expect(on).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
