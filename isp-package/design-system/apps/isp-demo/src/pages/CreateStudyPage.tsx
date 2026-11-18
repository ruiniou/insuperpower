import { useEffect, useRef, useState } from 'react';
import { Avatar, Button, Divider, ConfirmDialog, EmptyState, Field, IconButton, Input, MemberSelect, Message, Select, Status, Textarea, Tooltip } from '@wiz/react';
import { StudyFields } from './StudyFields';
import { go, leave } from '../router';
import { hrefStudy } from '../store/actions';
import { ROLES, TENANT_USERS } from '../store/people';
import { can } from '../store/role';
import { useDb } from '../store/store';
import { createStudy, emptyStudyForm, memberKey, PHASES, validateMemberRow, validateStudyForm, type CreateStudyForm, type Errors } from '../store/study';

const NONE = '';
const emptyDraft = () => ({ user: '', role: 'VIEW', from: '', to: '' });
const userOf = (id: string) => TENANT_USERS.find((u) => u.id === id);
/** 板块说明：标题右侧的 Info 图标，悬停显示 */
function Info({ lines }: { lines: string[] }) {
  return <Tooltip content={<span className="csf-tip">{lines.map((l) => <span key={l}>{l}</span>)}</span>} direction="right"><IconButton size="compact" icon="ri-information-line" aria-label="Info" tooltip={false} /></Tooltip>;
}
const TEXT_KEYS = ['id', 'name', 'desc', 'ta'] as const;
const memberOptions = TENANT_USERS.map((u) => ({ value: u.id, name: u.name, hint: u.email }));

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
  const [draft, setDraft] = useState(emptyDraft);
  const [dEr, setDEr] = useState<Errors>({});
  const [leaving, setLeaving] = useState<null | (() => void)>(null);
  const root = useRef<HTMLFormElement>(null);
  const nextKey = useRef(1);
  const focusPending = useRef(false);

  const dirty = !!(f.id || f.name || f.desc || f.ta || f.phase || f.role || f.members.length);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    leave.guard = (proceed) => { if (!dirtyRef.current) return false; setLeaving(() => proceed); return true; };
    return () => { leave.guard = null; };
  }, []);

  useEffect(() => {
    if (!focusPending.current || !(Object.keys(er).length || Object.values(dEr).some(Boolean))) return;
    focusPending.current = false;
    const first = root.current?.querySelector('.wiz-field__error')?.closest('.wiz-field');
    const target = first?.querySelector<HTMLElement>('input, textarea, button, [role="combobox"]');
    target?.scrollIntoView({ block: 'center' });
    target?.focus();
  }, [er, dEr]);

  const set = <K extends keyof CreateStudyForm>(k: K, v: CreateStudyForm[K]) => setF((p) => ({ ...p, [k]: v }));
  const setRow = (key: number, patch: Partial<CreateStudyForm['members'][number]>) => {
    setF((p) => ({ ...p, members: p.members.map((m) => (m.key === key ? { ...m, ...patch } : m)) }));
  };
  const clearErr = (k: string) => setEr((p) => { if (!(k in p)) return p; const n = { ...p }; delete n[k]; return n; });
  const checkField = (k: (typeof TEXT_KEYS)[number]) => {
    const e = validateStudyForm({ ...f })[k];
    setEr((p) => { const n = { ...p }; if (e) n[k] = e; else delete n[k]; return n; });
  };
  const addDraft = () => {
    const e = validateMemberRow(draft);
    if (Object.keys(e).length) { setDEr(e); return; }
    setF((p) => ({ ...p, members: [...p.members, { key: nextKey.current++, ...draft, from: draft.from.trim(), to: draft.to.trim() }] }));
    setDraft(emptyDraft()); setDEr({});
  };
  const removeRow = (key: number) => {
    setF((p) => ({ ...p, members: p.members.filter((m) => m.key !== key) }));
    setEr((p) => Object.fromEntries(Object.entries(p).filter(([k]) => !k.startsWith('m:' + key + ':'))));
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    const local = validateStudyForm(f);
    // 添加行填了内容但没点 Add：校验通过就随表单一并提交，不通过则在添加行报错；完全空白的添加行忽略
    const pending = !!(draft.user || draft.from || draft.to);
    const de = pending ? validateMemberRow(draft) : {};
    if (Object.keys(local).length || Object.keys(de).length) { focusPending.current = true; setEr(local); setDEr(de); return; }
    const form = pending ? { ...f, members: [...f.members, { key: nextKey.current++, ...draft, from: draft.from.trim(), to: draft.to.trim() }] } : f;
    setDEr({});
    setBusy(true);
    window.setTimeout(() => {
      const r = createStudy(form);
      if ('errors' in r) { focusPending.current = true; setEr(r.errors); setBusy(false); return; }
      leave.guard = null; // 已提交，不再拦截
      go(hrefStudy(r.id, 'events'));
    }, 500);
  };

  const rowErr = Object.entries(er).some(([k]) => k.startsWith('m:'));
  const taken = (key: number) => new Set(f.members.filter((m) => m.key !== key && m.user).map((m) => m.user));

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
              <div className="csf-members" role="table" aria-label="Members">
                <div className="csf-mrow csf-mrow--head" role="row">
                  <span role="columnheader">Person</span><span role="columnheader">Role</span><span role="columnheader">From</span><span role="columnheader">To</span><span role="columnheader"><span className="csf-sr">Action</span></span>
                </div>
                <div className="csf-mrow csf-mrow--item" role="row">
                  <span role="cell" className="csf-who"><MemberSelect disabled aria-label="Study Admin" options={[{ value: 'me', name: db.me.name, initials: db.me.ini }]} value="me" /><Status variant="style1" tone="blue" textCase="normal">Study Admin</Status></span>
                  <span role="cell"><Select aria-label="Your Role" placeholder="No Role" options={[{ value: NONE, label: 'No Role' }, ...ROLES]} value={f.role} onChange={(v) => set('role', v)} /></span>
                  <span role="cell" className="csf-na">—</span><span role="cell" className="csf-na">—</span><span role="cell" />
                </div>
                {f.members.map((m, i) => {
                  const u = userOf(m.user);
                  return (
                    <div className="csf-mrow csf-mrow--item" role="row" key={m.key}>
                      <span role="cell"><MemberSelect aria-label={`Person ${i + 1}`} options={memberOptions.map((o) => ({ ...o, disabled: taken(m.key).has(o.value) }))} value={m.user} error={er[memberKey(m.key, 'user')]} onChange={(v) => { setRow(m.key, { user: v }); clearErr(memberKey(m.key, 'user')); }} /></span>
                      <span role="cell"><Select aria-label={`Role of ${u?.name}`} options={ROLES} value={m.role} onChange={(v) => setRow(m.key, { role: v })} /></span>
                      <span role="cell"><Input placeholder="YYYY-MM-DD" aria-label={`From, ${u?.name}`} value={m.from} error={er[memberKey(m.key, 'from')]} onChange={(e) => { setRow(m.key, { from: e.target.value }); clearErr(memberKey(m.key, 'from')); clearErr(memberKey(m.key, 'to')); }} /></span>
                      <span role="cell"><Input placeholder="YYYY-MM-DD" aria-label={`To, ${u?.name}`} value={m.to} error={er[memberKey(m.key, 'to')]} onChange={(e) => { setRow(m.key, { to: e.target.value }); clearErr(memberKey(m.key, 'to')); }} /></span>
                      <span role="cell" className="csf-act"><IconButton size="compact" icon="ri-close-circle-fill" aria-label="Remove" title="Remove" onClick={() => removeRow(m.key)} /></span>
                    </div>
                  );
                })}
                <div className="csf-mrow csf-mrow--add" role="row">
                  <span role="cell"><MemberSelect aria-label="Person to add" placeholder="+ Select a person" options={memberOptions.map((o) => ({ ...o, disabled: f.members.some((m) => m.user === o.value) }))} value={draft.user || null} error={dEr.user}
                    onChange={(v) => { setDraft((d) => ({ ...d, user: v })); setDEr((p) => ({ ...p, user: '' })); clearErr('draft'); }} /></span>
                  <span role="cell"><Select aria-label="Role to add" options={ROLES} value={draft.role} onChange={(v) => setDraft((d) => ({ ...d, role: v }))} /></span>
                  <span role="cell"><Input placeholder="YYYY-MM-DD" aria-label="From" value={draft.from} error={dEr.from} onChange={(e) => { setDraft((d) => ({ ...d, from: e.target.value })); setDEr((p) => ({ ...p, from: '', to: '' })); clearErr('draft'); }} /></span>
                  <span role="cell"><Input placeholder="YYYY-MM-DD" aria-label="To" value={draft.to} error={dEr.to} onChange={(e) => { setDraft((d) => ({ ...d, to: e.target.value })); setDEr((p) => ({ ...p, to: '' })); clearErr('draft'); }} /></span>
                  <span role="cell" className="csf-act"><Button variant="primary" onClick={addDraft}>Add</Button></span>
                </div>
              </div>
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
