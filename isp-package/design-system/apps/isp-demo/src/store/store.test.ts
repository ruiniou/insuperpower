import { afterEach, beforeEach } from 'vitest';
import { DOWN, NODES } from './config';
import { btnFor, ovCtx } from './flow';
import { ovDoReplace, ovKeep, ovLock, ovRun, ovStartOrFix, quickUploadDs } from './actions';
import { attentionRows, inputsGroups, nodeCard, popoverFor } from './overview';
import { baselineAsset, baselinesOf, baselineUsers, slotCarriedFrom, suggestBaselineLabel } from './baseline';
import { S, vLabelBl, wfInfo } from './selectors';
import { uploadAsset } from './study';
import { getDb, resetDb, setToastHandler } from './store';
import { activeMembers, addMembers, emptyMemberRow, evKey, memberCount, memberOf, membersOf, removalImpact, removeMember, sortMembers, updateMember, validateMemberRow, wfKey, peopleOf } from './members';
import { setDuty } from './role';

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
    expect(rows[2].sub).toBe('SAP v3.0, ADSL v3. This Event stays on v2.0 and v2');
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
    expect(g.find((x) => x.label === 'Analysis plan')).toMatchObject({ text: 'SAP v2.0, Baseline v2.0', badge: 'v3.0 newer' });
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

