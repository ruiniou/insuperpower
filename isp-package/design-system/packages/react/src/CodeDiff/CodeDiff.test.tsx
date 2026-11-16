import { fireEvent, render, screen } from '@testing-library/react';
import { CodeDiff, type CodeDiffLine } from './CodeDiff';

const lines: CodeDiffLine[] = [
  { type: 'del', line: 1, text: "'a'" },
  { type: 'add', line: 1, text: "'b'" },
  { type: 'add', line: 2, text: "'c'" },
];

describe('CodeDiff', () => {
  it('collapsed 默认：只显示头部与 +/- 计数', () => {
    const { container } = render(<CodeDiff lines={lines} />);
    expect(screen.getByText('Edited code')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByText('-1')).toBeInTheDocument();
    expect(container.querySelector('.wiz-code-diff__lines')).toBeNull();
  });
  it('expanded：渲染所有行，增删行有对应 class', () => {
    const { container } = render(<CodeDiff state="expanded" lines={lines} />);
    expect(container.querySelectorAll('.wiz-code-diff__line')).toHaveLength(3);
    expect(container.querySelectorAll('.wiz-code-diff__line--add')).toHaveLength(2);
    expect(container.querySelector('.wiz-code-diff__line--del')).not.toBeNull();
  });
  it('非受控：点头部展开，并回调 onToggle', () => {
    const onToggle = vi.fn();
    const { container } = render(<CodeDiff lines={lines} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(container.querySelector('.wiz-code-diff__lines')).not.toBeNull();
    expect(onToggle).toHaveBeenCalledWith('expanded');
  });
  it('受控：state 不变时点击只回调', () => {
    const onToggle = vi.fn();
    const { container } = render(<CodeDiff state="collapsed" lines={lines} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(container.querySelector('.wiz-code-diff__lines')).toBeNull();
    expect(onToggle).toHaveBeenCalledWith('expanded');
  });
});
