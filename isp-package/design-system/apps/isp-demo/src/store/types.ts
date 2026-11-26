export type NodeId = 'toc' | 'shell' | 'prodCode' | 'qcCode' | 'prodResult' | 'qcResult' | 'pkg';
/** 存储状态；empty 的展示状态（ready / todo）由上游是否全部 locked 派生，不存储 */
export type NodeStatus = 'empty' | 'locked' | 'stale' | 'running' | 'review';
export type Disp = 'locked' | 'ready' | 'stale' | 'todo' | 'running' | 'review';
export type Loop = 'A' | 'B';
export type Rec<T> = Record<NodeId, T>;

/** n 是内部序号（不显示）；label 是上传时用户填写的版本号 */
export interface CodePackageMember { path: string; size: number; hash: string; content: Blob }
export interface Version { n: number; label: string; by: string; date: string; note: string; file?: string; fileContent?: Blob | string; packageMembers?: readonly CodePackageMember[]; archived?: boolean; meta?: Record<string, string> }
export type Lifecycle = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type Blinding = 'Unblinded' | 'Blinded';
export interface Study {
  id: string; name: string; ta: string; phase: string; admin: string; lifecycle: Lifecycle; blinding: Blinding;
  updated: string; desc: string; tenant: string; createdBy: string; createdAt: string;
}
export type MemberRole = 'DEV' | 'STAT' | 'DM' | 'QC' | 'VIEW';
export type BlindAttr = 'BLINDED' | 'UNBLINDED' | 'UNSET';
/** Study 成员。同一 Study 内同一 userId 只有一条记录；REMOVED 的再次加入时恢复这条 */
export interface StudyMember {
  id: string; studyId: string; userId: string; name: string; email: string;
  role: MemberRole; attr: BlindAttr;
  validFrom: string; validUntil: string | null;
  status: 'ACTIVE' | 'REMOVED'; isAdmin: boolean;
}
export interface Asset { id: string; studyId: string; name: string; code: string; tl: string; icon: string; source?: string; required?: boolean; versions: Version[] }
/** 指向某个 Asset 的某个版本（n 为内部序号） */
export interface BaselineSlot { assetId: string; n: number }
export type BaselineCode = 'PROTOCOL' | 'SAP';
/** Study Baseline：Protocol 与 SAP 的一组版本。DB.baselines 新的在前，每个 Study 的第一个是 Current */
export interface Baseline {
  id: string; studyId: string;
  label: string;
  slots: Partial<Record<BaselineCode, BaselineSlot>>;
  by: string; date: string; note: string;
}
export interface Protection { studyId: string; datasetId: string; versions: number[]; future: boolean }
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
/** 审计 Action 取值固定（Action 筛选的选项来自实际出现过的记录） */
export type AuditAction =
  | 'Study created' | 'Study details updated'
  | 'Member added' | 'Member updated' | 'Blinding status changed' | 'Member removed'
  | 'Study Admin transferred' | 'Event Owner changed' | 'Version registered' | 'Version content replaced' | 'Version archived'
  | 'Study permissions updated' | 'Study deleted' | 'Study archived' | 'Study restored' | 'Blinding enabled' | 'Study unblinded';
export interface StudyDeletionEvidence {
  requestId: string;
  tenant: string;
  checkedRevision: string;
  result: 'Succeeded';
  verification: 'Demo';
}

/** 审计记录：time 为本地 ISO 串 YYYY-MM-DDTHH:mm；changes 一句话；reason 可空 */
export interface AuditEvent { id: string; studyId: string; time: string; actor: string; action: AuditAction; changes: string; reason: string | null; deletion?: StudyDeletionEvidence }
export interface Database {
  studyPolicies?: Record<string, Partial<Record<'document' | 'dataset', Record<string, string>>>>;
  me: { name: string; ini: string };
  seq: { study: number; event: number; asset: number; ds: number; baseline: number; member: number; audit: number };
  studies: Study[]; members: StudyMember[]; assets: Asset[]; baselines: Baseline[]; datasets: Dataset[]; protections: Protection[]; events: EventRec[];
  /** 只增，新的在前 */
  audit: AuditEvent[];
  /** Simulated inputs for sources without a Demo service. */
  studyDeletionSignals?: Record<string, { activeOperations?: number; retentionHold?: boolean; unavailable?: boolean }>;
}

export interface NodeDef {
  id: NodeId; name: string; x: number; row: 1 | 2; w: number; inputs: NodeId[]; unit: string;
  wf: string; wfName: string; up: string; rep: boolean; file?: string;
}
export interface EdgeDef { id: string; to: NodeId; d: string; bx: number; by: number; pop: 'down' | 'up' }