describe('Study 页 MVP：职责与资料', () => {
  it('点位按职责与范围判定（5.4）：Study Admin 只在自己担任 Admin 的 Study 里生效', async () => {
    const { can } = await import('./role');
    const mine = S.study('STU-001')!, other = S.study('STU-002')!;
    expect(mine.admin).toBe(getDb().me.name);
    expect(can('event.create', { study: mine }, 'Study Admin')).toBe(true);
    expect(can('event.create', { study: other }, 'Study Admin')).toBe(false);
    expect(can('study.metadata.update', { study: other }, 'Study Admin')).toBe(false);
    expect(can('event.create', { study: mine }, 'System Owner')).toBe(false);
    expect(can('event.owner.transfer', { event: S.event('EVT-001')! }, 'System Owner')).toBe(false);
    expect(can('study.metadata.update', { study: other }, 'System Owner')).toBe(true);
    expect(can('study.create', {}, 'System Owner')).toBe(true);
    expect(['Study Admin', 'Event Owner', 'Member'].some((d) => can('study.create', {}, d as never))).toBe(false);
  });
  it('Event Owner 只对自己负责的 Event 有成员治理、Duplicate、归档', async () => {
    const { can } = await import('./role');
    const mineEvt = S.event('EVT-004')!, other = S.event('EVT-001')!;
    expect(mineEvt.owner).toBe(getDb().me.name);
    expect(can('event.archive', { event: mineEvt }, 'Event Owner')).toBe(true);
    expect(can('event.archive', { event: other }, 'Event Owner')).toBe(false);
    expect(can('event.owner.transfer', { event: mineEvt }, 'Event Owner')).toBe(false);
    expect(can('study.metadata.update', { study: S.study('STU-001')! }, 'Event Owner')).toBe(false);
    expect(can('event.archive', { event: mineEvt }, 'Member')).toBe(false);
  });
  it('修改资料：原因必填，通过后更新资料', async () => {
    const { updateStudyDetails } = await import('./study');
    const f = { name: 'NSCLC Renamed', desc: '', ta: 'Oncology', phase: 'Phase III', reason: '' };
    const bad = updateStudyDetails('STU-001', f);
    expect('errors' in bad && bad.errors.reason).toBeTruthy();
    expect(S.study('STU-001')!.name).toBe('NSCLC Phase III Trial');
    expect('ok' in updateStudyDetails('STU-001', { ...f, reason: 'Fix title' })).toBe(true);
    expect(S.study('STU-001')!.name).toBe('NSCLC Renamed');
  });
  it('新建 Study：创建者为 Study Admin，初始非盲、ACTIVE，成员数含创建者与初始成员', async () => {
    const { createStudy, emptyStudyForm } = await import('./study');
    const { setDuty } = await import('./role');
    setDuty('System Owner');
    const f = { ...emptyStudyForm(), id: 'ABC-001', name: 'Demo Study', members: [{ key: 1, userId: 'U-102', role: 'VIEW', attr: 'UNSET', validFrom: '2026-12-01T09:00', validUntil: '2027-01-01T09:00' }] };
    const r = createStudy(f);
    expect('id' in r).toBe(true);
    const s = S.study('ABC-001')!;
    expect([s.admin, s.blinding, s.lifecycle, memberCount('ABC-001')]).toEqual([getDb().me.name, 'Not blinded', 'ACTIVE', 2]);
    const ms = sortMembers(membersOf('ABC-001'));
    expect(ms.map((m) => [m.name, m.isAdmin, m.role, m.validUntil])).toEqual([['User Name', true, 'STAT', null], ['Li Wei', false, 'VIEW', '2027-01-01T09:00']]);
    expect(toasts.at(-1)).toBe('ABC-001 created');
  });
  it('新建 Study：编号归一化后重复被拒；无资格被拒；成员去重与日期校验', async () => {
    const { createStudy, emptyStudyForm, validateStudyForm } = await import('./study');
    const { setDuty } = await import('./role');
    const base = { ...emptyStudyForm(), name: 'X' };
    const nStudies = getDb().studies.length;
    setDuty('Study Admin');
    expect('errors' in createStudy({ ...base, id: 'NEW-1' }) && true).toBe(true);
    setDuty('System Owner');
    const dup = createStudy({ ...base, id: ' stu-００1 ' });
    expect('errors' in dup && dup.errors.id).toMatch(/unavailable/);
    expect(getDb().studies.length).toBe(nStudies);
    const m = (key: number, userId: string, validFrom: string, validUntil: string) => ({ key, userId, role: 'VIEW', attr: 'UNSET', validFrom, validUntil });
    const er = validateStudyForm({ ...base, id: 'N2', members: [m(1, 'U-102', '2026-12-02T09:00', '2026-12-02T09:00'), m(2, 'U-102', '', '2026-12-02T10:00')] });
    expect(er['m:1:to']).toMatch(/after start/);
    expect(er['m:2:user']).toMatch(/already added/);
    expect(er['m:2:from']).toBeTruthy();
  });
  it('新建 Study：成员结束日期可空；创建者 Role 为空报错', async () => {
    const { emptyStudyForm, validateStudyForm } = await import('./study');
    const base = { ...emptyStudyForm(), id: 'N3', name: 'X' };
    expect(validateStudyForm({ ...base, members: [{ key: 1, userId: 'U-102', role: 'VIEW', attr: 'UNSET', validFrom: '2026-12-01T09:00', validUntil: '' }] })).toEqual({});
    expect(validateStudyForm({ ...base, role: '' }).role).toBe('Select a Role.');
  });
  it('交接 Event Owner：更新负责人；候选人来自本 Study', async () => {
    const { transferEventOwner } = await import('./study');
    expect(peopleOf('STU-001')).toEqual(expect.arrayContaining(['User Name', 'Li Wei', 'Chen Yu']));
    transferEventOwner('EVT-001', 'Chen Yu');
    expect(S.event('EVT-001')!.owner).toBe('Chen Yu');
    expect(toasts.at(-1)).toBe('Event Owner changed to Chen Yu');
  });
});

