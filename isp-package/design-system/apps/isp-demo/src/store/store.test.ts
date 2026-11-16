import { afterEach, beforeEach } from 'vitest';
import { DOWN, NODES } from './config';
import { btnFor, ovCtx } from './flow';
import { ovDoReplace, ovKeep, ovLock, ovRun, ovStartOrFix, quickUploadDs } from './actions';
import { attentionRows, inputsGroups, nodeCard, popoverFor } from './overview';
import { S, wfInfo } from './selectors';
import { getDb, resetDb, setToastHandler } from './store';

let toasts: string[] = [];
beforeEach(() => { vi.useFakeTimers(); resetDb(); toasts = []; setToastHandler((m) => toasts.push(m)); });
afterEach(() => { vi.useRealTimers(); });
const evt = (id = 'EVT-001') => S.event(id)!;

describe('展示状态派生（empty → ready / todo）', () => {
  it('EVT-001：toc/shell/prodCode locked，qcCode stale，prodResult 的上游 locked → ready，qcResult 上游未 locked → todo', () => {
    const C = ovCtx(evt());
    expect(NODES.map((n) => C.disp(n.id))).toEqual(['locked', 'locked', 'locked', 'stale', 'ready', 'todo', 'todo']);
  });
  it('计数与 Caption', () => {
    const C = ovCtx(evt());
    const n = (id: string) => NODES.find((x) => x.id === id)!;
    expect(C.countOf(n('toc'))).toBe('24/24');
    expect(C.countOf(n('prodResult'))).toBe('0/24');
    expect(C.countOf(n('pkg'))).toBe('');
    expect(C.captionOf(n('toc'))).toBe('Locked v2');
    expect(C.captionOf(n('qcCode'))).toBe('Update available v1');
  });
  it('按钮文案', () => {
    const C = ovCtx(evt());
    expect(btnFor(C, 'toc').text).toBe('Open file');
    expect(btnFor(C, 'qcCode').text).toBe('Update');
    expect(btnFor(C, 'prodResult')).toEqual({ text: 'Start', primary: true });
    expect(btnFor(C, 'qcResult').text).toBe('Check inputs');
  });
});

describe('替换文件（ovDoReplace）', () => {
  it('新版本 +1，只标直接下游且当前为 Locked 的节点为 Stale，不连带更下游', () => {
    const e = evt(); // shell locked v2，下游 prodCode locked、qcCode 已 stale
    ovDoReplace(e, 'shell');
    expect(e.flow.ver.shell).toBe(3);
    expect(e.flow.st.prodCode).toBe('stale');
    expect(e.flow.note.prodCode).toBe('Mock Shell v3 available');
    expect(e.flow.st.prodResult).toBe('empty');
    expect(toasts.at(-1)).toBe('Mock Shell v3 uploaded, Prod Code, QC Code update available');
  });
  it('直接下游为 Running / Review 时不标 Stale', () => {
    const e = evt('EVT-002'); // shell locked，prodCode empty
    e.flow.st.prodCode = 'review';
    ovDoReplace(e, 'shell');
    expect(e.flow.st.prodCode).toBe('review');
  });
  it('无下游受影响时 toast 不带 update available', () => {
    const e = evt('EVT-002');
    ovDoReplace(e, 'shell');
    expect(e.flow.st.prodCode).toBe('empty');
    expect(toasts.at(-1)).toBe('Mock Shell v2 uploaded'); // EVT-002 的 Shell 初始 v1
  });
});

describe('Update / Keep / Run / Lock', () => {
  it('Keep：回到 Locked，版本号不变，清除提示', () => {
    const e = evt();
    ovKeep(e, 'qcCode');
    expect(e.flow.st.qcCode).toBe('locked');
    expect(e.flow.ver.qcCode).toBe(1);
    expect(e.flow.note.qcCode).toBeUndefined();
    expect(toasts.at(-1)).toBe('Kept QC Code v1, decision recorded');
  });
  it('Update（stale）→ Running → 进度每 380ms +3 → 24/24 进入 Review；Lock 后版本号 +1', () => {
    const e = evt();
    ovRun(e, 'qcCode');
    expect(e.flow.st.qcCode).toBe('running');
    expect(e.flow.regen.qcCode).toBe(true);
    vi.advanceTimersByTime(380);
    expect(e.flow.prog.qcCode).toBe(3);
    vi.advanceTimersByTime(380 * 7);
    expect(e.flow.prog.qcCode).toBe(24);
    expect(e.flow.st.qcCode).toBe('review');
    ovLock(e, 'qcCode');
    expect(e.flow.st.qcCode).toBe('locked');
    expect(e.flow.ver.qcCode).toBe(2);
    expect(e.flow.regen.qcCode).toBe(false);
    expect(toasts.at(-1)).toBe('QC Code locked');
  });
  it('首次 Run（非 stale）Lock 后版本号不变', () => {
    const e = evt();
    ovRun(e, 'prodResult');
    vi.advanceTimersByTime(380 * 8);
    expect(e.flow.st.prodResult).toBe('review');
    ovLock(e, 'prodResult');
    expect(e.flow.ver.prodResult).toBe(1);
    expect(ovCtx(e).disp('qcResult')).toBe('todo');
  });
  it('ovStartOrFix：ready 且无 Workflow → New Workflow；stale 上游未 locked → 提示且不运行；review 的 Package 无 Review', () => {
    const e3 = evt('EVT-003');
    expect(ovStartOrFix(e3, 'toc')).toBe('#/event/EVT-003/workflow/new');
    const e = evt();
    e.flow.st.shell = 'stale';
    expect(ovStartOrFix(e, 'qcCode')).toBeNull();
    expect(toasts.at(-1)).toBe('Update upstream steps first');
    expect(e.flow.st.qcCode).toBe('stale');
    e.flow.st.shell = 'locked';
    expect(ovStartOrFix(e, 'qcCode')).toBe('#/event/EVT-001/workflow/WF-02/qcCode');
    expect(e.flow.st.qcCode).toBe('running');
    e.flow.st.pkg = 'review';
    expect(ovStartOrFix(e, 'pkg')).toBeNull();
    expect(toasts.at(-1)).toBe('Package review is not in this prototype');
  });
  it('todo 点击提示缺哪些上游', () => {
    const e = evt();
    ovStartOrFix(e, 'pkg');
    expect(toasts.at(-1)).toBe('Waiting for Prod Result + QC Result');
  });
});

