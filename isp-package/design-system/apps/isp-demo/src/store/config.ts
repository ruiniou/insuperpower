import type { EdgeDef, Loop, NodeDef, NodeId } from './types';

/** 流水线节点定义（坐标取自原型画板 18b：画布 1182×508） */
export const NODES: NodeDef[] = [
  { id: 'toc', name: 'TOC', x: 222, row: 1, w: 156, inputs: [], unit: 'items', wf: 'Generate Shell', wfName: 'Generate TOC', up: 'SAP', rep: true, file: 'TOC' },
  { id: 'shell', name: 'Shell', x: 424, row: 1, w: 156, inputs: ['toc'], unit: 'outputs', wf: 'Generate Shell', wfName: 'Generate Shell', up: 'TOC', rep: true, file: 'Mock Shell' },
  { id: 'prodCode', name: 'Prod Code', x: 644, row: 1, w: 156, inputs: ['shell'], unit: 'programs', wf: 'Generate Code', wfName: 'Generate Production Code', up: 'Shell', rep: true, file: 'Prod Code' },
  { id: 'qcCode', name: 'QC Code', x: 644, row: 2, w: 156, inputs: ['shell'], unit: 'programs', wf: 'Generate Code', wfName: 'Prepare QC Code', up: 'Shell', rep: true, file: 'QC Code' },
  { id: 'prodResult', name: 'Prod Result', x: 846, row: 1, w: 156, inputs: ['prodCode'], unit: 'results', wf: 'Generate Code', wfName: 'Run Production Analysis', up: 'Prod Code', rep: false },
  { id: 'qcResult', name: 'QC Result', x: 846, row: 2, w: 156, inputs: ['qcCode'], unit: 'results', wf: 'Generate Code', wfName: 'Run Independent QC', up: 'QC Code', rep: false },
  { id: 'pkg', name: 'Package', x: 1042, row: 1, w: 140, inputs: ['prodResult', 'qcResult'], unit: '', wf: 'Generate Code', wfName: 'Assemble Final Package', up: 'Results', rep: false },
];
export const NODE = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<NodeId, NodeDef>;
export const DOWN: Record<NodeId, NodeId[]> = { toc: ['shell'], shell: ['prodCode', 'qcCode'], prodCode: ['prodResult'], qcCode: ['qcResult'], prodResult: ['pkg'], qcResult: ['pkg'], pkg: [] };
export const LOOP_NODES: Record<Loop, NodeId[]> = { A: ['toc', 'shell'], B: ['prodCode', 'qcCode', 'prodResult', 'qcResult'] };
export const LOOP_OF: Record<NodeId, Loop> = { toc: 'A', shell: 'A', prodCode: 'B', qcCode: 'B', prodResult: 'B', qcResult: 'B', pkg: 'B' };
export const LOOP_NAME: Record<Loop, string> = { A: 'Generate Shell', B: 'Generate Code' };
export const EDGES: EdgeDef[] = [
  { id: 'e1', to: 'toc', d: 'M 176 86 H 222', bx: 199, by: 86, pop: 'down' },
  { id: 'e2', to: 'shell', d: 'M 378 86 H 424', bx: 401, by: 86, pop: 'down' },
  { id: 'e3', to: 'prodCode', d: 'M 580 86 H 644', bx: 612, by: 86, pop: 'down' },
  { id: 'e4', to: 'qcCode', d: 'M 580 86 H 588 Q 596 86 596 94 V 332 Q 596 340 604 340 H 644', bx: 620, by: 340, pop: 'up' },
  { id: 'e5', to: 'prodResult', d: 'M 800 86 H 846', bx: 823, by: 86, pop: 'down' },
  { id: 'e6', to: 'qcResult', d: 'M 800 340 H 846', bx: 823, by: 340, pop: 'up' },
  { id: 'e7', to: 'pkg', d: 'M 1002 86 H 1042', bx: 1016, by: 86, pop: 'down' },
  { id: 'e8', to: 'pkg', d: 'M 1002 340 H 1026 Q 1034 340 1034 332 V 94 Q 1034 86 1042 86', bx: 1034, by: 213, pop: 'down' },
];
export const PIPE_W = 1182;
export const PIPE_H = 508;
export const SPACES = [
  { key: 'dummy', name: 'Dummy', badge: 'Non-production', mode: 'Dummy' },
  { key: 'synthetic', name: 'Synthetic', badge: 'Non-production', mode: 'Synthetic' },
  { key: 'prod', name: 'PROD', badge: 'Production, real data', mode: 'PROD' },
] as const;
export const GROUP_LABEL: Record<string, string> = { SAP: 'Analysis plan', CRF: 'CRF', PROTOCOL: 'Protocol' };
/** 节点完成项数（原型写死 24） */
export const TOTAL = 24;
