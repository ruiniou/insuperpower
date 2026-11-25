import { useState } from 'react';
import { ConfirmDialog, Input, Textarea } from '@wiz/react';
import { go } from '../../router';
import { hrefStudy } from '../../store/actions';
import { can } from '../../store/role';
import { S } from '../../store/selectors';
import { toast, useDb } from '../../store/store';
import { checkStudyDeletion, deleteStudy, validateStudyDeletion } from '../../store/studyDeletion';
import type { Errors } from '../../store/study';
import { closeModal, openModal } from '../../store/ui';

const demoPasscode = 'demo';

export function DeleteStudyModal({ sid }: { sid: string }) {
  const { me } = useDb();
  const study = S.workspaceStudy(sid);
  const [check, setCheck] = useState(() => checkStudyDeletion(sid));
  const [checkedAt, setCheckedAt] = useState(() => new Date());
  const [code, setCode] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [passcode, setPasscode] = useState('');
  const [signatureError, setSignatureError] = useState('');

  const recheck = () => {
    setCheck(checkStudyDeletion(sid));
    setCheckedAt(new Date());
    setErrors({});
    setPasscode('');
    setSignatureError('');
  };

  const submit = () => {
    if (check.status !== 'PASS' || errors.form) return;
    const intent = { sid, code, reason, check };
    const current = validateStudyDeletion(intent);
    setErrors(current.errors);
    setCheckedAt(new Date());
    if (current.check.status !== 'PASS') {
      setCheck(current.check);
      setPasscode('');
      setSignatureError('');
      return;
    }
    if (Object.keys(current.errors).length) {
      setPasscode('');
      setSignatureError('');
      return;
    }

    const result = deleteStudy(intent, passcode === demoPasscode ? 'passed' : 'failed', crypto.randomUUID());
    setPasscode('');
    if ('verificationFailed' in result) {
      setSignatureError('Enter the demo passcode to sign and delete.');
      return;
    }
    if ('errors' in result) {
      setErrors(result.errors);
      if (result.check.status !== 'PASS') setCheck(result.check);
      return;
    }
    closeModal();
    go('#/studies');
    toast(`Study ${sid} deleted`, { type: 'success', description: 'This Study can’t be restored.' });
  };

  if (!study) return null;

  if (check.status !== 'PASS' || errors.form) {
    const canArchive = check.status === 'BLOCK' && can('study.archive', { study });
    const description = check.status === 'BLOCK'
      ? [
          check.hasFormalEvidence
            ? 'This study has formal records or retention requirements, so it can’t be deleted as a mistaken creation.'
            : 'This study has work in progress, so it can’t be deleted right now.',
          canArchive ? 'Archive it instead.' : '',
        ].filter(Boolean).join(' ')
      : check.status === 'UNAVAILABLE'
        ? 'Deletion requires an active Study and current deletion permission.'
        : errors.form || 'The dependency check is unavailable. Recheck dependencies to continue.';

    return (
      <ConfirmDialog
        title={`Can’t delete “${study.name}”`}
        width={480}
        description={description}
        confirmLabel={canArchive ? 'Archive study' : 'Recheck Dependencies'}
        cancelLabel="Cancel"
        showConfirm={check.status !== 'UNAVAILABLE'}
        onConfirm={canArchive ? () => openModal({ kind: 'archiveStudy', sid }) : recheck}
        onCancel={closeModal}
      >
        {check.status === 'BLOCK' && (
          <ul className="delete-study-blockers" aria-label="Deletion blockers">
            {check.blockers.map(({ label, detail, destination }) => (
              <li key={label}>
                {destination ? (
                  <a className="delete-study-blocker-row" href={hrefStudy(sid, destination)} onClick={closeModal}>
                    <span>{label}</span>
                    <span className="delete-study-blocker-detail">{detail}</span>
                    <i className="ri-arrow-right-s-line" aria-hidden="true" />
                  </a>
                ) : (
                  <div className="delete-study-blocker-row">
                    <span>{label}</span>
                    {detail && <span className="delete-study-blocker-detail">{detail}</span>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {check.status !== 'UNAVAILABLE' && (
          <div className="delete-study-check-meta">
            <span>Checked at {checkedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}</span>
            {canArchive && <button type="button" onClick={recheck}>Recheck</button>}
          </div>
        )}
      </ConfirmDialog>
    );
  }

  return (
    <ConfirmDialog
      title={`Delete ${study.name}`}
      tone="danger"
      primaryDanger
      width={480}
      description="You can’t restore this Study after deletion."
      confirmLabel="Sign and Delete"
      cancelLabel="Keep Study"
      onConfirm={submit}
      onCancel={closeModal}
    >
      <div className="delete-study-form">
        <Input label="Enter Study Code to Confirm" placeholder={study.id} required value={code} error={errors.code}
          onChange={(e) => { setCode(e.target.value); setErrors((prev) => ({ ...prev, code: '' })); }} />
        <Textarea label="Reason for Deletion" required rows={2} maxLength={1000} value={reason} error={errors.reason}
          onChange={(e) => { setReason(e.target.value); setErrors((prev) => ({ ...prev, reason: '' })); }} />
        <div className="delete-study-signature">
          <p className="study-lifecycle-modal__description">
            Enter “{demoPasscode}” to sign the deletion as {me.name}.
          </p>
          <Input type="password" autoComplete="off" label="Demo Passcode" placeholder="Enter demo passcode" required value={passcode} error={signatureError}
            onChange={(e) => { setPasscode(e.target.value); setSignatureError(''); }} />
        </div>
      </div>
    </ConfirmDialog>
  );
}