describe('Needs your attention（节点状态的投影）', () => {
  it('EVT-001 初始：Update(QC Code) → Ready(Prod Result) → Study', () => {
    const rows = attentionRows(evt(), ovCtx(evt()));
    expect(rows.map((r) => r.tag)).toEqual(['Update', 'Ready', 'Study']);
    expect(rows[0].title).toBe('QC Code can use Shell v2');
    expect(rows[0].keepLabel).toBe('Keep v1');
    expect(rows[1].primary).toBe(true);
    expect(rows[2].sub).toBe('SAP v3, ADSL v3. This Event stays on v2 and v2');
  });
  it('全部处理完显示为空（EVT-003 无引用更新、全 empty → 只有 Ready TOC）', () => {
    const rows = attentionRows(evt('EVT-003'), ovCtx(evt('EVT-003')));
    expect(rows.map((r) => r.tag)).toEqual(['Ready']);
  });
  it('Keep 后 Update 行消失', () => {
    const e = evt(); ovKeep(e, 'qcCode');
    expect(attentionRows(e, ovCtx(e)).some((r) => r.tag === 'Update')).toBe(false);
  });
});

describe('Inputs / 卡片行 / 气泡', () => {
  it('Inputs：SAP/Protocol/ADaM Spec 带 newer 提示；Datasets 汇总', () => {
    const g = inputsGroups(evt());
    expect(g.find((x) => x.label === 'Analysis plan')).toMatchObject({ text: 'SAP v2', badge: 'v3 newer' });
    expect(g.find((x) => x.label === 'Datasets')).toMatchObject({ text: 'ADaM 3', badge: 'ADSL v3 newer' });
    expect(g.find((x) => x.label === 'CRF')).toMatchObject({ text: 'None pinned' });
  });
  it('stale 节点卡片只留前两行；locked 无主按钮', () => {
    const e = evt(); const C = ovCtx(e);
    const q = nodeCard(e, C, NODES.find((n) => n.id === 'qcCode')!);
    expect(q.rows).toHaveLength(2);
    expect(q.note).toBe('Shell v2 available');
    expect(nodeCard(e, C, NODES.find((n) => n.id === 'toc')!).showBtn).toBe(false);
  });
  it('气泡：e4 向上弹出，Latest run 与状态 Badge 随下游状态', () => {
    const e = evt(); const p = popoverFor(e, ovCtx(e), 'e4')!;
    expect(p.placement).toBe('above');
    expect(p.badge).toBe('Update available');
    expect(p.lines.at(-1)!.text).toBe('Built from an older input');
  });
  it('wfInfo 由节点状态派生', () => {
    const e = evt();
    expect(wfInfo(e, e.wfs[0]).status).toBe('Locked');
    expect(wfInfo(e, e.wfs[1]).status).toBe('Update available');
  });
  it('DOWN 与 NODES 的 inputs 互为反向', () => {
    NODES.forEach((n) => n.inputs.forEach((i) => expect(DOWN[i]).toContain(n.id)));
  });
});

describe('数据集槽位上传', () => {
  it('支持格式：新建 Dataset 并 pin；不支持格式 toast', () => {
    const e = evt('EVT-003');
    quickUploadDs(e, 'ADaM', 'adsl.xpt');
    expect(Object.keys(e.refs.datasets)).toHaveLength(1);
    expect(getDb().datasets.at(-1)!.name).toBe('ADSL');
    quickUploadDs(e, 'SDTM', 'dm.txt');
    expect(toasts.at(-1)).toMatch(/^Unsupported format/);
    expect(Object.keys(e.refs.datasets)).toHaveLength(1);
  });
});
