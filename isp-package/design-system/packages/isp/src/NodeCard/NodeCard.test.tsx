import { fireEvent, render, screen } from '@testing-library/react';
import { NodeCard, NodeCardBody, NodeCardRow, NodeCardNote, NodeCardFooter } from './NodeCard';

describe('NodeCard', () => {
  it('标题行显示名称与 Caption，点击收起', () => {
    const fn = vi.fn();
    render(
      <NodeCard state="locked" title="TOC" caption="Locked v2" onCollapse={fn}>
        <NodeCardNote>SAP v3 available</NodeCardNote>
        <NodeCardBody><NodeCardRow label="Source">SAP v2</NodeCardRow></NodeCardBody>
        <NodeCardFooter><button>Open file</button></NodeCardFooter>
      </NodeCard>,
    );
    expect(screen.getByText('Locked v2')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('SAP v3 available')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse TOC' }));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
