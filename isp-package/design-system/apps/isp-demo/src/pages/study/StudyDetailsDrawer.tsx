import { useEffect, useState, type ReactNode } from 'react';
import { Button, IconButton, Input, Select, Textarea, Tooltip } from '@wiz/react';
import { can } from '../../store/role';
import { S } from '../../store/selectors';
import { PHASES, updateStudyDetails, type StudyDetailsForm } from '../../store/study';
import type { Errors } from '../../store/study';
import { useDb } from '../../store/store';
import { openDrawer } from '../../store/ui';
import { BlindTag, LifecycleTag } from './common';

/** 一行：左键右值。只读与编辑共用这套排版，编辑时只把可改项的值换成控件，行高与列宽不变 */
function Row({ k, children, top }: { k: string; children: ReactNode; top?: boolean }) {
  return <div className={top ? 'sd__row sd__row--top' : 'sd__row'}><span className="sd__k">{k}</span><div className="sd__v">{children}</div></div>;
}

/** Study details：嵌在页面里的圆角卡片（页面级拼装）。默认只读；有 study.metadata.update 的职责可点 Edit，修改原因必填 */
export function StudyDetailsDrawer({ id }: { id: string }) {
  useDb();
  const s = S.study(id);
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState<StudyDetailsForm>({ name: '', desc: '', ta: '', phase: '', reason: '' });
  const [er, setEr] = useState<Errors>({});
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') openDrawer(null); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, []);
  if (!s) return null;
  const editable = can('study.metadata.update', { study: s });
  const archived = s.lifecycle !== 'ACTIVE';
  const start = () => { setF({ name: s.name, desc: s.desc, ta: s.ta, phase: s.phase, reason: '' }); setEr({}); setEditing(true); };
  const save = () => { const r = updateStudyDetails(s.id, f); if ('errors' in r) setEr(r.errors); else setEditing(false); };
  const phases = (s.phase && !PHASES.includes(s.phase) ? [s.phase] : []).concat(PHASES).map((p) => ({ value: p, label: p }));
  const set = (p: Partial<StudyDetailsForm>) => setF({ ...f, ...p });
  return (
    <aside className={editing ? 'sd is-editing' : 'sd'} aria-label="Study details">
      <div className="sd__head">
        <span className="sd__title">Study details<span className="sd__sub">{s.id}</span></span>
        <span className="sd__acts">
          {editable && !editing && (archived
            ? <Tooltip content="This study is archived and read-only." direction="bottom"><span className="sd__edit-off"><Button size="small" leftIcon="ri-edit-line" disabled>Edit</Button></span></Tooltip>
            : <Button size="small" leftIcon="ri-edit-line" onClick={start}>Edit</Button>)}
          <IconButton icon="ri-close-line" size="small" aria-label="Close" onClick={() => openDrawer(null)} />
        </span>
      </div>
      <div className="sd__body">
        <Row k="Study ID">{s.id}</Row>
        <Row k="Study Name">{editing ? <Input aria-label="Study Name" maxLength={200} autoFocus value={f.name} error={er.name} onChange={(e) => set({ name: e.target.value })} /> : s.name}</Row>
        <Row k="Description" top>{editing ? <Textarea aria-label="Description" rows={3} maxLength={2000} value={f.desc} error={er.desc} onChange={(e) => set({ desc: e.target.value })} /> : (s.desc || '—')}</Row>
        <Row k="Therapeutic Area">{editing ? <Input aria-label="Therapeutic Area" value={f.ta} onChange={(e) => set({ ta: e.target.value })} /> : (s.ta || '—')}</Row>
        <Row k="Phase">{editing ? <Select aria-label="Phase" options={phases} value={f.phase} onChange={(v) => set({ phase: v })} /> : (s.phase || '—')}</Row>
        <Row k="Study Admin">{s.admin}</Row>
        <Row k="Blinding"><BlindTag v={s.blinding} /></Row>
        <Row k="Lifecycle"><LifecycleTag v={s.lifecycle} /></Row>
        <Row k="Tenant">{s.tenant}</Row>
        <Row k="Created by">{s.createdBy}</Row>
        <Row k="Created">{s.createdAt}</Row>
        <Row k="Updated">{s.updated}</Row>
        {editing && <Row k="Reason" top><Textarea aria-label="Reason for Change" rows={2} maxLength={1000} placeholder="Reason for change (required)" value={f.reason} error={er.reason} onChange={(e) => set({ reason: e.target.value })} /></Row>}
      </div>
      {editing && <div className="sd__foot"><Button size="small" onClick={() => setEditing(false)}>Cancel</Button><Button size="small" variant="primary" onClick={save}>Save</Button></div>}
    </aside>
  );
}
