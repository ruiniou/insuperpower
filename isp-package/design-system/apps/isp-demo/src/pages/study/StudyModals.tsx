import { DeleteStudyModal } from './DeleteStudyModal';
import './code-package-upload.css';
import { useRef, useState } from 'react';
import { Avatar, Button, Checkbox, Field, FileBox, Input, Message, Modal, PickList, Select, Textarea, Upload } from '@wiz/react';
import { go } from '../../router';
import { AddMembersModal, ChangeBlindingModal, EditMemberModal, RemoveMemberModal, TransferAdminModal } from './MemberModals';
import { ArchiveStudyModal, RestoreStudyModal } from './ArchiveModals';
import { EnableBlindingModal, UnblindStudyModal } from './BlindingModals';
import { suggestNextVersion, VERSION_FORMAT_HINT } from '../../store/versions';
import { CODE_TYPES, FILE_OK, TYPE, SCOPES } from '../../store/assets';
import { hrefEvent, hrefStudy } from '../../store/actions';
import { baselineTag } from '../../store/baseline';
import { cutOf, SPACE, S } from '../../store/selectors';
import { DS_FILE_OK } from '../../store/actions';
import { createEvent, defaultEventRefs, replaceAssetContent, savePinnedDatasets, SPEC_OF, specOptionsFor, uploadAsset, uploadDataset, type Errors } from '../../store/study';
import { closeModal, modalUi } from '../../store/ui';
import { readCodeFolder, readCodeZip, readDroppedCodePackage } from '../../store/codePackage';
import { useDb } from '../../store/store';
import type { Asset, CodePackageMember } from '../../store/types';

const verOptions = (a: Asset) => a.versions.map((v, i) => ({ value: String(v.n), label: [v.label, baselineTag(a, v.n), i === 0 ? 'Latest' : ''].filter(Boolean).join(', ') }));
const initials = (n: string) => n.split(' ').map((x) => x[0]).join('').toUpperCase();

