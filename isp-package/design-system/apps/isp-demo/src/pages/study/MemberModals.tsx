import { useState } from 'react';
import { Button, Field, MemberSelect, Message, Modal, Select, Textarea } from '@wiz/react';
import { MemberRowsEditor } from '../MemberRowsEditor';
import {
  activeMembers, addMembers, attrLabel, canChangeBlinding, changeBlinding, emptyMemberRow, evKey, isStudyBlinded, membersOf, MSG_NO_REVERT, MSG_NO_UNSET, MSG_NOT_ENFORCED, MSG_REQUIRED_BLINDED,
  removalImpact, removeMember, roleLabel, transferStudyAdmin, updateMember, wfKey,
  type MemberErrors, type MemberRow,
} from '../../store/members';
import { BLIND_ATTRS } from '../../store/people';
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
  const removedMembers = membersOf(sid).filter((m) => m.status === 'REMOVED');
  const removed = removedMembers.map((m) => m.userId);
  const prevAttrs = Object.fromEntries(removedMembers.map((m) => [m.userId, m.attr]));
  const submit = () => {
    const r = addMembers({ sid, rows, reason });
    setEr(r.errors);
    if (r.done.length) setRows((p) => p.filter((x) => !r.done.includes(x.key)));
    if (!Object.keys(r.errors).length) closeModal();
  };
  return (
    <Modal title="Add members" width={520} onClose={closeModal} footer={<Footer confirm="Add" onConfirm={submit} />}>
      <div className="app-form">
        {er.form && <Message tone="error">{er.form}</Message>}
        <MemberRowsEditor layout="stacked" mode="multi" rows={rows} onChange={setRows} excludeUserIds={active} studyBlinded={isStudyBlinded(sid)} restorableUserIds={removed} prevAttrs={prevAttrs} attrLocked={!canChangeBlinding(sid)} errors={er} onClearError={clear} aria-label="Members to add" />
        <Textarea label="Reason" required rows={2} maxLength={1000} placeholder="Why these people are being added" value={reason} error={er.reason}
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
    <Modal title="Edit role and validity" width={520} onClose={closeModal} footer={<Footer confirm="Update" onConfirm={submit} />}>
      <div className="app-form">
        {er.form && <Message tone="error">{er.form}</Message>}
        <MemberRowsEditor layout="stacked" mode="single" attrLocked rows={rows} onChange={setRows} studyBlinded={isStudyBlinded(sid)} errors={er} onClearError={clear} aria-label="Member" />
        <Textarea label="Reason" required rows={2} maxLength={1000} placeholder="Why the role or validity is changing" value={reason} error={er.reason}
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
  return (
    <Modal title={'Remove ' + m.name} width={480} onClose={closeModal}
      footer={<Footer confirm={needsHandover ? 'Reassign and remove' : 'Remove'} disabled={!complete} onConfirm={submit} />}>
      <div className="app-form">
        {er.form && <Message tone="error">{er.form}</Message>}
        {needsHandover
          ? <p className="mem-impact__h">{m.name} owns work in this Study. Choose who takes it over, then remove them.</p>
          : <p className="mem-impact__h">{m.name} will lose access to this Study. You can add them back later.</p>}
        {impact.events.length > 0 && (
          <div className="mem-impact">
                        {impact.events.map((e) => (
              <div className="mem-impact__row" key={e.id}>
                <span className="mem-impact__what"><span className="app-ell">{e.name}</span><span className="mem-impact__sub">Event Owner</span></span>
                <MemberSelect aria-label={'New Event Owner of ' + e.name} placeholder="Select a new owner" options={options} value={ev[evKey(e.id)] || null} onChange={pick(evKey(e.id), setEv)} />
              </div>
            ))}
          </div>
        )}
        {impact.workflows.length > 0 && (
          <div className="mem-impact">
                        {impact.workflows.map(({ event, wf: w }) => {
              const k = wfKey(event.id, w.id);
              return (
                <div className="mem-impact__row" key={k}>
                  <span className="mem-impact__what"><span className="app-ell">{event.name}</span><span className="mem-impact__sub">Workflow {w.id}</span></span>
                  <MemberSelect aria-label={`New owner of ${w.id} in ${event.name}`} placeholder="Select a new owner" options={options} value={wf[k] || null} onChange={pick(k, setWf)} />
                </div>
              );
            })}
          </div>
        )}
        <Textarea label="Reason" required rows={2} maxLength={1000} placeholder={`Why ${m.name} is being removed`} value={reason} error={er.reason}
          onChange={(e) => { setReason(e.target.value); setEr((p) => { const n = { ...p }; delete n.reason; return n; }); }} />
      </div>
    </Modal>
  );
}

