import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('默认 secondary / medium，点击触发回调', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Cancel</Button>);
    const b = screen.getByRole('button', { name: 'Cancel' });
    expect(b).toHaveClass('wiz-button--secondary', 'wiz-button--medium');
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('disable：不可点、带 is-disabled', () => {
    const onClick = vi.fn();
    render(<Button variant="primary" status="disable" onClick={onClick}>Go</Button>);
    const b = screen.getByRole('button');
    expect(b).toBeDisabled();
    expect(b).toHaveClass('is-disabled');
    fireEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
  });
  it('loading：左图标换成转圈、aria-busy、不可点', () => {
    const { container } = render(<Button variant="primary" status="loading" leftIcon="ri-add-line">Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('i.ri-loader-4-line')).not.toBeNull();
    expect(container.querySelector('i.ri-add-line')).toBeNull();
  });
  it('danger 两种样式、link 无尺寸 class', () => {
    const a = render(<Button variant="danger" dangerStyle="solid">x</Button>).container.firstChild;
    expect(a).toHaveClass('wiz-button--danger-solid');
    const b = render(<Button variant="link">x</Button>).container.firstChild;
    expect(b).not.toHaveClass('wiz-button--medium');
  });
  it('hover 状态强制悬停 class；左右图标渲染', () => {
    const { container } = render(<Button status="hover" leftIcon="ri-add-line" rightIcon="ri-arrow-down-s-line">x</Button>);
    expect(container.firstChild).toHaveClass('is-hover');
    expect(container.querySelectorAll('i')).toHaveLength(2);
  });
});
