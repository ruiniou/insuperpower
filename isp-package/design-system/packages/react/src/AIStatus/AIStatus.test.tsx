import { render, screen } from '@testing-library/react';
import { AIStatus } from './AIStatus';

describe('AIStatus', () => {
  it.each([['high', 3], ['medium', 2], ['low', 1]] as const)('text %s 点亮 %i 格', (level, n) => {
    const { container } = render(<AIStatus type="text" level={level} />);
    expect(container.querySelectorAll('.wiz-ai-status__bar.is-filled')).toHaveLength(n);
    expect(container.querySelectorAll('.wiz-ai-status__bar')).toHaveLength(3);
  });
  it('text 显示文案', () => {
    render(<AIStatus type="text" level="medium" />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });
  it.each([['>90%', '90%', 'high'], ['80%-90%', '85%', 'medium'], ['70%-80%', '75%', 'low']] as const)(
    'number %s 默认显示 %s',
    (level, v, tone) => {
      const { container } = render(<AIStatus type="number" level={level} />);
      expect(screen.getByText(v)).toHaveClass(`wiz-ai-status--${tone}`);
      expect(container.querySelector('.wiz-ai-status__bar')).toBeNull();
    },
  );
  it('number 可覆盖数值', () => {
    render(<AIStatus type="number" level=">90%" value="96%" />);
    expect(screen.getByText('96%')).toBeInTheDocument();
  });
});
