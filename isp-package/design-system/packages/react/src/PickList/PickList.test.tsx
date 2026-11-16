import { fireEvent, render, screen } from '@testing-library/react';
import { PickList } from './PickList';

const items = [{ id: 'a', label: 'Use A', cells: ['A', 'x'] }, { id: 'b', label: 'Use B', cells: ['B', 'y'] }];
describe('PickList', () => {
  it('渲染表头与行，选中行高亮并回调', () => {
    const onToggle = vi.fn();
    const { container } = render(<PickList columns={[{ header: 'Asset' }, { header: 'Version', width: '150px' }]} items={items} selected={['a']} onToggle={onToggle} />);
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(container.querySelectorAll('.wiz-picklist__row.is-on')).toHaveLength(1);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Use B' }));
    expect(onToggle).toHaveBeenCalledWith('b', true);
    expect(container.querySelector('.wiz-picklist__head')).toHaveStyle({ gridTemplateColumns: '24px minmax(0,1fr) 150px' });
  });
});
