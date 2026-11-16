import { render, screen } from '@testing-library/react';
import { AIRiskSummary } from './AIRiskSummary';

const items = [
  { level: 'attention' as const, title: 'A', detail: 'da' },
  { level: 'reference' as const, title: 'B' },
];
describe('AIRiskSummary', () => {
  it('头部显示标题与计数', () => {
    render(<AIRiskSummary items={items} />);
    expect(screen.getByText('Risk Summary')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
  it('attention 与 reference 使用不同图标', () => {
    const { container } = render(<AIRiskSummary items={items} />);
    expect(container.querySelectorAll('.wiz-risk__item .ri-alert-line')).toHaveLength(1);
    expect(container.querySelectorAll('.wiz-risk__item .ri-information-line')).toHaveLength(1);
  });
  it('detail 可选；renderText 生效', () => {
    render(<AIRiskSummary items={items} renderText={(s) => <b>{s}</b>} />);
    expect(screen.getByText('da').tagName).toBe('B');
  });
});
