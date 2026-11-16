import { fireEvent, render, screen } from '@testing-library/react';
import { Status } from '../Status/Status';
import { Table } from './Table';

const rows = [{ n: 'a', g: 'X' }, { n: 'b', g: 'X' }, { n: 'c', g: 'Y' }];
const columns = [{ key: 'n', header: 'N' }];

describe('Table 分组 / 高亮 / 行可点', () => {
  it('groupBy 在组名变化处插入分组行并带计数', () => {
    const { container } = render(<Table columns={columns} rows={rows} groupBy={(r) => r.g} />);
    const g = container.querySelectorAll('.wiz-table__group');
    expect(g).toHaveLength(2);
    expect(g[0]).toHaveTextContent('X 2');
    expect(g[1]).toHaveTextContent('Y 1');
  });
  it('activeRow 加 is-active；rowClickable=false 的行不触发', () => {
    const fn = vi.fn();
    render(<Table columns={columns} rows={rows} onRowClick={fn} activeRow={(r) => r.n === 'b'} rowClickable={(r) => r.n !== 'c'} />);
    const trs = screen.getAllByRole('row').slice(1);
    expect(trs[1]).toHaveClass('is-active');
    expect(trs[2]).not.toHaveClass('is-clickable');
    fireEvent.click(trs[2]);
    expect(fn).not.toHaveBeenCalled();
    fireEvent.click(trs[0]);
    expect(fn).toHaveBeenCalledWith(rows[0], 0);
  });
  it('Status textCase=normal', () => {
    render(<Status textCase="normal">Latest</Status>);
    expect(screen.getByText('Latest').parentElement).toHaveClass('is-normal-case');
  });
});

describe('Table columnLayout=fixed', () => {
  it('colgroup 用列 width，无 width 的列不写宽度', () => {
    const { container } = render(<Table columnLayout="fixed" columns={[{ key: 'n', header: 'N' }, { key: 'm', header: 'M', width: 120 }]} rows={[{ n: 'a', m: 'b' }]} />);
    const cols = container.querySelectorAll('col');
    expect((cols[0] as HTMLElement).style.width).toBe('');
    expect((cols[1] as HTMLElement).style.width).toBe('120px');
    expect(container.querySelector('table')).toHaveClass('is-fixed');
  });
});
