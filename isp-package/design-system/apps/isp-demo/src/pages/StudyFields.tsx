import { Input, Select, Textarea } from '@wiz/react';
import { PHASES } from '../store/study';

export interface StudyFieldValues { id: string; name: string; desc: string; ta: string; phase: string }
type Key = keyof StudyFieldValues;

/** Study 资料字段（研究编号、名称、说明、治疗领域、阶段）。Create Study 与 Study details 共用：同一组控件与版式，只读态把控件置为只读 */
export function StudyFields({ values, errors = {}, mode, idLocked, autoFocusId, onChange, onBlur }: {
  values: StudyFieldValues; errors?: Partial<Record<Key, string>>;
  /** create：可填；edit：可改（编号除外）；view：全部只读 */
  mode: 'create' | 'edit' | 'view';
  /** 研究编号创建后不可改 */
  idLocked?: boolean; autoFocusId?: boolean;
  onChange?: (k: Key, v: string) => void; onBlur?: (k: Key) => void;
}) {
  const ro = mode === 'view', req = mode !== 'view';
  const phases = (values.phase && !PHASES.includes(values.phase) ? [values.phase] : []).concat(PHASES).map((p) => ({ value: p, label: p }));
  const txt = (k: Key) => ({ value: values[k], error: errors[k], onChange: (e: { target: { value: string } }) => onChange?.(k, e.target.value), onBlur: () => onBlur?.(k) });
  return (
    <>
      <div className="csf-row csf-row--idname">
        <Input label="Study ID" required={req} autoFocus={autoFocusId} readOnly={ro || idLocked} hint={mode === 'create' ? 'Unique in your tenant. Up to 64 characters.' : undefined} {...txt('id')} />
        <Input label="Study name" required={req} readOnly={ro} {...txt('name')} />
      </div>
      <Textarea label="Description" rows={3} readOnly={ro} hint={ro ? undefined : <span className="csf-count">{values.desc.length} / 2000</span>} {...txt('desc')} />
      <div className="csf-row">
        <Input label="Therapeutic area" readOnly={ro} {...txt('ta')} />
        {ro ? <Input label="Phase" value={values.phase || 'Not specified'} readOnly />
          : <Select label="Phase" placeholder="Not specified" options={[{ value: '', label: 'Not specified' }, ...phases]}
              value={values.phase} onChange={(v) => onChange?.('phase', v)} />}
      </div>
    </>
  );
}
