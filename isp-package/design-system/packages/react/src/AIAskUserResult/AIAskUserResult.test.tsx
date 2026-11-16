import { render, screen } from '@testing-library/react';
import { AIAskUserResult } from './AIAskUserResult';

describe('AIAskUserResult', () => {
  it('answered：按 Q:/A: 渲染每一对', () => {
    render(<AIAskUserResult pairs={[{ question: 'Which?', answer: 'ABC' }, { question: 'Keep?', answer: 'Yes' }]} />);
    expect(screen.getByText('Q: Which?')).toBeInTheDocument();
    expect(screen.getByText('A: Yes')).toBeInTheDocument();
  });
  it('skipped：默认文案，无问答', () => {
    render(<AIAskUserResult state="skipped" pairs={[{ question: 'x', answer: 'y' }]} />);
    expect(screen.getByText('Skipped question')).toBeInTheDocument();
    expect(screen.queryByText('Q: x')).toBeNull();
  });
});
