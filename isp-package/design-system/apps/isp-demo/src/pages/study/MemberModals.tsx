import { useState } from 'react';
import { Button, MemberSelect, Message, Modal, Textarea } from '@wiz/react';
import { MemberRowsEditor } from '../MemberRowsEditor';
import {
  activeMembers, addMembers, emptyMemberRow, evKey, isStudyBlinded, membersOf, removalImpact, removeMember, updateMember, wfKey,
  type MemberErrors, type MemberRow,
} from '../../store/members';
import { closeModal } from '../../store/ui';
import { useDb } from '../../store/store';

function Footer({ confirm, onConfirm, disabled }: { confirm: string; onConfirm: () => void; disabled?: boolean }) {
  return (
    <>
      <Button onClick={closeModal}>Cancel</Button>
      <Button variant="primary" status={disabled ? 'disable' : 'default'} onClick={onConfirm}>{confirm}</Button>
    </>
  );
}

/** Add members：MemberRowsEditor（multi）加 Reason。有行失败时弹窗保留，成功的行移出，失败行标红 */
export function AddMembersModal({ sid, userId }: { sid: string; userId: string | null }) {
  useDb();
  const [rows, setRows] = useState<MemberRow[]>(() => [emptyMemberRow(1, userId ? { userId } : {})]);
  const [reason, setReason] = useState('');
  const [er, setEr] = useState<MemberErrors>({});
  const clear = (k: string) => setEr((p) => { if (!(k in p)) return p; const n = { ...p }; delete n[k]; return n; });
  const active = activeMembers(sid).map((m) => m.userId);
  const removed = membersOf(sid).filter((m) => m.status === 'REMOVED').map((m) => m.userId);
  const submit = () => {
    const r = addMembers({ sid, rows, reason });
    setEr(r.errors);
    if (r.done.length) setRows((p) => p.filter((x) => !r.done.includes(x.key)));
    if (!Object.keys(r.errors).length) closeModal();
  };
  return (
    <Modal title="Add members" width={860} onClose={closeModal} footer={<Footer confirm="Add members" onConfirm={submit} />}>
      <div className="app-form">
        {er.form && <Message tone="error">{er.form}</Message>}
        <MemberRowsEditor mode="multi" rows={rows} onChange={setRows} excludeUserIds={active} studyBlinded={isStudyBlinded(sid)} restorableUserIds={removed} errors={er} onClearError={clear} aria-label="Members to add" />
        <Textarea label="Reason" required rows={2} maxLength={1000} placeholder="Why these people need access (applies to everyone added)" value={reason} error={er.reason}
          onChange={(e) => { setReason(e.target.value); clear('reason'); }} />
      </div>
    </Modal>
  );
}

/** Edit role and validity：单行，用户锁定 */
export function EditMemberModal({ sid, memberId }: { sid: string; memberId: string }) {
  useDb();
  const m = membersOf(sid).find((x) => x.id === memberId);
  const [rows, setRows] = useState<MemberRow[]>(() => m ? [emptyMemberRow(1, { userId: m.userId, role: m.role, attr: m.attr, validFrom: m.validFrom, validUntil: m.validUntil ?? '' })] : []);
  const [reason, setReason] = useState('');
  const [er, setEr] = useState<MemberErrors>({});
  const clear = (k: string) => setEr((p) => { if (!(k in p)) return p; const n = { ...p }; delete n[k]; return n; });
  if (!m) return null;
  const submit = () => {
    const r = updateMember({ sid, memberId, row: rows[0], reason });
    if ('errors' in r) { setEr(r.errors); return; }
    closeModal();
  };
  return (
    <Modal title={'Edit role and validity'} width={860} onClose={closeModal} footer={<Footer confirm="Update member" onConfirm={submit} />}>
      <div className="app-form">
        {er.form && <Message tone="error">{er.form}</Message>}
        <MemberRowsEditor mode="single" rows={rows} onChange={setRows} studyBlinded={isStudyBlinded(sid)} unblindedUserIds={m.attr === 'UNBLINDED' ? [m.userId] : []} errors={er} onClearError={clear} aria-label="Member" />
        <Textarea label="Reason" required rows={2} maxLength={1000} placeholder="Why this changes" value={reason} error={er.reason}
          onChange={(e) => { setReason(e.target.value); clear('reason'); }} />
      </div>
    </Modal>
  );
}

