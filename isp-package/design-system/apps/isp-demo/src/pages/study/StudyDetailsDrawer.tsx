import { useState } from 'react';
import { Button, Drawer, DrawerRow, Input, Select, Textarea } from '@wiz/react';
import { can } from '../../store/role';
import { S } from '../../store/selectors';
import { PHASES, updateStudyDetails, type StudyDetailsForm } from '../../store/study';
import type { Errors } from '../../store/study';
import { useDb } from '../../store/store';
import { openDrawer, setDrawerWidth, ui } from '../../store/ui';
import { BlindTag, LifecycleTag } from './common';

const HEADER_H = 48;

/** Study details 抽屉：默认只读；有 study.metadata.update 的职责可编辑，修改原因必填 */
export function StudyDetailsDrawer({ id }: { id: string }) {
  useDb();
  const s = S.study(id);
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState<StudyDetailsForm>({ name: '', desc: '', ta: '', phase: '', reason: '' });
  const [er, setEr] = useState<Errors>({});
  if (!s) return null;
  const editable = can('study.metadata.update');
  const start = () => { setF({ name: s.name, desc: s.desc, ta: s.ta, phase: s.phase, reason: '' }); setEr({}); setEditing(true); };
  const save = () => { const r = updateStudyDetails(s.id, f); if ('errors' in r) setEr(r.errors); else setEditing(false); };
  const phases = (s.phase && !PHASES.includes(s.phase) ? [s.phase] : []).concat(PHASES).map((p) => ({ value: p, label: p }));
  return (
    <Drawer title="Study details" subtitle={s.id} top={HEADER_H} width={ui.drawerWidth} onWidthChange={setDrawerWidth} onClose={() => openDrawer(null)} aria-label="Study details">
      {editing ? (
        <div className="app-form app-drawer-form">
          <Input label="Study ID" value={s.id} disabled readOnly />
          <Input label="Study Name" required maxLength={200} autoFocus value={f.name} error={er.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Textarea label="Description" rows={3} maxLength={2000} value={f.desc} error={er.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} />
          <Input label="Therapeutic Area" value={f.ta} onChange={(e) => setF({ ...f, ta: e.target.value })} />
          <Select label="Phase" options={phases} value={f.phase} onChange={(v) => setF({ ...f, phase: v })} />
          <Textarea label="Reason for Change" required rows={2} maxLength={1000} value={f.reason} error={er.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
          <div className="app-drawer-form__acts"><Button onClick={() => setEditing(false)}>Cancel</Button><Button variant="primary" onClick={save}>Save</Button></div>
        </div>
      ) : (
        <>
          <DrawerRow label="Study ID">{s.id}</DrawerRow>
          <DrawerRow label="Study Name">{s.name}</DrawerRow>
          <DrawerRow label="Description">{s.desc || '—'}</DrawerRow>
          <DrawerRow label="Therapeutic Area">{s.ta || '—'}</DrawerRow>
          <DrawerRow label="Phase">{s.phase || '—'}</DrawerRow>
          <DrawerRow label="Study Admin">{s.admin}</DrawerRow>
          <DrawerRow label="Blinding"><BlindTag v={s.blinding} /></DrawerRow>
          <DrawerRow label="Lifecycle"><LifecycleTag v={s.lifecycle} /></DrawerRow>
          <DrawerRow label="Tenant">{s.tenant}</DrawerRow>
          <DrawerRow label="Created by">{s.createdBy}</DrawerRow>
          <DrawerRow label="Created">{s.createdAt}</DrawerRow>
          <DrawerRow label="Updated">{s.updated}</DrawerRow>
          {editable && <div className="app-drawer-form__acts"><Button leftIcon="ri-edit-line" onClick={start}>Edit</Button></div>}
        </>
      )}
    </Drawer>
  );
}
