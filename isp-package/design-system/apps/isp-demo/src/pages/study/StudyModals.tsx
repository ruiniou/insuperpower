import { useState } from 'react';
import { Avatar, Button, Field, FileBox, Input, Message, Modal, PickList, CheckPill, Radio, Select, Textarea } from '@wiz/react';
import { go } from '../../router';
import { CAT_ORDER, FILE_OK, TYPE, TYPES, SCOPES } from '../../store/assets';
import { hrefEvent, hrefStudy } from '../../store/actions';
import { baselineTag, baselineUsers, currentBaseline, isBlCode, baselineAsset, suggestBaselineLabel } from '../../store/baseline';
import { SPACE, S } from '../../store/selectors';
import { DS_FILE_OK } from '../../store/actions';
import { createEvent, defaultEventRefs, uploadAsset, uploadDataset, usedByEvents, type BaselineMode, type Errors } from '../../store/study';
import { closeModal, modalUi } from '../../store/ui';
import { useDb } from '../../store/store';
import type { Asset } from '../../store/types';

const verOptions = (a: Asset) => a.versions.map((v, i) => ({ value: String(v.n), label: [v.label, baselineTag(a, v.n), i === 0 ? 'Latest' : ''].filter(Boolean).join(', ') }));
const initials = (n: string) => n.split(' ').map((x) => x[0]).join('').toUpperCase();

function Footer({ note, confirm, onConfirm }: { note?: string; confirm: string; onConfirm: () => void }) {
  return (
    <>
      {note && <span className="app-modal-note">{note}</span>}
      <Button onClick={closeModal}>Cancel</Button>
      <Button variant="primary" onClick={onConfirm}>{confirm}</Button>
    </>
  );
}

/** Create Event：默认引用 Study 内的 SAP / CRF 最新版；创建后进入 Event Overview */
function CreateEventModal({ sid }: { sid: string }) {
  const db = useDb();
  const [f, setF] = useState(() => ({ name: '', goal: '', scope: 'EXPLORATORY', reason: '', refs: defaultEventRefs(sid) }));
  const [er, setEr] = useState<Errors>({});
  const assets = S.assetsOf(sid);
  const nSel = Object.keys(f.refs).length;
  const toggle = (id: string, on: boolean) => setF((p) => { const refs = { ...p.refs }; if (on) refs[id] = S.latest(S.asset(id)!).n; else delete refs[id]; return { ...p, refs }; });
  const submit = () => {
    const r = createEvent({ sid, ...f });
    if ('errors' in r) { setEr(r.errors); return; }
    closeModal(); go(hrefEvent(r.id, 'overview'));
  };
  return (
    <Modal title="New Event" width={600} onClose={closeModal} footer={<Footer confirm="Create Event" onConfirm={submit} />}>
      <div className="app-form">
        <Input label="Event Name" required placeholder="e.g. Primary Analysis" maxLength={200} autoFocus value={f.name} error={er.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Textarea label="Analysis Objective" rows={2} maxLength={1000} placeholder="What this Event should answer" value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })} />
        <div className="app-form__row2">
          <Select label="Analysis Scope" options={SCOPES.map(([value, label]) => ({ value, label }))} value={f.scope} onChange={(v) => setF({ ...f, scope: v })} />
          <Field label="Event Owner"><span className="app-owner"><Avatar size={20} color="brand-blue" initials={db.me.ini} />{db.me.name}</span></Field>
        </div>
        <Field label={<>Reference Existing Assets{nSel > 0 && <span className="app-lcn">{nSel}</span>}</>}>
          {assets.length ? (
            <PickList aria-label="Reference Existing Assets" columns={[{ header: 'Asset' }, { header: 'Version', width: '150px' }]} selected={Object.keys(f.refs)} onToggle={toggle}
              items={assets.map((a) => ({
                id: a.id, label: 'Reference ' + a.name,
                cells: [a.name, a.id in f.refs ? <Select key="v" size="small" aria-label={'Version of ' + a.name} options={verOptions(a)} value={String(f.refs[a.id])} onChange={(v) => setF((p) => ({ ...p, refs: { ...p.refs, [a.id]: +v } }))} /> : ''],
              }))} />
          ) : <Message tone="info">This Study has no assets yet. Upload files first, then create the Event.</Message>}
        </Field>
        <Textarea label="Reason for Change" required rows={2} maxLength={1000} placeholder="Why this Event is needed" value={f.reason} error={er.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
      </div>
    </Modal>
  );
}