/** Remove member：没有运行中的 Workflow 与 Owner 身份时直接移除；否则先逐项选新负责人 */
export function RemoveMemberModal({ sid, memberId }: { sid: string; memberId: string }) {
  useDb();
  const m = membersOf(sid).find((x) => x.id === memberId);
  const [reason, setReason] = useState('');
  const [wf, setWf] = useState<Record<string, string>>({});
  const [ev, setEv] = useState<Record<string, string>>({});
  const [er, setEr] = useState<MemberErrors>({});
  if (!m || m.status !== 'ACTIVE') return null;
  const impact = removalImpact(sid, m.name);
  const needsHandover = impact.workflows.length + impact.events.length > 0;
  const options = activeMembers(sid).filter((x) => x.id !== m.id).map((x) => ({ value: x.name, name: x.name, hint: x.email }));
  const complete = impact.workflows.every(({ event, wf: w }) => wf[wfKey(event.id, w.id)]) && impact.events.every((e) => ev[evKey(e.id)]);
  const submit = () => {
    const r = removeMember({ sid, memberId, reason, workflowOwners: wf, eventOwners: ev });
    if ('errors' in r) { setEr(r.errors); return; }
    closeModal();
  };
  const pick = (k: string, set: (f: (p: Record<string, string>) => Record<string, string>) => void) => (v: string) => { set((p) => ({ ...p, [k]: v })); setEr((p) => { const n = { ...p }; delete n[k]; return n; }); };
  const unsel = (k: string, map: Record<string, string>) => (map[k] ? undefined : <span className="mem-impact__sub">Select a new owner.</span>);
  return (
    <Modal title={'Remove ' + m.name} width={needsHandover ? 620 : 480} onClose={closeModal}
      footer={<Footer confirm={needsHandover ? 'Reassign and remove' : 'Remove'} disabled={!complete} onConfirm={submit} />}>
      <div className="app-form">
        {er.form && <Message tone="error">{er.form}</Message>}
        {needsHandover
          ? <p className="mem-impact__h">{m.name} owns work in this Study. Choose who takes it over before removing {m.name}. Their access ends right away.</p>
          : <p className="mem-impact__h">{m.name} will lose access to this Study. Their record stays in the list as Removed, and you can add them back later.</p>}
        {impact.events.length > 0 && (
          <div className="mem-impact">
            <p className="mem-impact__h">Event Owner</p>
            {impact.events.map((e) => (
              <div className="mem-impact__row" key={e.id}>
                <span className="mem-impact__what"><span className="app-ell">{e.name}</span><span className="mem-impact__sub">{e.id}</span></span>
                <MemberSelect aria-label={'New Event Owner of ' + e.name} placeholder="Select a person" options={options} value={ev[evKey(e.id)] || null} hint={unsel(evKey(e.id), ev)} onChange={pick(evKey(e.id), setEv)} />
              </div>
            ))}
          </div>
        )}
        {impact.workflows.length > 0 && (
          <div className="mem-impact">
            <p className="mem-impact__h">Workflows</p>
            {impact.workflows.map(({ event, wf: w }) => {
              const k = wfKey(event.id, w.id);
              return (
                <div className="mem-impact__row" key={k}>
                  <span className="mem-impact__what"><span className="app-ell">{event.name}</span><span className="mem-impact__sub">{w.id}</span></span>
                  <MemberSelect aria-label={`New owner of ${w.id} in ${event.name}`} placeholder="Select a person" options={options} value={wf[k] || null} hint={unsel(k, wf)} onChange={pick(k, setWf)} />
                </div>
              );
            })}
          </div>
        )}
        <Textarea label="Reason" required rows={2} maxLength={1000} placeholder="Why this person is leaving the Study" value={reason} error={er.reason}
          onChange={(e) => { setReason(e.target.value); setEr((p) => { const n = { ...p }; delete n.reason; return n; }); }} />
      </div>
    </Modal>
  );
}
