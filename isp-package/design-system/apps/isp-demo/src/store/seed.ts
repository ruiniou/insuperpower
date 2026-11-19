import { TENANT_USERS, userByName } from './people';
import type { Baseline, BlindAttr, Database, EventRec, Flow, MemberRole, Study, Version } from './types';

export const V = (n: number, by: string, date: string, note = '', o: Partial<Version> = {}): Version => ({ n, label: 'v' + n, by, date, note, ...o });
/** Asset 版本：label 是用户填写的版本号 */
const AV = (n: number, label: string, by: string, date: string, note = ''): Version => V(n, by, date, note, { label });

export const newFlow = (o: Partial<Flow> = {}): Flow => ({
  ui: { sel: null, edge: null, inputsOpen: false, confirm: null },
  st: { toc: 'empty', shell: 'empty', prodCode: 'empty', qcCode: 'empty', prodResult: 'empty', qcResult: 'empty', pkg: 'empty' },
  prog: { toc: 0, shell: 0, prodCode: 0, qcCode: 0, prodResult: 0, qcResult: 0, pkg: 0 },
  ver: { toc: 1, shell: 1, prodCode: 1, qcCode: 1, prodResult: 1, qcResult: 1, pkg: 1 },
  note: {}, regen: {}, wf: { A: null, B: null }, rev: { pend: {} },
  ...o,
});

