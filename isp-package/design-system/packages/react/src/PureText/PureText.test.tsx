import { render, screen } from '@testing-library/react';
import { PureText } from './PureText';

describe('PureText', () => {
  it('渲染 Markdown', () => {
    render(<PureText>{'Hello **bold**'}</PureText>);
    expect(screen.getByText('bold').tagName).toBe('STRONG');
  });
  it('无内边距容器', () => {
    const { container } = render(<PureText>x</PureText>);
    expect(container.firstChild).toHaveClass('wiz-pure-text');
  });
});