const typeOptions = CAT_ORDER.flatMap((c) => [{ value: '__' + c, label: c, disabled: true }, ...TYPES.filter((t) => t.cat === c).map((t) => ({ value: t.code, label: t.name }))]);

/** Upload File / Upload new version：版本模式锁定类型与名称；版本号由用户填写。Protocol 与 SAP 另选 Baseline */
function UploadAssetModal({ sid, assetId, code: code0 }: { sid: string; assetId: string | null; code: string }) {
  const a = assetId ? S.asset(assetId) ?? null : null;
  const cur = currentBaseline(sid), curUsers = cur ? baselineUsers(cur).length : 0;
  const [f, setF] = useState({ code: a ? a.code : code0, name: a ? a.name : '', meta: {} as Record<string, string>, fileName: '', reason: '', version: '', baselineMode: 'new' as BaselineMode, baselineLabel: suggestBaselineLabel(sid) });
  const [er, setEr] = useState<Errors>({});
  const t = TYPE(f.code);
  const bl = isBlCode(f.code);
  const existing = a ?? (isBlCode(f.code) ? baselineAsset(sid, f.code) ?? null : null);
  const submit = () => {
    const r = uploadAsset({ sid, assetId, ...f, name: existing ? existing.name : f.name });
    if ('errors' in r) { setEr(r.errors); return; }
    closeModal(); go(hrefStudy(sid, 'asset'), { drawer: { kind: 'assetV', id: r.asset.id } });
  };
  const setType = (code: string) => {
    const ex = isBlCode(code) ? baselineAsset(sid, code) : undefined;
    setF({ ...f, code, meta: {}, name: ex ? ex.name : a ? a.name : existing ? '' : f.name });
    setEr({ ...er, code: '' });
  };
  return (
    <Modal title={a ? 'Upload New Version' : 'Upload File'} width={600} onClose={closeModal}
      footer={<Footer confirm={a ? 'Upload version' : 'Upload'} onConfirm={submit} />}>
      <div className="app-form">
        {a && <Message tone="info">Adding a new version of <b>{a.name}</b> (currently {S.latest(a).label}). Type is locked to the existing asset.</Message>}
        <Select label="File type" required searchable placeholder="Select a type…" disabled={!!a} options={typeOptions} value={f.code} error={er.code}
          hint={a ? 'Locked when adding a version.' : 'From the 31 asset types. Write permission per role is checked by type.'}
          onChange={setType} />
        <Field label="File" required error={er.file} hint={'Allowed: ' + FILE_OK.map((x) => '.' + x).join(' ')}>
          <FileBox accept={FILE_OK.map((x) => '.' + x).join(',')} fileName={f.fileName} invalid={!!er.file}
            onChange={(n) => { setF({ ...f, fileName: n, name: f.name.trim() ? f.name : n.replace(/\.[^.]+$/, '') }); setEr({ ...er, file: '' }); }} />
        </Field>
        <Input label="Name" required readOnly={!!existing} placeholder="Filled from the file name if empty" maxLength={200} value={existing ? existing.name : f.name} error={er.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Input label="Version" required maxLength={64} value={f.version} error={er.version} onChange={(e) => { setF({ ...f, version: e.target.value }); setEr({ ...er, version: '' }); }} />
        {bl && (
          <Field label="Baseline" required>
            <div className="app-bl-opt">
              <Radio name="baseline-mode" label="Start a new baseline" checked={f.baselineMode === 'new' || !cur} onChange={() => { setF({ ...f, baselineMode: 'new' }); setEr({ ...er, baseline: '' }); }} />
              {(f.baselineMode === 'new' || !cur) && (
                <div className="app-bl-opt__sub">
                  <Input aria-label="Baseline version" maxLength={64} value={f.baselineLabel} error={er.baseline} onChange={(e) => { setF({ ...f, baselineLabel: e.target.value }); setEr({ ...er, baseline: '' }); }} />
                </div>
              )}
              {cur && <Radio name="baseline-mode" label={'Add to current baseline ' + cur.label} disabled={curUsers > 0} checked={f.baselineMode === 'current'} onChange={() => { setF({ ...f, baselineMode: 'current' }); setEr({ ...er, baseline: '' }); }} />}
              {cur && curUsers > 0 && <span className="app-hint app-bl-opt__sub">{usedByEvents(curUsers)}</span>}
            </div>
          </Field>
        )}
        <Field label="Metadata">
          {t ? (t.req.length ? (
            <div className="app-form__row2">{t.req.map((r) => <Input key={t.code + r} label={r} required value={f.meta[r] || ''} error={er['m:' + r]} onChange={(e) => setF({ ...f, meta: { ...f.meta, [r]: e.target.value } })} />)}</div>
          ) : <span className="app-hint">No required metadata for this type.</span>) : <span className="app-hint">Select a type to see its required metadata.</span>}
        </Field>
        <Textarea label="Reason" rows={2} maxLength={1000} placeholder={a ? 'Defaults to "Appended file version"' : 'Optional'} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
      </div>
    </Modal>
  );
}

/** Upload Dataset：模式无默认值、不从文件名推断；PROD 可登记首次盲态保护规则 */
function UploadDatasetModal({ sid, dsId, mode: mode0 }: { sid: string; dsId: string | null; mode: string }) {
  const d = dsId ? S.ds(dsId) ?? null : null;
  const [f, setF] = useState({ name: d ? d.name : '', aid: d ? d.name : '', cat: d ? d.cat : 'RawData', mode: d ? SPACE(d.space)!.mode : mode0, fileName: '', blind: false, reason: '' });
  const [er, setEr] = useState<Errors>({});
  const submit = () => {
    const r = uploadDataset({ sid, dsId, ...f });
    if ('errors' in r) { setEr(r.errors); return; }
    closeModal(); go(hrefStudy(sid, 'dataset', r.space), { drawer: { kind: 'dsV', id: r.ds.id } });
  };
  return (
    <Modal title={d ? 'Upload New Version' : 'Upload Dataset'} width={600} onClose={closeModal}
      footer={<Footer note="Parsing and validation engines are not connected in this prototype." confirm={d ? 'Upload version' : 'Upload Dataset'} onConfirm={submit} />}>
      <div className="app-form">
        {d && <Message tone="info">Adding a new version of <b>{d.name}</b> in the <b>{SPACE(d.space)!.name}</b> space (currently {S.latest(d).label}). Data type and mode are locked. The new version will be <b>v{S.latest(d).n + 1}</b>.</Message>}
        <div className="app-form__row2">
          <Input label="Dataset name" placeholder="Uses the file name if empty" readOnly={!!d} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Input label="Artifact ID" placeholder="Auto: dataset-{n}" readOnly={!!d} value={f.aid} onChange={(e) => setF({ ...f, aid: e.target.value })} />
        </div>
        <div className="app-form__row2">
          <Select label="Data type" required disabled={!!d} options={['RawData', 'SDTM', 'ADaM']} value={f.cat} onChange={(v) => setF({ ...f, cat: v })} />
          <Select label="Actual version mode" required placeholder="Select mode…" disabled={!!d} options={['Dummy', 'Synthetic', 'PROD']} value={f.mode} error={er.mode}
            onChange={(v) => { setF({ ...f, mode: v, blind: v === 'PROD' ? f.blind : false }); setEr({ ...er, mode: '' }); }} />
        </div>
        <Message tone="warning">Mode has no default and is never inferred from the file name. One version belongs to exactly one mode and is not shared across modes. A wrong mode is corrected only through a controlled request; the original version stays unchanged.</Message>
        <Field label="Data file" required error={er.file} hint={'Allowed: ' + DS_FILE_OK.map((x) => '.' + x).join(' ')}>
          <FileBox accept={DS_FILE_OK.map((x) => '.' + x).join(',')} fileName={f.fileName} invalid={!!er.file} onChange={(n) => { setF({ ...f, fileName: n }); setEr({ ...er, file: '' }); }} />
        </Field>
        {f.mode === 'PROD' && <CheckPill checked={f.blind} onChange={(c) => setF({ ...f, blind: c })}>First blinded PROD: register the direct protection rule first</CheckPill>}
        <Textarea label="Reason" rows={2} maxLength={1000} placeholder='Defaults to "Data intake"' value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
      </div>
    </Modal>
  );
}

export function StudyModals() {
  useDb();
  const m = modalUi.modal;
  if (!m) return null;
  const key = JSON.stringify(m);
  if (m.kind === 'createEvent') return <CreateEventModal key={key} sid={m.sid} />;
  if (m.kind === 'uploadAsset') return <UploadAssetModal key={key} sid={m.sid} assetId={m.assetId} code={m.code} />;
  return <UploadDatasetModal key={key} sid={m.sid} dsId={m.dsId} mode={m.mode} />;
}
