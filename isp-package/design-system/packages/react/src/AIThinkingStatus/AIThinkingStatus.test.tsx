import { render, screen } from '@testing-library/react';
import { AIThinkingStatus } from './AIThinkingStatus';

describe('AIThinkingStatus', () => {
  it('Loading 默认文案', () => {
    const { container } = render(<AIThinkingStatus />);
    expect(screen.getByText('Thinking…')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('wiz-thinking--loading');
  });
  it('Waiting 文案与样式', () => {
    const { container } = render(<AIThinkingStatus status="waiting" />);
    expect(screen.getByText('Waiting for your input…')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('wiz-thinking--waiting');
  });
  it('label 覆盖文案', () => {
    render(<AIThinkingStatus label="Running task…" />);
    expect(screen.getByText('Running task…')).toBeInTheDocument();
  });
});
