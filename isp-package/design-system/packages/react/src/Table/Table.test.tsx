import { render, screen, fireEvent, within } from '@testing-library/react';
import { Table } from './Table';
import { Steps } from '../Steps/Steps';
import { Status } from '../Status/Status';
import { ListItem, TreeList } from '../List/List';
import { Splitter } from '../Splitter/Splitter';

const columns = [{ key: 'n', header: 'Name', sortable: true, filterable: true }];
const rows = [{ n: 'b' }, { n: 'a' }, { n: 'c' }];
const names = () => screen.getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell').pop()!.textContent);

describe('Table', () => {
  it('排序 none → asc → desc', () => {
    render(<Table columns={columns} rows={rows} />);
    const btn = screen.getByRole('button', { name: 'Sort Name' });
    fireEvent.click(btn); expect(names()).toEqual(['a', 'b', 'c']);
    fireEvent.click(btn); expect(names()).toEqual(['c', 'b', 'a']);
    fireEvent.click(btn); expect(names()).toEqual(['b', 'a', 'c']);
  });
  it('筛选', () => {
    render(<Table columns={columns} rows={rows} />);
    fireEvent.click(screen.getByRole('button', { name: 'Filter Name' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'a' }));
    expect(names()).toEqual(['a']);
  });
  it('勾选与分页', () => {
    const fn = vi.fn();
    render(<Table columns={columns} rows={rows} selectable paginated pageSize={2} onSelectionChange={fn} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
    expect(fn).toHaveBeenCalled();
    expect(screen.getByText('1–2 of 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('3–3 of 3')).toBeInTheDocument();
  });
});

describe('Table 跳页', () => {
  it('点省略号输入页码，回车跳转，超界取边界', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ ...rows[0], id: 'r' + i }));
    render(<Table columns={columns} rows={many} paginated jumpToPage pageSize={1} pageSizeOptions={[1]} />);
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getAllByRole('button', { name: 'Go to page' })[0]);
    const input = screen.getByRole('spinbutton', { name: 'Page number' });
    fireEvent.change(input, { target: { value: '99' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Total 30')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 30' })).toHaveAttribute('aria-current', 'page');
  });
});
