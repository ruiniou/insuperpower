import { fireEvent, render, screen } from '@testing-library/react';
import { PromptShortcut } from './PromptShortcut';

describe('PromptShortcut', () => {
  it('默认单行，可点击', () => {
    const onClick = vi.fn();
    const { container } = render(<PromptShortcut onClick={onClick}>Make an App</PromptShortcut>);
    fireEvent.click(screen.getByRole('button', { name: 'Make an App' }));
    expect(onClick).toHaveBeenCalled();
    expect(container.querySelector('.wiz-shortcut__desc')).toBeNull();
  });
  it('With Description：显示副文字', () => {
    render(<PromptShortcut description="One click">Make an App</PromptShortcut>);
    expect(screen.getByText('One click')).toBeInTheDocument();
  });
  it('disable：不可点；hover 强制态有 class；showIcon=false 无图标', () => {
    const onClick = vi.fn();
    const { rerender, container } = render(<PromptShortcut status="disable" onClick={onClick}>A</PromptShortcut>);
    expect(screen.getByRole('button')).toBeDisabled();
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
    rerender(<PromptShortcut status="hover" showIcon={false}>A</PromptShortcut>);
    expect(container.firstChild).toHaveClass('is-hover');
    expect(container.querySelector('.wiz-shortcut__icon')).toBeNull();
  });
});
