import { render, screen } from '@testing-library/react';
import { AIAskOption } from './AIAskOption';

describe('AIAskOption', () => {
  it('selection 默认：字母与文字，aria-selected=false', () => {
    render(<AIAskOption letter="A">Planning</AIAskOption>);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'false');
  });
  it('selected：aria-selected=true 且有 class', () => {
    render(<AIAskOption letter="A" state="selected">x</AIAskOption>);
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option')).toHaveClass('wiz-ai-ask-option--selected');
  });
  it('custom：默认占位文案', () => {
    render(<AIAskOption letter="D" type="custom" />);
    expect(screen.getByText('Or, describe your needs…')).toBeInTheDocument();
  });
});