function Footer({ note, confirm, onConfirm, disabled }: { note?: string; confirm: string; onConfirm: () => void; disabled?: boolean }) {
  return (
    <>
      {note && <span className="app-modal-note">{note}</span>}
      <Button onClick={closeModal}>Cancel</Button>
      <Button variant="primary" disabled={disabled} onClick={onConfirm}>{confirm}</Button>
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
        {er.form && <Message tone="error">{er.form}</Message>}
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

/** Registration and version append share the same form. */
function UploadAssetModal({ sid, assetId, code: code0, replaceVersion }: { sid: string; assetId: string | null; code: string; replaceVersion?: number }) {
  const a = assetId ? S.asset(assetId) ?? null : null;
  const replacing = replaceVersion !== undefined;
  const [original] = useState(() => a && replacing ? S.vOf(a, replaceVersion) : undefined);
  const [f, setF] = useState({ code: a?.code ?? code0, name: a?.name ?? '', meta: {} as Record<string, string>, fileName: '', fileContent: undefined as File | undefined, reason: '', version: suggestNextVersion(a?.versions ?? []) });
  const [er, setEr] = useState<Errors>({});
  const [selectedPackage, setSelectedPackage] = useState<{ name: string; members: CodePackageMember[] } | null>(null);
  const [reading, setReading] = useState(false);
  const folderInput = useRef<HTMLInputElement | null>(null);
  const zipInput = useRef<HTMLInputElement>(null);
  const loadPackage = async (load: () => Promise<{ name: string; members: CodePackageMember[] }>) => {
    if (reading) return;
    setSelectedPackage(null);
    setReading(true);
    setEr((current) => ({ ...current, file: '' }));
    try {
      setSelectedPackage(await load());
    } catch (error) {
      setEr((current) => ({ ...current, file: error instanceof Error && error.message
        ? error.message : 'Could not read the selected package.' }));
    } finally {
      setReading(false);
    }
  };
  const packageUpload = Object.hasOwn(CODE_TYPES, f.code);
  const t = TYPE(f.code);
  const submit = () => {
    const content = { fileName: f.fileName, fileContent: f.fileContent, packageMembers: selectedPackage?.members };
    if (replacing && (!assetId || !original)) {
      setEr({ form: 'This version is unavailable. Close the form and open it again.' });
      return;
    }
    const r = replacing
      ? replaceAssetContent(sid, assetId!, original!, content)
      : uploadAsset({ sid, assetId, ...f, ...content });
    if ('errors' in r) { setEr(r.errors); return; }
    closeModal();
    go(hrefStudy(sid, 'asset'), { drawer: { kind: 'assetV', id: r.asset.id, n: r.versionNumber } });
  };
  return (
    <Modal title={replacing ? 'Replace Content' : a ? 'Upload New Version' : 'Upload'} width={600} onClose={closeModal}
      footer={<Footer confirm={replacing ? 'Replace' : a ? 'Upload version' : 'Upload'} onConfirm={submit} disabled={reading || !f.code} />}>
      <div className="app-form">
        {er.form && <Message tone="error">{er.form}</Message>}
        {a && <Input label="Asset" readOnly value={a.name} />}
        <Input label="Asset type" readOnly value={f.code === 'PROTOCOL' ? 'Protocol' : t?.name ?? a?.tl ?? f.code} error={er.code} />
        {replacing && <Input label="Version" readOnly value={original?.label ?? ''} />}
        {packageUpload ? (
          <>
            {!a && <Input label="Package name" required value={f.name} error={er.name}
              onChange={(event) => setF({ ...f, name: event.target.value })} />}
            <Field label={replacing ? "Replacement package" : "Package"} required error={er.file}>
              <div className="code-package-upload">
                <input ref={(element) => {
                  folderInput.current = element;
                  element?.setAttribute('webkitdirectory', '');
                }} type="file" hidden multiple disabled={reading}
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    event.target.value = '';
                    if (!files.length) return;
                    void loadPackage(async () => ({
                      name: files[0].webkitRelativePath.split('/')[0] || files[0].name,
                      members: await readCodeFolder(files),
                    }));
                  }} />
                <input ref={zipInput} type="file" hidden accept=".zip" disabled={reading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) void loadPackage(async () => ({ name: file.name, members: await readCodeZip(file) }));
                  }} />
                <Upload className="code-package-upload__zone" multiple={false} selectedInZone disabled={reading}
                  title={reading ? 'Checking package…' : 'Drop one folder or ZIP file'}
                  hint="1–100 files, up to 512 KB total. ZIP files must also be 512 KB or smaller and unencrypted."
                  files={selectedPackage ? [selectedPackage.name] : []}
                  onFilesChange={(files) => {
                    if (files.length) return;
                    setSelectedPackage(null);
                    setEr((current) => ({ ...current, file: '' }));
                  }}
                  onFilesDrop={(data) => { void loadPackage(() => readDroppedCodePackage(data)); }}
                  browseActions={<>
                    <Button size="small" disabled={reading} onClick={() => folderInput.current?.click()}>Choose folder</Button>
                    <Button size="small" disabled={reading} onClick={() => zipInput.current?.click()}>Choose ZIP file</Button>
                  </>} />
              </div>
            </Field>
          </>
        ) : (
          <>
            <Field label={replacing ? "Replacement file" : "File"} required error={er.file} hint={'Allowed: ' + FILE_OK.map((x) => '.' + x).join(' ')}>
              <FileBox accept={FILE_OK.map((x) => '.' + x).join(',')} fileName={f.fileName} invalid={!!er.file}
                onRemove={() => {
                  setF((current) => ({ ...current, fileName: '', fileContent: undefined }));
                  setEr((current) => ({ ...current, file: '' }));
                }}
                onChange={(name, fileContent) => {
                  setF({ ...f, fileName: name, fileContent, name: f.name.trim() ? f.name : name.replace(/\.[^.]+$/, '') });
                  setEr({ ...er, file: '' });
                }} />
            </Field>
            {!a && <Input label="Name" required placeholder="Filled from the file name if empty" maxLength={200}
              value={f.name} error={er.name} onChange={(event) => setF({ ...f, name: event.target.value })} />}
          </>
        )}
        {!replacing && <>
          <Input label="Version" required value={f.version} hint={VERSION_FORMAT_HINT} error={er.version}
            onChange={(event) => { setF({ ...f, version: event.target.value }); setEr({ ...er, version: '' }); }} />
          {!!t?.req.length && (
            <div className="app-form__row2">
              {t.req.map((field) => <Input key={field} label={field} required value={f.meta[field] || ''}
                error={er['m:' + field]} onChange={(event) => setF({ ...f, meta: { ...f.meta, [field]: event.target.value } })} />)}
            </div>
          )}
          <Textarea label="Reason" rows={2} maxLength={1000} placeholder="Optional" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
        </>}
      </div>
    </Modal>
  );
}

