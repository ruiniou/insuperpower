import { fireEvent, render, screen } from '@testing-library/react';
import { AIAskUser } from './AIAskUser';

const base = { question: 'What?', options: ['One', 'Two', 'Three'] };

describe('AIAskUser', () => {
  it('none：字母 A–D、主按钮 Continue 且不可点', () => {
    render(<AIAskUser {...base} />);
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });
  it('2 of 2：主按钮为 Submit', () => {
    render(<AIAskUser {...base} step="2 of 2" state="option-selected" />);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });
  it('option-selected 选中对应下标；custom-selected 选中最后一项', () => {
    const { rerender } = render(<AIAskUser {...base} state="option-selected" selectedIndex={1} />);
    expect(screen.getAllByRole('option').map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false', 'false']);
    rerender(<AIAskUser {...base} state="custom-selected" />);
    expect(screen.getAllByRole('option')[3]).toHaveAttribute('aria-selected', 'true');
  });
  it('回调：选项、Skip、翻页', () => {
    const onSelectOption = vi.fn(); const onSkip = vi.fn(); const onNext = vi.fn();
    render(<AIAskUser {...base} onSelectOption={onSelectOption} onSkip={onSkip} onNext={onNext} />);
    fireEvent.click(screen.getByText('Two'));
    fireEvent.click(screen.getByText('Skip'));
    fireEvent.click(screen.getByLabelText('Next'));
    expect(onSelectOption).toHaveBeenCalledWith(1);
    expect(onSkip).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
  });
});