/** 种子数据（与原型 index.html 的 DB 一致）。每次调用返回全新对象，便于测试与重置 */
export function createSeed(): Database {
  const db: Database = {
    me: { name: 'User Name', ini: 'UN' },
    seq: { study: 3, event: 3, asset: 20, ds: 40, baseline: 4, member: 0 },
    members: [],
    studies: ([
      { id: 'STU-001', name: 'NSCLC Phase III Trial', ta: 'Oncology', phase: 'Phase III', admin: 'User Name', lifecycle: 'ACTIVE', blinding: 'Not blinded', updated: 'Oct 31, 2026', desc: '', tenant: 'Demo Tenant', createdBy: 'Wang Fang', createdAt: 'Aug 12, 2026' },
      { id: 'STU-002', name: 'Breast Cancer Phase II Trial', ta: 'Oncology', phase: 'Phase II', admin: 'Zhao Min', lifecycle: 'ACTIVE', blinding: 'Blinded', updated: 'Oct 26, 2026', desc: '', tenant: 'Demo Tenant', createdBy: 'Zhao Min', createdAt: 'Sep 2, 2026' },
      { id: 'STU-003', name: 'Lymphoma Phase I Trial', ta: 'Hematology', phase: 'Phase I', admin: 'Wang Fang', lifecycle: 'ARCHIVED', blinding: 'Revealed', updated: 'Sep 18, 2026', desc: '', tenant: 'Demo Tenant', createdBy: 'Wang Fang', createdAt: 'Mar 5, 2026' },
    ] as Study[]).concat(Array.from({ length: 45 }, (_, i): Study => ({ id: 'TMP-' + String(i + 1).padStart(3, '0'), name: 'Temp pagination study ' + (i + 1), ta: ['Oncology', 'Hematology', 'Cardiology'][i % 3], phase: 'Phase II', admin: 'Zhao Min', lifecycle: 'ACTIVE' as const, blinding: 'Not blinded' as const, updated: 'Oct 20, 2026', desc: '', tenant: 'Demo Tenant', createdBy: 'Zhao Min', createdAt: 'Sep 2, 2026' }))), // TEMP-PAGINATION 预览用，看完删除
    assets: [
      { id: 'A1', studyId: 'STU-001', name: 'STU-001 Protocol', code: 'PROTOCOL', tl: 'Protocol', icon: 'doc', source: 'Uploaded', versions: [AV(2, 'Amendment 1', 'Li Wei', 'Oct 12', 'Approved'), AV(1, 'v1.0', 'Li Wei', 'Oct 3')] },
      { id: 'A2', studyId: 'STU-001', name: 'STU-001 SAP', code: 'SAP', tl: 'SAP', icon: 'doc', source: 'Uploaded', versions: [AV(3, 'v3.0', 'Chen Yu', 'Oct 28', 'Revised sensitivity analyses'), AV(2, 'v2.0', 'Li Wei', 'Oct 15', 'Approved'), AV(1, 'v1.0', 'Li Wei', 'Oct 3')] },
      { id: 'A3', studyId: 'STU-001', name: 'STU-001 CRF', code: 'CRF', tl: 'CRF', icon: 'doc', source: 'Uploaded', versions: [AV(2, 'v2.0', 'Zhao Min', 'Oct 22', 'Revised forms'), AV(1, 'v1.0', 'Zhao Min', 'Oct 14', 'Approved')] },
      { id: 'A4', studyId: 'STU-001', name: 'STU-001 ADaM Spec', code: 'ADAM_SPEC', tl: 'ADaM Spec', icon: 'doc', source: 'Uploaded', versions: [AV(3, 'v1.2', 'Li Wei', 'Oct 20'), AV(2, 'v1.1', 'Li Wei', 'Oct 14'), AV(1, 'v1.0', 'Li Wei', 'Oct 8')] },
      { id: 'A5', studyId: 'STU-001', name: 'STU-001 SDTM Spec', code: 'SDTM_SPEC', tl: 'SDTM Spec', icon: 'doc', source: 'Uploaded', versions: [AV(1, 'v1.0', 'Li Wei', 'Oct 20')] },
      { id: 'A6', studyId: 'STU-001', name: 'Primary Analysis TOC', code: 'TOC_TFL_DEFINITION', tl: 'TOC', icon: 'list', source: 'Promoted from WF-03', versions: [AV(1, 'v1.0', 'Li Wei', 'Oct 30')] },
      { id: 'A7', studyId: 'STU-001', name: 'Primary Analysis Mock Shell', code: 'TABLE_SHELL', tl: 'Shell', icon: 'shell', source: 'Promoted from WF-03', versions: [AV(2, 'v1.1', 'Li Wei', 'Oct 31'), AV(1, 'v1.0', 'Li Wei', 'Oct 29')] },
      { id: 'A8', studyId: 'STU-001', name: 'Primary Analysis SAS code', code: 'TFL_PRODUCTION_CODE', tl: 'Prod. code', icon: 'code', source: 'Promoted from WF-04', versions: [AV(1, 'v1.0', 'Chen Yu', 'Nov 1')] },
      { id: 'A9', studyId: 'STU-001', name: '', code: 'ACRF', tl: 'aCRF', icon: 'doc', required: true, versions: [] },
      { id: 'A10', studyId: 'STU-002', name: 'STU-002 Protocol', code: 'PROTOCOL', tl: 'Protocol', icon: 'doc', source: 'Uploaded', versions: [AV(1, 'v1.0', 'Zhao Min', 'Oct 20', 'Approved')] },
      { id: 'A11', studyId: 'STU-002', name: 'STU-002 SAP', code: 'SAP', tl: 'SAP', icon: 'doc', source: 'Uploaded', versions: [AV(1, 'v0.9', 'Zhao Min', 'Oct 24')] },
    ],
    baselines: [
      { id: 'B3', studyId: 'STU-001', label: 'v3.0', slots: { PROTOCOL: { assetId: 'A1', n: 2 }, SAP: { assetId: 'A2', n: 3 } }, by: 'Chen Yu', date: 'Oct 28', note: '' },
      { id: 'B2', studyId: 'STU-001', label: 'v2.0', slots: { PROTOCOL: { assetId: 'A1', n: 2 }, SAP: { assetId: 'A2', n: 2 } }, by: 'Li Wei', date: 'Oct 15', note: '' },
      { id: 'B1', studyId: 'STU-001', label: 'v1.0', slots: { PROTOCOL: { assetId: 'A1', n: 1 }, SAP: { assetId: 'A2', n: 1 } }, by: 'Li Wei', date: 'Oct 3', note: '' },
      { id: 'B4', studyId: 'STU-002', label: 'v1.0', slots: { PROTOCOL: { assetId: 'A10', n: 1 }, SAP: { assetId: 'A11', n: 1 } }, by: 'Zhao Min', date: 'Oct 24', note: '' },
    ] satisfies Baseline[],
    datasets: [],
    events: [],
  };

  const d = (id: string, space: 'dummy' | 'synthetic' | 'prod', cat: string, name: string, label: string, versions: Version[]) =>
    db.datasets.push({ id, studyId: 'STU-001', space, cat, name, label, versions });
  const dv = (n: number, by: string, date: string, basis: string) => V(n, by, date, basis);
  d('D1', 'dummy', 'SDTM', 'DM', 'Demographics', [dv(3, 'Chen Yu', 'Oct 30', 'Generated from SDTM Spec v2'), dv(2, 'Li Wei', 'Oct 21', 'Generated from SDTM Spec v2'), dv(1, 'Li Wei', 'Oct 10', 'Generated from SDTM Spec v1')]);
  d('D2', 'dummy', 'SDTM', 'AE', 'Adverse Events', [dv(3, 'Chen Yu', 'Oct 30', 'Generated from SDTM Spec v2'), dv(2, 'Li Wei', 'Oct 21', 'Generated from SDTM Spec v2'), dv(1, 'Li Wei', 'Oct 10', 'Generated from SDTM Spec v1')]);
  d('D3', 'dummy', 'ADaM', 'ADSL', 'Subject-level', [dv(3, 'Chen Yu', 'Nov 1', 'Generated from ADaM Spec v1'), dv(2, 'Li Wei', 'Oct 21', 'Generated from ADaM Spec v1'), dv(1, 'Li Wei', 'Oct 10', 'Generated from ADaM Spec v1')]);
  d('D4', 'dummy', 'SDTM', 'LB', 'Laboratory', [dv(2, 'Li Wei', 'Oct 21', 'Generated from SDTM Spec v2'), dv(1, 'Li Wei', 'Oct 10', 'Generated from SDTM Spec v1')]);
  d('D5', 'dummy', 'SDTM', 'VS', 'Vital Signs', [dv(2, 'Li Wei', 'Oct 21', 'Generated from SDTM Spec v2'), dv(1, 'Li Wei', 'Oct 10', 'Generated from SDTM Spec v1')]);
  d('D6', 'dummy', 'ADaM', 'ADAE', 'Adverse events', [dv(1, 'Li Wei', 'Oct 28', 'Generated from ADaM Spec v1')]);
  d('D7', 'dummy', 'ADaM', 'ADLB', 'Laboratory', [dv(1, 'Li Wei', 'Oct 28', 'Generated from ADaM Spec v1')]);
  d('D8', 'synthetic', 'SDTM', 'DM', 'Demographics', [dv(1, 'Chen Yu', 'Oct 24', 'Generated from SDTM Spec v2')]);
  d('D9', 'synthetic', 'SDTM', 'AE', 'Adverse Events', [dv(1, 'Chen Yu', 'Oct 24', 'Generated from SDTM Spec v2')]);
  d('D10', 'synthetic', 'ADaM', 'ADSL', 'Subject-level', [dv(1, 'Chen Yu', 'Oct 25', 'Generated from ADaM Spec v1')]);
  d('D11', 'prod', 'SDTM', 'DM', 'Demographics', [dv(1, 'Wang Fang', 'Oct 27', 'Source batch B-0412')]);
  d('D12', 'prod', 'ADaM', 'ADSL', 'Subject-level', [dv(1, 'Wang Fang', 'Oct 28', 'Source batch B-0412')]);

  const events: EventRec[] = [
    {
      id: 'EVT-001', studyId: 'STU-001', name: 'Primary Analysis', status: 'In progress', owner: 'Li Wei', goal: '', scope: 'FORMAL', reason: '',
      adopted: 'WF-03 SAP v2.0 baseline',
      wfs: [{ id: 'WF-01', loop: 'A', owner: 'Li Wei', created: 'Oct 27', updated: 'Oct 31', inputs: { SAP: 'SAP v2.0', Protocol: 'Protocol Amendment 1' } }, { id: 'WF-02', loop: 'B', owner: 'Chen Yu', created: 'Oct 29', updated: 'Nov 2', inputs: { Dataset: '3 pinned' } }],
      updated: 'Oct 31, 2026', members: 5,
      refs: { assets: { A1: { v: 2, use: 'Generate Shell' }, A2: { v: 2, use: 'Generate Shell' }, A4: { v: 3, use: 'Generate Shell, Generate Code' } }, datasets: { D3: { v: 2, use: 'Generate Code' }, D6: { v: 1, use: 'Generate Code' }, D7: { v: 1, use: 'Generate Code' } } },
      produced: [
        { name: 'Primary Analysis TOC', tl: 'TOC', icon: 'list', node: 'toc', ver: 1, src: 'Generate Shell, Result 3', used: '—', date: 'Oct 30', promote: true },
        { name: 'Primary Analysis Mock Shell', tl: 'Shell', icon: 'shell', node: 'shell', ver: 2, src: 'Generate Shell, Result 3', used: 'Generate Code', date: 'Oct 31', promote: true },
        { name: 'Mock Shell (Alt config)', tl: 'Shell', icon: 'shell', ver: 1, src: 'Generate Shell, Result 2', used: '—', date: 'Oct 29', promote: false },
        { name: 'Mock Shell (First trial)', tl: 'Shell', icon: 'shell', ver: 1, src: 'Generate Shell, Result 1', used: '—', date: 'Oct 27', promote: true },
      ],
      flow: newFlow({
        ui: { sel: 'prodResult', edge: null, inputsOpen: false, confirm: null },
        st: { toc: 'locked', shell: 'locked', prodCode: 'locked', qcCode: 'stale', prodResult: 'empty', qcResult: 'empty', pkg: 'empty' },
        prog: { toc: 24, shell: 24, prodCode: 24, qcCode: 24, prodResult: 0, qcResult: 0, pkg: 0 },
        ver: { toc: 2, shell: 2, prodCode: 1, qcCode: 1, prodResult: 1, qcResult: 1, pkg: 1 },
        note: { qcCode: 'Shell v2 available' }, wf: { A: 'WF-01', B: 'WF-02' },
      }),
    },
    {
      id: 'EVT-002', studyId: 'STU-001', name: 'Interim Analysis', status: 'In progress', owner: 'Chen Yu', goal: '', scope: 'INTERIM', reason: '',
      adopted: '—', updated: 'Oct 25, 2026', members: 3,
      wfs: [{ id: 'WF-01', loop: 'A', owner: 'Chen Yu', created: 'Oct 20', updated: 'Oct 25', inputs: { SAP: 'SAP v3.0' } }],
      refs: { assets: { A1: { v: 2, use: 'Generate Shell' }, A2: { v: 3, use: 'Generate Shell' } }, datasets: { D1: { v: 2, use: 'Generate Code' }, D3: { v: 2, use: 'Generate Code' } } },
      produced: [],
      flow: newFlow({
        ui: { sel: 'prodCode', edge: null, inputsOpen: false, confirm: null },
        st: { toc: 'locked', shell: 'locked', prodCode: 'empty', qcCode: 'empty', prodResult: 'empty', qcResult: 'empty', pkg: 'empty' },
        prog: { toc: 24, shell: 24, prodCode: 0, qcCode: 0, prodResult: 0, qcResult: 0, pkg: 0 }, wf: { A: 'WF-01', B: null },
      }),
    },
    {
      id: 'EVT-003', studyId: 'STU-002', name: 'Primary Analysis', status: 'In progress', owner: 'Zhao Min', goal: '', scope: 'FORMAL', reason: '',
      adopted: '—', updated: 'Oct 26, 2026', members: 2, wfs: [],
      refs: { assets: {}, datasets: {} },
      produced: [],
      flow: newFlow({ ui: { sel: 'toc', edge: null, inputsOpen: false, confirm: null } }),
    },
    {
      id: 'EVT-004', studyId: 'STU-001', name: 'Exploratory Analysis', status: 'In progress', owner: 'User Name', goal: '', scope: 'EXPLORATORY', reason: '',
      adopted: '—', updated: 'Nov 2, 2026', members: 2,
      wfs: [{ id: 'WF-01', loop: 'A', owner: 'Li Wei', created: 'Nov 1', updated: 'Nov 2', inputs: { SAP: 'SAP v3.0' } }],
      refs: { assets: { A1: { v: 2, use: 'Generate Shell' }, A2: { v: 3, use: 'Generate Shell' } }, datasets: {} },
      produced: [],
      flow: newFlow({
        ui: { sel: 'toc', edge: null, inputsOpen: false, confirm: null },
        st: { toc: 'review', shell: 'empty', prodCode: 'empty', qcCode: 'empty', prodResult: 'empty', qcResult: 'empty', pkg: 'empty' },
        prog: { toc: 24, shell: 0, prodCode: 0, qcCode: 0, prodResult: 0, qcResult: 0, pkg: 0 }, wf: { A: 'WF-01', B: null },
      }),
    },
  ];
  db.events = events;

  // 成员：每个 Study 的 Admin 加上下列成员。Active 数对应原先的 members 数字（STU-001 为 5，STU-002 为 3，STU-003 为 2，其余 Temp 为 2）
  const mem = (sid: string, name: string, role: MemberRole, attr: BlindAttr, validFrom: string, validUntil: string | null, isAdmin = false) => {
    const u = userByName(name)!;
    db.members.push({ id: 'M-' + String(++db.seq.member).padStart(3, '0'), studyId: sid, userId: u.id, name: u.name, email: u.email, role, attr, validFrom, validUntil, status: 'ACTIVE', isAdmin });
  };
  mem('STU-001', 'User Name', 'STAT', 'UNSET', '2026-08-12T00:00', null, true);
  mem('STU-001', 'Li Wei', 'DEV', 'UNBLINDED', '2026-08-12T00:00', '2027-03-01T00:00');
  mem('STU-001', 'Chen Yu', 'QC', 'UNSET', '2026-08-12T00:00', null);
  mem('STU-001', 'Zhao Min', 'DM', 'UNSET', '2026-09-01T00:00', null);
  mem('STU-001', 'Wang Fang', 'VIEW', 'UNSET', '2026-09-01T00:00', '2027-04-01T00:00');
  mem('STU-002', 'Zhao Min', 'STAT', 'UNBLINDED', '2026-09-02T00:00', null, true);
  mem('STU-002', 'Li Wei', 'DEV', 'BLINDED', '2026-09-02T00:00', null);
  mem('STU-002', 'Chen Yu', 'QC', 'BLINDED', '2026-09-10T00:00', null);
  mem('STU-003', 'Wang Fang', 'STAT', 'UNSET', '2026-03-05T00:00', null, true);
  mem('STU-003', 'Li Wei', 'VIEW', 'UNSET', '2026-03-05T00:00', null);
  db.studies.filter((s) => s.id.startsWith('TMP-')).forEach((s) => { mem(s.id, 'Zhao Min', 'STAT', 'UNSET', '2026-09-02T00:00', null, true); mem(s.id, 'Li Wei', 'VIEW', 'UNSET', '2026-09-02T00:00', null); });
  return db;
}
