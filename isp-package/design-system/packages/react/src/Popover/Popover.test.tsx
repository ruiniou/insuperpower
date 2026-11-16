import { render, screen } from '@testing-library/react';
import { Popover } from './Popover';

describe('Popover', () => {
  it('头 / 体 / 脚插槽与宽度', () => {
    render(<Popover title="Gen" extra={<b>Badge</b>} footer={<button>OK</button>} width={280}>body</Popover>);
    const d = screen.getByRole('dialog', { name: 'Gen' });
    expect(d).toHaveStyle({ width: '280px' });
    expect(screen.getByText('Badge')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
  });
  it('箭头方向与偏移', () => {
    const { container, rerender } = render(<Popover arrow="up" arrowOffset={40}>x</Popover>);
    const t = () => container.querySelector('.wiz-popover__tail') as HTMLElement | null;
    expect(t()).not.toHaveClass('is-down');
    expect(t()!.style.left).toBe('35px');
    rerender(<Popover arrow="down">x</Popover>);
    expect(t()).toHaveClass('is-down');
    rerender(<Popover arrow="none">x</Popover>);
    expect(t()).toBeNull();
  });
  it('confirm 默认宽 320 且无头', () => {
    render(<Popover variant="confirm" title="ignored">sure?</Popover>);
    expect(screen.getByRole('dialog')).toHaveStyle({ width: '320px' });
    expect(document.querySelector('.wiz-popover__head')).toBeNull();
  });
});