const NO_SPEC = '__none';
/** Upload Dataset：模式无默认值、不从文件名推断；版本号由上传者填写 */
function UploadDatasetModal({ sid, dsId, mode: mode0 }: { sid: string; dsId: string | null; mode: string }) {
  useDb();
  const d = dsId ? S.ds(dsId) ?? null : null;
  const [f, setF] = useState({ name: d ? d.name : '', cat: d ? d.cat : 'RawData', mode: d ? SPACE(d.space)!.mode : mode0, version: '', cut: '', spec: '', fileName: '', reason: '' });
  const [er, setEr] = useState<Errors>({});
  const specs = specOptionsFor(sid, f.cat);
  const submit = () => {
    const r = uploadDataset({ sid, dsId, ...f });
    if ('errors' in r) { setEr(r.errors); return; }
    closeModal(); go(hrefStudy(sid, 'dataset', r.space), { drawer: { kind: 'dsV', id: r.ds.id } });
  };
  return (
    <Modal title={d ? 'Upload new version' : 'Upload Dataset'} width={600} onClose={closeModal}
      footer={<Footer confirm={d ? 'Upload version' : 'Upload Dataset'} onConfirm={submit} />}>
      <div className="app-form">
        {er.form && <Message tone="error">{er.form}</Message>}
        <Input label="Dataset name" placeholder="Uses the file name if empty" readOnly={!!d} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <div className="app-form__row2">
          {d ? <>
            <Input label="Data type" readOnly value={f.cat} />
            <Input label="Mode" readOnly value={f.mode} />
          </> : <>
            <Select label="Data type" required options={['RawData', 'SDTM', 'ADaM']} value={f.cat} onChange={(v) => setF({ ...f, cat: v, spec: '' })} />
            <Select label="Mode" required placeholder="Select mode…" options={['Dummy', 'Synthetic', 'PROD']} value={f.mode} error={er.mode}
              onChange={(v) => { setF({ ...f, mode: v }); setEr({ ...er, mode: '' }); }} />
          </>}
        </div>
        {!d && <span className="app-hint">Mode is never inferred from the file name.</span>}
        <div className="app-form__row2">
          <Input label="Version" required maxLength={64} value={f.version} hint={VERSION_FORMAT_HINT} error={er.version} onChange={(e) => { setF({ ...f, version: e.target.value }); setEr({ ...er, version: '' }); }} />
          <Input label="Cut" placeholder="e.g. C01" maxLength={64} value={f.cut} onChange={(e) => setF({ ...f, cut: e.target.value })} />
        </div>
        {specs.length > 0 && <Select label={SPEC_OF[f.cat].label} placeholder="None" options={[{ value: NO_SPEC, label: 'None' }, ...specs.map((x) => ({ value: x, label: x }))]} value={f.spec || undefined} onChange={(v) => setF({ ...f, spec: v === NO_SPEC ? '' : v })} />}
        <Field label="Data file" required error={er.file} hint={'Allowed: ' + DS_FILE_OK.map((x) => '.' + x).join(' ')}>
          <FileBox accept={DS_FILE_OK.map((x) => '.' + x).join(',')} fileName={f.fileName} invalid={!!er.file} onChange={(n) => { setF({ ...f, fileName: n }); setEr({ ...er, file: '' }); }} />
        </Field>
        <Textarea label="Reason" rows={2} maxLength={1000} placeholder='Defaults to "Data intake"' value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
      </div>
    </Modal>
  );
}

