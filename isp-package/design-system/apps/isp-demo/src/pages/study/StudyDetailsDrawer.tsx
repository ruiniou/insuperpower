import { useEffect, useState, type ReactNode } from 'react';
import { Button, IconButton, Message, Textarea } from '@wiz/react';
import { attrLabel, myMembership, roleLabel } from '../../store/members';
import { can, isWritable } from '../../store/role';
import { S } from '../../store/selectors';
import { PHASES, updateStudyDetails, type StudyDetailsForm } from '../../store/study';
import type { Errors } from '../../store/study';
import { useDb } from '../../store/store';
import { openDrawer } from '../../store/ui';
import { StudyFields } from '../StudyFields';
import { BlindTag, LifecycleTag } from './common';

/** 一行：左键右值。只读与编辑共用这套排版，编辑时只把可改项的值换成控件，行高与列宽不变 */
function Row({ k, children, top }: { k: string; children: ReactNode; top?: boolean }) {
  return <div className={top ? 'sd__row sd__row--top' : 'sd__row'}><span className="sd__k">{k}</span><div className="sd__v">{children}</div></div>;
}

/** Study details：嵌在页面里的圆角卡片（页面级拼装）。归档后 Edit 不渲染（由 isWritable 控制，页内 banner 已说明原因）。 */
export function StudyDetailsDrawer({ id }: { id: string }) {
  useDb();
  const s = S.study(id);
  const mine = myMembership(id);
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState<StudyDetailsForm>({ name: '', desc: '', ta: '', phase: '', reason: '' });
  const [er, setEr] = useState<Errors>({});
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') openDrawer(null); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, []);
  if (!s) return null;
  const editable = isWritable(id) && can('study.metadata.update', { study: s });
  const start = () => { setF({ name: s.name, desc: s.desc, ta: s.ta, phase: s.phase, reason: '' }); setEr({}); setEditing(true); };
  const save = () => { const r = updateStudyDetails(s.id, f); if ('errors' in r) setEr(r.errors); else setEditing(false); };
  const set = (p: Partial<StudyDetailsForm>) => setF({ ...f, ...p });
  return (
    <aside className={editing ? 'sd is-editing' : 'sd'} aria-label="Study details">
      <div className="sd__head">
        <span className="sd__title">Study details<span className="sd__sub">{s.id}</span></span>
        <span className="sd__acts">
          {editable && !editing && <Button size="small" leftIcon="ri-edit-line" onClick={start}>Edit</Button>}
          <IconButton icon="ri-close-line" size="small" aria-label="Close" onClick={() => openDrawer(null)} />
        </span>
      </div>
      <div className="sd__body">
        <StudyFields mode={editing ? 'edit' : 'view'} idLocked values={{ id: s.id, name: editing ? f.name : s.name, desc: editing ? f.desc : s.desc, ta: editing ? f.ta : s.ta, phase: editing ? f.phase : s.phase }}
          errors={er} onChange={(k, v) => { if (k !== 'id') set({ [k]: v } as Partial<StudyDetailsForm>); }} />
        <Row k="Study Admin">{s.admin}</Row>
        <Row k="Blinding"><BlindTag v={s.blinding} /></Row>
        <Row k="My role">{mine ? roleLabel(mine.role) : '—'}</Row>
        <Row k="My blinding status">{mine ? attrLabel(mine.attr) : '—'}</Row>
        <Row k="Lifecycle"><LifecycleTag v={s.lifecycle} /></Row>
        <Row k="Tenant">{s.tenant}</Row>
        <Row k="Created by">{s.createdBy}</Row>
        <Row k="Created">{s.createdAt}</Row>
        <Row k="Updated">{s.updated}</Row>
        {editing && er.form && <Message tone="error">{er.form}</Message>}
        {editing && <Row k="Reason" top><Textarea aria-label="Reason for Change" rows={2} maxLength={1000} placeholder="Reason for change (required)" value={f.reason} error={er.reason} onChange={(e) => set({ reason: e.target.value })} /></Row>}
      </div>
      {editing && <div className="sd__foot"><Button size="small" onClick={() => setEditing(false)}>Cancel</Button><Button size="small" variant="primary" onClick={save}>Save</Button></div>}
    </aside>
  );
}
