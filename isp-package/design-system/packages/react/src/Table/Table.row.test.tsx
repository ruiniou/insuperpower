import { fireEvent, render, screen } from '@testing-library/react';
import { Table } from './Table';

const rows = [{ n: 'a' }, { n: 'b' }];

describe('Table 7b-1', () => {
  it('onRowClick：整行可点，行内按钮不触发；传 row 与下标', () => {
    const fn = vi.fn();
    const columns = [{ key: 'n', header: 'N' }, { key: 'x', header: 'X', render: () => <button>in</button> }];
    render(<Table columns={columns} rows={rows} onRowClick={fn} />);
    const trs = screen.getAllByRole('row').slice(1);
    expect(trs[1]).toHaveClass('is-clickable');
    fireEvent.click(trs[1]);
    expect(fn).toHaveBeenCalledWith(rows[1], 1);
    fireEvent.click(screen.getAllByRole('button', { name: 'in' })[0]);
    expect(fn).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(trs[0], { key: 'Enter' });
    expect(fn).toHaveBeenCalledTimes(2);
  });
  it('rowHeight 写入 CSS 变量；默认 32 不写', () => {
    const { container, rerender } = render(<Table columns={[{ key: 'n', header: 'N' }]} rows={rows} rowHeight={48} />);
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--wiz-table-row-height')).toBe('48px');
    rerender(<Table columns={[{ key: 'n', header: 'N' }]} rows={rows} />);
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--wiz-table-row-height')).toBe('');
  });
  it('受控选中：以 selectedRows 为准', () => {
    const fn = vi.fn();
    const { rerender } = render(<Table columns={[{ key: 'n', header: 'N' }]} rows={rows} selectable selectedRows={[1]} onSelectionChange={fn} />);
    const boxes = () => screen.getAllByRole('checkbox', { name: 'Select row' });
    expect(boxes()[1]).toBeChecked(); expect(boxes()[0]).not.toBeChecked();
    fireEvent.click(boxes()[0]);
    expect(fn).toHaveBeenCalledWith([1, 0]);
    expect(boxes()[0]).not.toBeChecked();
    rerender(<Table columns={[{ key: 'n', header: 'N' }]} rows={rows} selectable selectedRows={[0, 1]} onSelectionChange={fn} />);
    expect(boxes()[0]).toBeChecked();
  });
  it('render 引用稳定时，重渲染不重建单元格', () => {
    const render_ = vi.fn((v: string) => <b>{v}</b>);
    const columns = [{ key: 'n', header: 'N', render: render_ }];
    const { rerender } = render(<Table columns={columns} rows={rows} />);
    expect(render_).toHaveBeenCalledTimes(2);
    rerender(<Table columns={columns} rows={rows} aria-label="again" />);
    expect(render_).toHaveBeenCalledTimes(2);
  });
  it('variant=plain 无列宽拖拽手柄', () => {
    const { container } = render(<Table columns={[{ key: 'n', header: 'N' }, { key: 'm', header: 'M' }]} rows={rows} variant="plain" />);
    expect(container.firstChild).toHaveClass('wiz-table--plain');
    expect(container.querySelector('.wiz-table__resize')).toBeNull();
  });
});