describe('Study Baseline', () => {
  const sap = (sid: string) => baselineAsset(sid, 'SAP')!;
  const form = (o: Partial<Parameters<typeof uploadAsset>[0]>): Parameters<typeof uploadAsset>[0] => ({ sid: 'STU-001', assetId: null, code: 'SAP', name: 'x', meta: { 'SAP external version': '1' }, fileName: 'sap.pdf', reason: '', version: 'v4.0', baselineMode: 'new', baselineLabel: 'v4.0', ...o });
  it('种子：STU-001 Current v3.0，Protocol 沿用 from v2.0，SAP 不沿用；Current 被引用', () => {
    const list = baselinesOf('STU-001');
    expect(list.map((b) => b.label)).toEqual(['v3.0', 'v2.0', 'v1.0']);
    expect(slotCarriedFrom(list, 0, 'PROTOCOL')).toBe('v2.0');
    expect(slotCarriedFrom(list, 0, 'SAP')).toBeNull();
    expect(baselineUsers(list[0]).length).toBeGreaterThan(0);
    expect(baselineUsers(baselinesOf('STU-002')[0])).toHaveLength(0);
  });
  it('新建 Baseline：只换 SAP 槽位，Protocol 沿用；预填 v4.0；追加版本不新建 Asset', () => {
    expect(suggestBaselineLabel('STU-001')).toBe('v4.0');
    const n = getDb().assets.length;
    const r = uploadAsset(form({}));
    expect('asset' in r).toBe(true);
    expect(getDb().assets).toHaveLength(n);
    const list = baselinesOf('STU-001');
    expect(list[0].label).toBe('v4.0');
    expect(list[0].slots.SAP).toEqual({ assetId: 'A2', n: 4 });
    expect(slotCarriedFrom(list, 0, 'PROTOCOL')).toBe('v2.0');
    expect(toasts.at(-1)).toBe('Uploaded SAP v4.0. Baseline v4.0 created.');
  });
  it('被引用的 Current 不能 Add to current；未被引用的 STU-002 可以替换槽位', () => {
    const r = uploadAsset(form({ baselineMode: 'current' }));
    expect('errors' in r && r.errors.baseline).toMatch(/^Used by \d+ events?\. Start a new baseline instead\.$/);
    const r2 = uploadAsset(form({ sid: 'STU-002', version: 'v1.0', baselineMode: 'current', baselineLabel: '' }));
    expect('asset' in r2).toBe(true);
    expect(baselinesOf('STU-002')).toHaveLength(1);
    expect(baselinesOf('STU-002')[0].slots.SAP).toEqual({ assetId: 'A11', n: 2 });
    expect(toasts.at(-1)).toBe('Uploaded SAP v1.0 to Baseline v1.0.');
    expect(sap('STU-002').versions).toHaveLength(2);
  });
  it('版本号与 Baseline 版本号校验', () => {
    const e1 = uploadAsset(form({ version: ' ' })), e2 = uploadAsset(form({ version: 'V3.0' })), e3 = uploadAsset(form({ baselineLabel: 'V3.0' })), e4 = uploadAsset(form({ baselineLabel: '' }));
    expect('errors' in e1 && e1.errors.version).toBe('Enter a version.');
    expect('errors' in e2 && e2.errors.version).toBe('This version already exists.');
    expect('errors' in e3 && e3.errors.baseline).toBe('This baseline version already exists.');
    expect('errors' in e4 && e4.errors.baseline).toBe('Enter a baseline version.');
  });
  it('Event 侧标签：同一版本属于多个 Baseline 取最新', () => {
    expect(vLabelBl(S.asset('A1')!, 2)).toBe('Amendment 1, Baseline v3.0');
    expect(vLabelBl(S.asset('A2')!, 2)).toBe('v2.0, Baseline v2.0');
    expect(vLabelBl(S.asset('A4')!, 3)).toBe('v1.2');
  });
});

