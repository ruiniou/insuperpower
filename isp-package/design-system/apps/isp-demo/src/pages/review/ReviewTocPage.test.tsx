import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { rvCommit } from '../../store/actions';
import { resetReviewUi } from '../../store/review';
import { S } from '../../store/selectors';
import { getDb, resetDb, setToastHandler } from '../../store/store';
import { ReviewTocPage } from './ReviewTocPage';
import { reviewStep } from './route';

let toasts: string[] = [];
beforeEach(() => { resetDb(); resetReviewUi(); toasts = []; setToastHandler((m) => toasts.push(m)); S.event('EVT-003')!.flow.st.toc = 'review'; });
afterEach(() => { vi.useRealTimers(); });
const lockBtn = () => screen.getByRole('button', { name: /Lock \+ Approve/ });

describe('rvCommit（规则 4.5）', () => {
  it('toc 在 review：锁定，shell 为 empty 则自动 running，Workflow 更新时间刷新', () => {
    vi.useFakeTimers();
    const e = S.event('EVT-003')!;
    rvCommit(e, 'toc');
    expect(e.flow.st.toc).toBe('locked');
    expect(e.flow.st.shell).toBe('running');
    expect(toasts.at(-1)).toBe('TOC locked, Shell generation started');
  });
  it('toc 不在 review 时不动', () => {
    const e = S.event('EVT-001')!; // toc 已 locked
    rvCommit(e, 'toc');
    expect(e.flow.st.toc).toBe('locked');
    expect(toasts).toEqual([]);
  });
  it('shell 已非 empty 时只锁 toc，不重启 shell', () => {
    const e = S.event('EVT-003')!; e.flow.st.shell = 'review';
    rvCommit(e, 'toc');
    expect(e.flow.st.shell).toBe('review');
  });
});

describe('reviewStep 自动选步（规则 4.5）', () => {
  it('显式 sub 优先；否则 toc review → shell review → Code review → toc', () => {
    const e = S.event('EVT-003')!;
    expect(reviewStep(e, 'shell')).toBe('shell');
    e.flow.st.toc = 'review'; expect(reviewStep(e, null)).toBe('toc');
    e.flow.st.toc = 'locked'; e.flow.st.shell = 'review'; expect(reviewStep(e, null)).toBe('shell');
    e.flow.st.shell = 'locked'; e.flow.st.qcCode = 'review'; expect(reviewStep(e, null)).toBe('code');
    e.flow.st.qcCode = 'locked'; expect(reviewStep(e, null)).toBe('toc');
  });
});

describe('Review TOC 页', () => {
  it('评审标记完成前 Lock 不可用，点击弹出原因气泡（R4-45）；Esc 关闭', () => {
    render(<ReviewTocPage eid="EVT-003" />);
    expect(lockBtn()).toHaveAttribute('aria-disabled', 'true');
    expect(lockBtn()).toHaveAttribute('title', 'Section 4.2.3 is not reviewed yet. Mark it as reviewed above the document.');
    fireEvent.click(lockBtn());
    expect(screen.getByRole('dialog', { name: 'Not ready to lock' })).toHaveTextContent('Section 4.2.3 is not reviewed yet');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('标记本节 Reviewed → Lock 可用 → 气泡确认后 toc 变 locked，页头显示 Locked', () => {
    vi.useFakeTimers();
    render(<ReviewTocPage eid="EVT-003" />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark section as reviewed' }));
    expect(screen.getByText('4 / 4 Reviewed')).toBeInTheDocument();
    expect(lockBtn()).not.toHaveAttribute('aria-disabled');
    fireEvent.click(lockBtn());
    const pop = screen.getByRole('dialog', { name: 'Lock + Approve TOC' });
    expect(pop).toHaveTextContent('Locks the TOC and makes it read-only. Shell generation starts next.');
    act(() => { fireEvent.click(within(pop).getByRole('button', { name: 'Lock + Approve' })); });
    expect(getDb().events.find((x) => x.id === 'EVT-003')!.flow.st.toc).toBe('locked');
    expect(lockBtn()).toBeDisabled();
    expect(lockBtn()).toHaveAttribute('title', 'Locked');
    expect(screen.getByRole('button', { name: /TOC/ })).toContainElement(screen.getByRole('img', { name: 'Locked' }));
  });

  it('已标记的 Reviewed 可取消：页头与输出行都能退回，Lock 随之重新置灰', () => {
    render(<ReviewTocPage eid="EVT-003" />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark section as reviewed' }));
    expect(screen.getByText('4 / 4 Reviewed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Unmark section as reviewed' }));
    expect(screen.getByText('0 / 4 Reviewed')).toBeInTheDocument();
    expect(lockBtn()).toHaveAttribute('aria-disabled');
    fireEvent.click(screen.getByRole('button', { name: 'Mark section as reviewed' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Unmark as reviewed' })[0]);
    expect(screen.getByText('3 / 4 Reviewed')).toBeInTheDocument();
    expect(lockBtn()).toHaveAttribute('aria-disabled');
  });

  it('逐条标记 Reviewed：4 条都标完才可 Lock；步骤导航当前为 TOC', () => {
    render(<ReviewTocPage eid="EVT-003" />);
    expect(screen.getByRole('button', { name: /TOC/ })).toHaveAttribute('aria-current', 'step');
    for (const no of ['14.1.3.1', '14.1.3.2', '16.2.3.1', '16.2.3.2']) {
      fireEvent.click(within(screen.getByRole('complementary', { name: 'Outline' })).getByRole('button', { name: new RegExp(no.replace(/\./g, '\\.')) }));
      fireEvent.click(screen.getByRole('button', { name: 'Mark as reviewed' }));
    }
    expect(screen.getByText('4 / 4 Reviewed')).toBeInTheDocument();
    expect(lockBtn()).not.toHaveAttribute('aria-disabled');
  });

  it('Filter：Unreviewed 只留有未核对项的章节；No source text 只剩手动输出且不可选；可清除', () => {
    render(<ReviewTocPage eid="EVT-003" />);
    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
    expect(screen.getByRole('menuitem', { name: /All/ })).toHaveTextContent('15');
    fireEvent.click(screen.getByRole('menuitem', { name: /No source text/ }));
    const rows = screen.getAllByRole('button', { name: /16\.2\.7\.9/ });
    expect(rows[0]).toHaveAttribute('aria-disabled', 'true');
    const ol = within(screen.getByRole('complementary', { name: 'Outline' }));
    expect(ol.queryByText(/4\.2\.1/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(ol.getByText(/4\.2\.1/)).toBeInTheDocument();
  });

  it('已锁定的 TOC：输出全部显示已核对，评审操作禁用', () => {
    S.event('EVT-003')!.flow.st.toc = 'locked';
    render(<ReviewTocPage eid="EVT-003" />);
    expect(screen.getByText('4 / 4 Reviewed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Section reviewed' })).toBeDisabled();
    expect(lockBtn()).toBeDisabled();
  });
});
