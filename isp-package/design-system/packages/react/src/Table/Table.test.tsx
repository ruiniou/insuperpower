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

describe('Steps / Status / List', () => {
  it('Steps 状态推导', () => {
    const { container } = render(<Steps current={1} steps={[{ label: 'a' }, { label: 'b' }, { label: 'c' }]} />);
    expect(container.querySelectorAll('.wiz-step--completed')).toHaveLength(1);
    expect(container.querySelectorAll('.wiz-step--active')).toHaveLength(1);
    expect(container.querySelectorAll('.wiz-step--upcoming')).toHaveLength(1);
  });
  it('Status 默认配色', () => {
    const { container } = render(<Status variant="style2">x</Status>);
    expect(container.firstChild).toHaveClass('wiz-status--green');
  });
  it('TreeList 展开与选中', () => {
    const fn = vi.fn();
    render(<TreeList nodes={[{ id: 'p', label: 'P', children: [{ id: 'c', label: 'C' }] }]} onSelect={fn} />);
    expect(screen.queryByText('C')).toBeNull();
    fireEvent.click(screen.getByText('P'));
    fireEvent.click(screen.getByText('C'));
    expect(fn).toHaveBeenCalledWith('c');
  });
  it('ListItem 键盘触发', () => {
    const fn = vi.fn();
    render(<ListItem label="x" onClick={fn} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(fn).toHaveBeenCalled();
  });
});

describe('Splitter', () => {
  it('键盘步长 16，reverse 取反，带 aria 值', () => {
    const fn = vi.fn();
    render(<Splitter value={200} min={120} max={320} onResize={fn} reverse />);
    const s = screen.getByRole('separator');
    expect(s).toHaveAttribute('aria-valuenow', '200');
    fireEvent.keyDown(s, { key: 'ArrowRight' });
    expect(fn).toHaveBeenCalledWith(-16);
  });
});
