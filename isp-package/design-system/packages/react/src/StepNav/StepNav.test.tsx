import { fireEvent, render, screen } from '@testing-library/react';
import { StepNav } from './StepNav';

const items = [
  { value: 'toc', label: 'TOC', icon: 'ri-list-check-2', locked: true },
  { value: 'shell', label: 'Shell', icon: 'ri-table-line' },
  { value: 'code', label: 'Code', icon: 'ri-code-s-slash-line', disabled: true },
];

describe('StepNav', () => {
  it('当前步骤 aria-current="step"，其余没有；已锁定步骤带锁标记', () => {
    render(<StepNav items={items} value="shell" aria-label="Review steps" />);
    expect(screen.getByRole('navigation', { name: 'Review steps' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Shell/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: /TOC/ })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: /TOC/ })).toContainElement(screen.getByRole('img', { name: 'Locked' }));
    expect(screen.getAllByRole('img', { name: 'Locked' })).toHaveLength(1);
  });
  it('点击触发 onChange；disabled 步骤不触发', () => {
    const onChange = vi.fn();
    render(<StepNav items={items} value="toc" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Shell/ }));
    expect(onChange).toHaveBeenCalledWith('shell');
    fireEvent.click(screen.getByRole('button', { name: /Code/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
  it('步骤间有 → 分隔且对读屏隐藏', () => {
    const { container } = render(<StepNav items={items} value="toc" />);
    const arrows = container.querySelectorAll('.wiz-stepnav__arrow');
    expect(arrows).toHaveLength(2);
    expect(arrows[0]).toHaveAttribute('aria-hidden', 'true');
  });
});
