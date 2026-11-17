import { render, screen } from '@testing-library/react';
import { PanelHead } from './PanelHead';

describe('PanelHead', () => {
  it('图标带 iconLabel 时可被读屏识别；标题、状态文字、右侧操作按序渲染', () => {
    render(<PanelHead icon="ri-file-text-line" iconLabel="SAP_v1.docx" title="§4.2.3 Demographics" meta="0 / 4 Reviewed" actions={<button>Act</button>} />);
    expect(screen.getByRole('img', { name: 'SAP_v1.docx' })).toBeInTheDocument();
    expect(screen.getByText('0 / 4 Reviewed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Act' })).toBeInTheDocument();
  });
  it('没有 iconLabel 的图标对读屏隐藏；没有标题和状态时不渲染对应节点', () => {
    const { container } = render(<PanelHead icon="ri-code-s-slash-line" />);
    expect(container.querySelector('.wiz-panelhead__icon')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.wiz-panelhead__title')).toBeNull();
    expect(container.querySelector('.wiz-panelhead__meta')).toBeNull();
    expect(container.querySelector('.wiz-panelhead__toolbar')).toBeNull();
  });
  it('toolbar 渲染为第二行', () => {
    const { container } = render(<PanelHead title="Shell" toolbar={<span>tools</span>} />);
    expect(container.querySelector('.wiz-panelhead__toolbar')).toHaveTextContent('tools');
  });
});
