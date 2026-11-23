import { useState } from 'react';
import { Button, ConfirmDialog, Message, Modal, Textarea } from '@wiz/react';
import { go } from '../../router';
import { hrefStudy } from '../../store/actions';
import { enableBlinding, unblindStudy, unspecifiedMembers, type BlindingErrors } from '../../store/blinding';
import { canChangeBlinding } from '../../store/members';
import { S } from '../../store/selectors';
import { useDb } from '../../store/store';
import { closeModal } from '../../store/ui';

export function EnableBlindingModal({ sid }: { sid: string }) {
  useDb();
  const study = S.study(sid);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<BlindingErrors>({});
  if (!study) return null;
  const unset = unspecifiedMembers(sid);
  const submit = () => {
    const result = enableBlinding(sid, reason);
    if ('errors' in result) { setErrors(result.errors); return; }
    closeModal();
  };
  return <Modal title="Enable blinding" width={520} onClose={closeModal} footer={<><Button onClick={closeModal}>Keep current status</Button><Button variant="primary" status={unset.length ? 'disable' : 'default'} onClick={submit}>Enable blinding</Button></>}>
    <div className="app-form">
      {errors.form && <Message tone="error">{errors.form}</Message>}
      <Message tone="info">Enabling blinding protects PROD data in this study. Only members set to Unblinded can access protected content when their Role permits it.</Message>
      {unset.length > 0 && <Message tone="warning">
        <div>{canChangeBlinding(sid)
          ? 'Set a blinding status for the listed members before enabling blinding.'
          : 'Ask someone with permission to change member blinding to set a status for the listed members.'}</div>
        <div>{unset.map((m) => m.name).join(', ')}</div>
        {canChangeBlinding(sid) && <Button variant="link" onClick={() => {
          closeModal();
          go(hrefStudy(sid, 'member', 'unspecified'));
        }}>Review members</Button>}
      </Message>}
      <Textarea label="Reason" required rows={2} maxLength={1000} value={reason} error={errors.reason} placeholder="Explain why blinding is being enabled" onChange={(e) => { setReason(e.target.value); setErrors((p) => ({ ...p, reason: '' })); }} />
    </div>
  </Modal>;
}

export function UnblindStudyModal({ sid }: { sid: string }) {
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<BlindingErrors>({});
  const [confirm, setConfirm] = useState(false);
  const submit = () => {
    const result = unblindStudy(sid, reason);
    if ('errors' in result) { setConfirm(false); setErrors(result.errors); return; }
    closeModal();
  };
  if (confirm) return <ConfirmDialog title="Unblind Study?" tone="danger" description="This unblinds the entire study. Information already revealed cannot be hidden again. Member Roles and blinding status, protection records, locked steps, and Workflow results remain unchanged." confirmLabel="Unblind study" cancelLabel="Keep study blinded" onConfirm={submit} onCancel={() => setConfirm(false)} />;
  return <Modal title="Unblind study" width={520} onClose={closeModal} footer={<><Button onClick={closeModal}>Keep study blinded</Button><Button variant="danger" onClick={() => { if (!reason.trim()) { setErrors({ reason: 'Enter a reason for this change.' }); return; } setConfirm(true); }}>Review unblinding</Button></>}>
    <div className="app-form">
      {errors.form && <Message tone="error">{errors.form}</Message>}
      <Message tone="warning">The entire study will become Unblinded. Existing protection records remain, but no protection is active while the study is Unblinded.</Message>
      <Textarea label="Reason" required rows={2} maxLength={1000} value={reason} error={errors.reason} placeholder="Explain why the study is being unblinded" onChange={(e) => { setReason(e.target.value); setErrors((p) => ({ ...p, reason: '' })); }} />
    </div>
  </Modal>;
}
