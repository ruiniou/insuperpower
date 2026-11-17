import { render, screen } from '@testing-library/react';
import { KeyValueRow } from './KeyValueRow';

describe('KeyValueRow', () => {
  it('键、值、操作按序渲染；默认键列 90、行高 44', () => {
    render(<KeyValueRow label="Population" action={<button>Why</button>} data-testid="r">FAS</KeyValueRow>);
    const r = screen.getByTestId('r');
    expect(r.style.getPropertyValue('--wiz-kv-label-width')).toBe('90px');
    expect(r.style.getPropertyValue('--wiz-kv-min-height')).toBe('44px');
    expect(r).toHaveTextContent('PopulationFASWhy');
  });
  it('键列宽、行高可配；wrap 与 divider 通过 class 暴露', () => {
    render(<KeyValueRow label="k" labelWidth={120} minHeight={32} wrap divider={false} data-testid="r">v</KeyValueRow>);
    const r = screen.getByTestId('r');
    expect(r.style.getPropertyValue('--wiz-kv-label-width')).toBe('120px');
    expect(r).toHaveClass('is-wrap', 'no-divider');
  });
  it('没有 action 时不渲染操作列节点', () => {
    const { container } = render(<KeyValueRow label="k">v</KeyValueRow>);
    expect(container.querySelector('.wiz-kv__a')).toBeNull();
  });
});
