import { fireEvent, render, screen } from '@testing-library/react';
import { AddOn } from './AddOn';

describe('AddOn', () => {
  it('Collapsed 默认不渲染内容；点头部展开并回调', () => {
    const onExpandedChange = vi.fn();
    render(<AddOn title="3 Tasks" count="1/3" onExpandedChange={onExpandedChange}><div>body</div></AddOn>);
    expect(screen.queryByText('body')).toBeNull();
    fireEvent.click(screen.getByText('3 Tasks'));
    expect(screen.getByText('body')).toBeInTheDocument();
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: /3 Tasks/ })).toHaveAttribute('aria-expanded', 'true');
  });
  it('受控 expanded；maxBodyHeight 写入 max-height', () => {
    const { container } = render(<AddOn title="T" expanded maxBodyHeight={200}><div>x</div></AddOn>);
    expect(container.querySelector('.wiz-addon__body')).toHaveStyle({ maxHeight: '200px' });
  });
  it('actions 点击不触发展开', () => {
    const onClick = vi.fn();
    render(<AddOn title="T" actions={<button onClick={onClick}>Act</button>}><div>x</div></AddOn>);
    fireEvent.click(screen.getByText('Act'));
    expect(onClick).toHaveBeenCalled();
    expect(screen.queryByText('x')).toBeNull();
  });
  it('input 叠放；loading 显示转圈', () => {
    const { container } = render(<AddOn title="T" loading input={<div data-testid="in" />} />);
    expect(screen.getByTestId('in').parentElement).toHaveClass('wiz-addon__input');
    expect(container.querySelector('.wiz-addon__spinner')).not.toBeNull();
  });
});