describe('Study Member', () => {
  const row = (key: number, userId: string, o: Partial<ReturnType<typeof emptyMemberRow>> = {}) => emptyMemberRow(key, { userId, validFrom: '2026-12-01T09:00', ...o });
  const mid = (sid: string, name: string) => membersOf(sid).find((m) => m.name === name)!;

  it('种子：STU-001 有 5 个 Active 成员，Study Admin 是当前用户并置顶；STU-002 为 3，STU-003 为 2', () => {
    expect(memberCount('STU-001')).toBe(5);
    expect(sortMembers(activeMembers('STU-001'))[0]).toMatchObject({ name: 'User Name', isAdmin: true });
    expect([memberCount('STU-002'), memberCount('STU-003')]).toEqual([3, 2]);
    expect(peopleOf('STU-001')).toEqual(expect.arrayContaining(['User Name', 'Li Wei', 'Chen Yu']));
  });

  it('添加成员：Reason、From、Until 校验；Until 可空；添加后计数与 peopleOf 更新', () => {
    expect(addMembers({ sid: 'STU-001', rows: [row(1, 'U-106')], reason: ' ' }).errors.reason).toBeTruthy();
    expect(addMembers({ sid: 'STU-001', rows: [row(1, 'U-106', { validFrom: '' })], reason: 'x' }).errors['m:1:from']).toBe('Enter a start time.');
    expect(addMembers({ sid: 'STU-001', rows: [row(1, 'U-106', { validUntil: '2026-11-30T09:00' })], reason: 'x' }).errors['m:1:to']).toMatch(/after start/);
    expect(memberCount('STU-001')).toBe(5);
    const r = addMembers({ sid: 'STU-001', rows: [row(1, 'U-106'), row(2, 'U-107', { validUntil: '2027-01-31T09:00' })], reason: 'Joining the analysis team' });
    expect(r.errors).toEqual({});
    expect(r.done).toEqual([1, 2]);
    expect(memberCount('STU-001')).toBe(7);
    expect(peopleOf('STU-001')).toEqual(expect.arrayContaining(['Zhang Hui', 'Liu Yang']));
    expect(toasts.at(-1)).toBe('Added 2 members');
  });

  it('唯一性：已是 Active 成员的行报 Already a member，其余照常添加且不弹 toast；批内重复被拒', () => {
    const r = addMembers({ sid: 'STU-001', rows: [row(1, 'U-102'), row(2, 'U-106')], reason: 'x' });
    expect(r.errors).toEqual({ 'm:1:user': 'Already a member.' });
    expect(r.done).toEqual([2]);
    expect(memberCount('STU-001')).toBe(6);
    expect(toasts).toEqual([]);
    expect(membersOf('STU-001').filter((m) => m.userId === 'U-102')).toHaveLength(1);
    expect(addMembers({ sid: 'STU-001', rows: [row(1, 'U-107'), row(2, 'U-107')], reason: 'x' }).errors['m:2:user']).toMatch(/already added/);
  });

  it('REMOVED 的用户再次加入：恢复原记录并覆盖设置，不产生重复', () => {
    const chen = mid('STU-001', 'Chen Yu');
    // 交接后移除
    const impact = removalImpact('STU-001', 'Chen Yu');
    const r = removeMember({ sid: 'STU-001', memberId: chen.id, reason: 'Left the project', workflowOwners: Object.fromEntries(impact.workflows.map((x) => [wfKey(x.event.id, x.wf.id), 'Zhao Min'])), eventOwners: Object.fromEntries(impact.events.map((e) => [evKey(e.id), 'Zhao Min'])) });
    expect('ok' in r).toBe(true);
    const n = membersOf('STU-001').length;
    expect(chen.status).toBe('REMOVED');
    expect(addMembers({ sid: 'STU-001', rows: [row(1, 'U-103', { role: 'DM', attr: 'UNBLINDED', validUntil: '2027-06-30T09:00' })], reason: 'Returned' }).done).toEqual([1]);
    expect(membersOf('STU-001')).toHaveLength(n);
    expect(chen).toMatchObject({ status: 'ACTIVE', role: 'DM', attr: 'UNBLINDED', validFrom: '2026-12-01T09:00', validUntil: '2027-06-30T09:00' });
  });

  it('Study Admin 不能被移除', () => {
    const r = removeMember({ sid: 'STU-001', memberId: mid('STU-001', 'User Name').id, reason: 'x', workflowOwners: {}, eventOwners: {} });
    expect('errors' in r && r.errors.form).toMatch(/can’t be removed/);
    expect(mid('STU-001', 'User Name').status).toBe('ACTIVE');
  });

  it('移除有 Workflow 的成员必须先交接；交接后 Workflow 与 Event Owner 一并换人', () => {
    const li = mid('STU-001', 'Li Wei');
    const impact = removalImpact('STU-001', 'Li Wei');
    expect(impact.workflows.map((x) => x.event.id + '/' + x.wf.id)).toEqual(['EVT-001/WF-01', 'EVT-004/WF-01']);
    expect(impact.events.map((e) => e.id)).toEqual(['EVT-001']);
    const none = removeMember({ sid: 'STU-001', memberId: li.id, reason: 'Left the project', workflowOwners: {}, eventOwners: {} });
    expect('errors' in none && none.errors['wf:EVT-001:WF-01']).toBe('Select a new owner.');
    expect(li.status).toBe('ACTIVE');
    const self = removeMember({ sid: 'STU-001', memberId: li.id, reason: 'x', workflowOwners: { 'wf:EVT-001:WF-01': 'Li Wei', 'wf:EVT-004:WF-01': 'Chen Yu' }, eventOwners: { 'ev:EVT-001': 'Chen Yu' } });
    expect('errors' in self).toBe(true);
    const ok = removeMember({ sid: 'STU-001', memberId: li.id, reason: 'Left the project', workflowOwners: { 'wf:EVT-001:WF-01': 'Chen Yu', 'wf:EVT-004:WF-01': 'Zhao Min' }, eventOwners: { 'ev:EVT-001': 'Chen Yu' } });
    expect('ok' in ok).toBe(true);
    expect(li.status).toBe('REMOVED');
    expect([S.event('EVT-001')!.owner, S.event('EVT-001')!.wfs[0].owner, S.event('EVT-004')!.wfs[0].owner]).toEqual(['Chen Yu', 'Chen Yu', 'Zhao Min']);
    expect(toasts.at(-1)).toBe('Removed Li Wei');
    expect(memberCount('STU-001')).toBe(4);
  });

  it('移除没有 Workflow 的成员：只需要 Reason', () => {
    const wf = mid('STU-001', 'Wang Fang');
    expect(removalImpact('STU-001', 'Wang Fang')).toEqual({ events: [], workflows: [] });
    expect('errors' in removeMember({ sid: 'STU-001', memberId: wf.id, reason: '', workflowOwners: {}, eventOwners: {} })).toBe(true);
    expect('ok' in removeMember({ sid: 'STU-001', memberId: wf.id, reason: 'Contract ended', workflowOwners: {}, eventOwners: {} })).toBe(true);
    expect(wf.status).toBe('REMOVED');
  });

  it('盲态校验：Blinded 的 Study 里属性不能是 Unspecified；Unblinded 不能改回 Blinded', () => {
    expect(validateMemberRow({ userId: 'U-106', role: 'VIEW', attr: 'UNSET', validFrom: '2026-12-01T09:00', validUntil: '' }, { studyBlinded: true }).attr).toBe('Select Blinded or Unblinded.');
    expect(validateMemberRow({ userId: 'U-106', role: 'VIEW', attr: 'UNSET', validFrom: '2026-12-01T09:00', validUntil: '' }, { studyBlinded: false }).attr).toBeUndefined();
    expect(addMembers({ sid: 'STU-002', rows: [row(1, 'U-106')], reason: 'x' }).errors['m:1:attr']).toBe('Select Blinded or Unblinded.');
    expect(addMembers({ sid: 'STU-002', rows: [row(1, 'U-106', { attr: 'BLINDED' })], reason: 'x' }).done).toEqual([1]);
    setDuty('System Owner');
    const li = mid('STU-001', 'Li Wei');
    expect(li.attr).toBe('UNBLINDED');
    const bad = updateMember({ sid: 'STU-001', memberId: li.id, row: row(1, li.userId, { role: 'DEV', attr: 'BLINDED', validFrom: li.validFrom }), reason: 'x' });
    expect('errors' in bad && bad.errors['m:1:attr']).toMatch(/back to Blinded/);
    expect('ok' in updateMember({ sid: 'STU-001', memberId: li.id, row: row(1, li.userId, { role: 'STAT', attr: 'UNBLINDED', validFrom: li.validFrom }), reason: 'Role change' })).toBe(true);
    expect(li.role).toBe('STAT');
  });

  it('权限：Event Owner 与 Member 职责不能添加、编辑、移除', () => {
    setDuty('Event Owner');
    expect(addMembers({ sid: 'STU-001', rows: [row(1, 'U-106')], reason: 'x' }).errors.form).toMatch(/permission/);
    setDuty('Member');
    expect('errors' in removeMember({ sid: 'STU-001', memberId: mid('STU-001', 'Wang Fang').id, reason: 'x', workflowOwners: {}, eventOwners: {} })).toBe(true);
    expect(mid('STU-001', 'Wang Fang').status).toBe('ACTIVE');
    setDuty('Study Admin');
    expect(memberOf('STU-001', 'U-105')).toBeTruthy();
  });
});
