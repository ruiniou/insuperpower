import { useEffect, useRef, useState } from 'react';
import { Button, Divider, ConfirmDialog, EmptyState, IconButton, Message, Select, Status, Tooltip } from '@wiz/react';
import { MemberRowsEditor } from './MemberRowsEditor';
import { StudyFields } from './StudyFields';
import { go, leave } from '../router';
import { hrefStudy } from '../store/actions';
import { type MemberRow } from '../store/members';
import { BLIND_ATTRS, ROLES } from '../store/people';
import { can } from '../store/role';
import { useDb } from '../store/store';
import { createStudy, emptyStudyForm, validateStudyForm, type CreateStudyForm, type Errors } from '../store/study';

/** 板块说明：标题右侧的 Info 图标，悬停显示 */
function Info({ lines }: { lines: string[] }) {
  return <Tooltip content={<span className="csf-tip">{lines.map((l) => <span key={l}>{l}</span>)}</span>} direction="right"><IconButton size="compact" icon="ri-information-line" aria-label="Info" tooltip={false} /></Tooltip>;
}
const TEXT_KEYS = ['id', 'name', 'desc', 'ta'] as const;
const blank = (m: MemberRow) => !m.userId && !m.validFrom.trim() && !m.validUntil.trim();

/** #/studies/new：整页表单。创建后直接进入新 Study 的 Events（不设成功页） */
export function CreateStudyPage() {
  if (!can('study.create')) {
    return (
      <EmptyState className="app-empty" title="You don't have permission to create Studies" description="Ask an authorized administrator to create the Study for you."
        action={<Button onClick={() => go('#/studies')}>Back to Studies</Button>} />
    );
  }
  return <CreateStudyForm />;
}

function CreateStudyForm() {
  const db = useDb();
  const [f, setF] = useState<CreateStudyForm>(emptyStudyForm);
  const [er, setEr] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState<null | (() => void)>(null);
  const root = useRef<HTMLFormElement>(null);
  const focusPending = useRef(false);

  const dirty = !!(f.id || f.name || f.desc || f.ta || f.phase || f.role !== 'STAT' || f.attr !== 'UNSET' || f.members.some((m) => !blank(m)));
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    leave.guard = (proceed) => { if (!dirtyRef.current) return false; setLeaving(() => proceed); return true; };
    return () => { leave.guard = null; };
  }, []);

  useEffect(() => {
    if (!focusPending.current || !Object.keys(er).length) return;
    focusPending.current = false;
    const first = root.current?.querySelector('.wiz-field__error')?.closest('.wiz-field');
    const target = first?.querySelector<HTMLElement>('input, textarea, button, [role="combobox"]');
    target?.scrollIntoView({ block: 'center' });
    target?.focus();
  }, [er]);

  const set = <K extends keyof CreateStudyForm>(k: K, v: CreateStudyForm[K]) => setF((p) => ({ ...p, [k]: v }));
  const clearErr = (k: string) => setEr((p) => { if (!(k in p)) return p; const n = { ...p }; delete n[k]; return n; });
  const checkField = (k: (typeof TEXT_KEYS)[number]) => {
    const e = validateStudyForm({ ...f })[k];
    setEr((p) => { const n = { ...p }; if (e) n[k] = e; else delete n[k]; return n; });
  };
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    // 完全空白的成员行（没选人、没填日期）忽略；填了一部分的照常校验
    const form = { ...f, members: f.members.filter((m) => !blank(m)) };
    const local = validateStudyForm(form);
    if (Object.keys(local).length) { focusPending.current = true; setEr(local); return; }
    setBusy(true);
    window.setTimeout(() => {
      const r = createStudy(form);
      if ('errors' in r) { focusPending.current = true; setEr(r.errors); setBusy(false); return; }
      leave.guard = null; // 已提交，不再拦截
      go(hrefStudy(r.id, 'events'));
    }, 500);
  };

  return (
    <>
      <form className="csf" ref={root} onSubmit={submit} noValidate aria-label="New Study">
        <div className="csf-scroll">
          <div className="csf-body">
            {er.form && <Message tone="error">{er.form}</Message>}

            <section className="csf-sec" aria-labelledby="csf-h1">
              <div className="csf-hrow"><h2 className="csf-h" id="csf-h1">Study details</h2></div>
              <StudyFields mode="create" autoFocusId values={f} errors={er}
                onChange={(k, v) => { set(k, v); clearErr(k); }} onBlur={(k) => { if (k !== 'phase') checkField(k); }} />
            </section>
            <Divider />
            <section className="csf-sec" aria-labelledby="csf-h3">
              <div className="csf-hrow">
                <h2 className="csf-h" id="csf-h3">Members</h2>
                <Info lines={['You become the Study Admin and can hand it over later.', 'Add more members now, or later in the Member tab.']} />
              </div>
              <MemberRowsEditor mode="multi" studyBlinded={false} rows={f.members} onChange={(rows) => set('members', rows)} errors={er} onClearError={clearErr}
                lead={(
                  <div className="mre-item mre-item--lead" role="row">
                    <div className="mre-row">
                      <span role="cell" className="mre-who">
                        <span className="mre-who__name">{db.me.name}</span>
                        <Status variant="style1" tone="blue" textCase="normal">Study Admin</Status>
                      </span>
                      <span role="cell"><Select aria-label="Your Role" options={ROLES} value={f.role} onChange={(v) => set('role', v)} /></span>
                      <span role="cell"><Select aria-label="Your blinding" options={BLIND_ATTRS} value={f.attr} onChange={(v) => set('attr', v)} /></span>
                      <span role="cell" className="mre-na">—</span><span role="cell" className="mre-na">—</span><span role="cell" />
                    </div>
                  </div>
                )} />
            </section>
          </div>
        </div>
        <div className="csf-foot">
          <Button type="button" disabled={busy} onClick={() => go('#/studies')}>Cancel</Button>
          <Button type="submit" variant="primary" status={busy ? 'loading' : 'default'}>{busy ? 'Creating…' : 'Create Study'}</Button>
        </div>
      </form>
      {leaving && (
        <ConfirmDialog tone="danger" title="Discard Changes?"
          description="This Study has not been created yet. If you leave now, the details you entered will be lost."
          confirmLabel="Discard Changes" cancelLabel="Keep Editing"
          onCancel={() => setLeaving(null)} onConfirm={() => { const p = leaving; setLeaving(null); leave.guard = null; p(); }} />
      )}
    </>
  );
}
