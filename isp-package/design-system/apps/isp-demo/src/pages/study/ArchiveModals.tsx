import { useState } from 'react';
import { Button, Message, Modal, Table, Textarea } from '@wiz/react';
import { go } from '../../router';
import { hrefEvent } from '../../store/actions';
import { S } from '../../store/selectors';
import { archiveCheck, archiveStudy, restoreStudy, type Errors } from '../../store/study';
import { closeModal } from '../../store/ui';

function ModalFooter({ confirm, onConfirm, disabled }: { confirm: string; onConfirm: () => void; disabled?: boolean }) {
  return (
    <>
      <Button onClick={closeModal}>Cancel</Button>
      <Button variant="primary" status={disabled ? 'disable' : 'default'} onClick={onConfirm}>{confirm}</Button>
    </>
  );
}

export function ArchiveStudyModal({ sid }: { sid: string }) {
  const s = S.study(sid);
  const [check, setCheck] = useState(() => archiveCheck(sid));
  const [reason, setReason] = useState('');
  const [er, setEr] = useState<Errors>({});

  if (!s) return null;

  const isBlocked = check.status === 'BLOCK';

  const submit = () => {
    const result = archiveStudy(sid, reason);
    if ('errors' in result) {
      if (result.check) setCheck(result.check);
      setEr(result.errors);
      return;
    }
    closeModal();
  };

  return (
    <Modal
      title={`Archive study ${s.id} — ${s.name}`}
      className="study-lifecycle-modal"
      width={560}
      closeOnOverlayClick={false}
      onClose={closeModal}
      footer={
        <ModalFooter
          confirm="Archive study"
          disabled={isBlocked}
          onConfirm={submit}
        />
      }
    >
      <div className="app-form">
        {er.form && <Message tone="error">{er.form}</Message>}

        <p className="study-lifecycle-modal__description">
          Archiving will make this study read-only without deleting data or halting ongoing work. Authorized users can restore it at any time.
        </p>

        {isBlocked ? (
          <>
            <Message tone="warning">Resolve the items below, then reopen this dialog to check again.</Message>
            <Table
              aria-label="Archive blockers"
              variant="plain"
              columnLayout="fixed"
              columns={[
                { key: 'label', header: 'Blocker', width: 156 },
                { key: 'eventName', header: 'Event' },
                { key: 'count', header: 'Count', width: 60, align: 'right' },
                { key: 'eventId', header: 'Action', width: 118, align: 'right', render: (id: string) => (
                  <Button size="small" variant="link" onClick={() => {
                    closeModal();
                    go(hrefEvent(id, 'overview'));
                  }}>Go to {id}</Button>
                ) },
              ]}
              rows={check.items.flatMap((item) => item.sources.map((source) => ({
                ...source, id: item.key + ':' + source.eventId, label: item.label,
              })))}
            />
          </>
        ) : <Message tone="success">Dependency check passed.</Message>}

        <Textarea
          label="Reason"
          required
          rows={2}
          maxLength={1000}
          placeholder="Explain why this study is being archived"
          value={reason}
          error={er.reason}
          onChange={(e) => {
            setReason(e.target.value);
            setEr((p) => {
              const copy = { ...p };
              delete copy.reason;
              return copy;
            });
          }}
        />
      </div>
    </Modal>
  );
}

export function RestoreStudyModal({ sid }: { sid: string }) {
  const s = S.study(sid);
  const [reason, setReason] = useState('');
  const [er, setEr] = useState<Errors>({});

  if (!s) return null;

  const submit = () => {
    const res = restoreStudy(sid, reason);
    if ('errors' in res) {
      setEr(res.errors);
      return;
    }
    closeModal();
  };

  return (
    <Modal
      title={`Restore study ${s.id} — ${s.name}`}
      className="study-lifecycle-modal"
      width={520}
      onClose={closeModal}
      footer={<ModalFooter confirm="Restore study" onConfirm={submit} />}
    >
      <div className="app-form">
        {er.form && <Message tone="error">{er.form}</Message>}

        <p className="study-lifecycle-modal__description">
          The study will return to Active status. Existing archived events, locked steps, and blinding configurations will remain unchanged.
        </p>

        <Textarea
          label="Reason"
          required
          rows={2}
          maxLength={1000}
          placeholder="Explain why this study is being restored"
          value={reason}
          error={er.reason}
          onChange={(e) => {
            setReason(e.target.value);
            setEr((p) => {
              const copy = { ...p };
              delete copy.reason;
              return copy;
            });
          }}
        />
      </div>
    </Modal>
  );
}
