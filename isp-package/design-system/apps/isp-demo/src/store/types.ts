export type NodeId = 'toc' | 'shell' | 'prodCode' | 'qcCode' | 'prodResult' | 'qcResult' | 'pkg';
/** 存储状态；empty 的展示状态（ready / todo）由上游是否全部 locked 派生，不存储 */
export type NodeStatus = 'empty' | 'locked' | 'stale' | 'running' | 'review';
export type Disp = 'locked' | 'ready' | 'stale' | 'todo' | 'running' | 'review';
export type Loop = 'A' | 'B';
export type Rec<T> = Record<NodeId, T>;

export interface Version { n: number; label: string; by: string; date: string; note: string; status: string; file?: string; meta?: Record<string, string> }
export interface Study { id: string; name: string; ta: string; phase: string; owner: string; status: 'Active' | 'Disabled'; updated: string; members: number; desc: string }
export interface Asset { id: string; studyId: string; name: string; code: string; tl: string; icon: string; source?: string; required?: boolean; versions: Version[] }
export interface Dataset { id: string; studyId: string; space: 'dummy' | 'synthetic' | 'prod'; cat: string; name: string; label: string; versions: Version[] }
export interface Ref { v: number; use: string }
export interface Workflow { id: string; loop: Loop; owner: string; created: string; updated: string; inputs: Record<string, string> }
export interface Produced { name: string; tl: string; icon: string; node?: NodeId; ver: number; src: string; used: string; date: string; promote: boolean }

export interface FlowUi { sel: NodeId | null; edge: string | null; inputsOpen: boolean; confirm: NodeId | null }
export interface Flow {
  ui: FlowUi;
  st: Rec<NodeStatus>;
  prog: Rec<number>;
  ver: Rec<number>;
  note: Partial<Record<NodeId, string>>;
  regen: Partial<Record<NodeId, boolean>>;
  wf: Record<Loop, string | null>;
  rev: { pend: Partial<Record<NodeId, boolean>> };
}
export interface EventRec {
  id: string; studyId: string; name: string; status: string; owner: string; goal: string; scope: string; reason: string;
  adopted: string; wfs: Workflow[]; updated: string; members: number;
  refs: { assets: Record<string, Ref>; datasets: Record<string, Ref> };
  produced: Produced[]; flow: Flow;
}
export interface Database {
  me: { name: string; ini: string };
  seq: { study: number; event: number; asset: number; ds: number };
  recent: string[];
  studies: Study[]; assets: Asset[]; datasets: Dataset[]; events: EventRec[];
}

export interface NodeDef {
  id: NodeId; name: string; x: number; row: 1 | 2; w: number; inputs: NodeId[]; unit: string;
  wf: string; wfName: string; up: string; rep: boolean; file?: string;
}
export interface EdgeDef { id: string; to: NodeId; d: string; bx: number; by: number; pop: 'down' | 'up' }