/** Choose datasets：Event 在当前 Mode 下固定数据集与版本。Mode 由入口传入，弹窗内不切换；保存只改本 Mode 的固定 */
function ChooseDatasetsModal({ eid, space }: { eid: string; space: string }) {
  const e = S.event(eid)!, sp = SPACE(space) ?? SPACE('dummy')!;
  const list = S.datasetsOf(e.studyId, sp.key);
  const [pick, setPick] = useState<Record<string, number>>(() => Object.fromEntries(list.filter((d) => e.refs.datasets[d.id]).map((d) => [d.id, e.refs.datasets[d.id].v])));
  const save = () => { savePinnedDatasets(eid, sp.key, pick); closeModal(); };
  return (
    <Modal title="Choose datasets" width={640} onClose={closeModal}
      footer={<><Button onClick={closeModal}>Cancel</Button><Button variant="primary" onClick={save}>Save datasets</Button></>}>
      <div className="app-form">
        <span className="app-hint">{sp.name} datasets</span>
        {list.length === 0 ? <span className="app-hint">No datasets in this mode yet.</span> : (
          <div className="ds-pick" role="table" aria-label="Datasets">
            <div className="ds-pick__row ds-pick__row--head" role="row"><span /><span role="columnheader">Dataset</span><span role="columnheader">Type</span><span role="columnheader">Version</span></div>
            {list.map((d) => {
              const on = d.id in pick;
              return (
                <div key={d.id} className="ds-pick__row" role="row">
                  <Checkbox aria-label={'Pin ' + d.name} checked={on} onChange={(c) => { const n = { ...pick }; if (c) n[d.id] = S.latest(d).n; else delete n[d.id]; setPick(n); }} />
                  <span className="ds-name"><span className="app-mono app-ell">{d.name}</span><small className="app-ell">{d.label}</small></span>
                  <span className="app-sm">{d.cat}</span>
                  <Select aria-label={'Version of ' + d.name} value={String(on ? pick[d.id] : S.latest(d).n)} disabled={!on}
                    options={d.versions.map((v) => ({ value: String(v.n), label: cutOf(v) ? `${v.label} (Cut ${cutOf(v)})` : v.label }))}
                    onChange={(v) => setPick({ ...pick, [d.id]: Number(v) })} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

export function StudyModals() {
  useDb();
  const m = modalUi.modal;
  if (!m) return null;
  const key = JSON.stringify(m);
  if (m.kind === 'enableBlinding') return <EnableBlindingModal key={key} sid={m.sid} />;
  if (m.kind === 'unblindStudy') return <UnblindStudyModal key={key} sid={m.sid} />;
  if (m.kind === 'createEvent') return <CreateEventModal key={key} sid={m.sid} />;
  if (m.kind === 'uploadAsset') return <UploadAssetModal key={key} sid={m.sid} assetId={m.assetId} code={m.code} replaceVersion={m.replaceVersion} />;
  if (m.kind === 'chooseDatasets') return <ChooseDatasetsModal key={key} eid={m.eid} space={m.space} />;
  if (m.kind === 'addMembers') return <AddMembersModal key={key} sid={m.sid} userId={m.userId} />;
  if (m.kind === 'editMember') return <EditMemberModal key={key} sid={m.sid} memberId={m.memberId} />;
  if (m.kind === 'changeBlinding') return <ChangeBlindingModal key={key} sid={m.sid} memberId={m.memberId} />;
  if (m.kind === 'transferAdmin') return <TransferAdminModal key={key} sid={m.sid} />;
  if (m.kind === 'removeMember') return <RemoveMemberModal key={key} sid={m.sid} memberId={m.memberId} />;
  if (m.kind === 'deleteStudy') return <DeleteStudyModal key={key} sid={m.sid} />;
  if (m.kind === 'archiveStudy') return <ArchiveStudyModal key={key} sid={m.sid} />;
  if (m.kind === 'restoreStudy') return <RestoreStudyModal key={key} sid={m.sid} />;
  return <UploadDatasetModal key={key} sid={m.sid} dsId={m.dsId} mode={m.mode} />;
}