/** Change blinding status：独立动作、独立点位，Reason 必填；选中值等于当前值时按钮禁用 */
export function ChangeBlindingModal({ sid, memberId }: { sid: string; memberId: string }) {
  useDb();
  const m = membersOf(sid).find((x) => x.id === memberId);
  const [attr, setAttr] = useState<string>(m?.attr ?? 'UNSET');
  const [reason, setReason] = useState('');
  const [er, setEr] = useState<MemberErrors>({});
  if (!m || m.status !== 'ACTIVE') return null;
  const blinded = isStudyBlinded(sid), wasUnblinded = m.attr === 'UNBLINDED', wasSet = m.attr !== 'UNSET';
  const dis = (v: string) => (v === 'BLINDED' && wasUnblinded) || (v === 'UNSET' && (blinded || wasSet));
  const hints = [wasUnblinded ? MSG_NO_REVERT : '', wasSet ? MSG_NO_UNSET : '', blinded ? MSG_REQUIRED_BLINDED : MSG_NOT_ENFORCED].filter(Boolean);
  const submit = () => {
    const r = changeBlinding({ sid, memberId, attr, reason });
    if ('errors' in r) { setEr(r.errors); return; }
    closeModal();
  };
  return (
    <Modal title={`Change blinding status of ${m.name}`} width={480} onClose={closeModal} footer={<Footer confirm="Change" disabled={attr === m.attr} onConfirm={submit} />}>
      <div className="app-form">
        {er.form && <Message tone="error">{er.form}</Message>}
        <Field label="Blinding status" required error={er.attr} hint={hints.length ? <span className="mem-hints">{hints.map((t) => <span key={t}>{t}</span>)}</span> : undefined}>
          <Select aria-label="Blinding status" options={BLIND_ATTRS.map((a) => ({ value: a.value, label: a.label, disabled: dis(a.value) }))} value={attr} onChange={(v) => { setAttr(v); setEr((p) => { const n = { ...p }; delete n.attr; return n; }); }} />
        </Field>
        {blinded && attr === 'UNBLINDED' && m.attr !== 'UNBLINDED' && <Message tone="warning">This person will be able to see unblinded data.</Message>}
        <Textarea label="Reason" required rows={2} maxLength={1000} placeholder="Why the blinding status is changing" value={reason} error={er.reason}
          onChange={(e) => { setReason(e.target.value); setEr((p) => { const n = { ...p }; delete n.reason; return n; }); }} />
      </div>
    </Modal>
  );
}

/** Transfer Study Admin：从其他 Active 成员里选新 Admin，Reason 必填 */
export function TransferAdminModal({ sid }: { sid: string }) {
  useDb();
  const cur = membersOf(sid).find((x) => x.isAdmin);
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');
  const [er, setEr] = useState<MemberErrors>({});
  if (!cur) return null;
  const options = activeMembers(sid).filter((x) => !x.isAdmin).map((x) => ({ value: x.id, name: x.name, hint: roleLabel(x.role) }));
  const none = options.length === 0;
  const submit = () => {
    const r = transferStudyAdmin({ sid, toMemberId: to, reason });
    if ('errors' in r) { setEr(r.errors); return; }
    closeModal();
  };
  return (
    <Modal title="Transfer Study Admin" width={480} onClose={closeModal} footer={<Footer confirm="Transfer" disabled={none} onConfirm={submit} />}>
      <div className="app-form">
        {er.form && <Message tone="error">{er.form}</Message>}
        <p className="mem-impact__h">Current Study Admin: <b>{cur.name}</b>. They stay a member with the same Role, blinding status and validity.</p>
        <MemberSelect label="New Study Admin" required aria-label="New Study Admin" disabled={none} placeholder={none ? 'No other active members' : 'Select a person'} options={options} value={to || null} error={er.to}
          onChange={(v) => { setTo(v); setEr((p) => { const n = { ...p }; delete n.to; return n; }); }} />
        <Textarea label="Reason" required rows={2} maxLength={1000} placeholder="Why the Study Admin is changing hands" value={reason} error={er.reason}
          onChange={(e) => { setReason(e.target.value); setEr((p) => { const n = { ...p }; delete n.reason; return n; }); }} />
      </div>
    </Modal>
  );
}
