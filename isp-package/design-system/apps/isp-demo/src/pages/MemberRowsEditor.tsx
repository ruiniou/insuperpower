import type { ReactNode } from 'react';
import { Button, Field, IconButton, MemberSelect, Select, Tooltip } from '@wiz/react';
import { systemTimeZone, ValidityPicker } from '@wiz/isp';
import { attrLabel, emptyMemberRow, memberKey, type MemberErrors, type MemberRow } from '../store/members';
import { BLIND_ATTRS, ROLES, TENANT_USERS, userById } from '../store/people';

export { validateMemberRow, validateMemberRows } from '../store/members';
export type { MemberRow } from '../store/members';

export interface MemberRowsEditorProps {
  rows: MemberRow[];
  onChange: (rows: MemberRow[]) => void;
  /** 已经是 Active 成员的用户不出现在候选里 */
  excludeUserIds?: string[];
  /** Study 级盲态为 Blinded：属性必填（只在 Unblinded 时表头显示说明） */
  studyBlinded: boolean;
  /** single：用户锁定，不能增删行 */
  mode: 'multi' | 'single';
  errors?: MemberErrors;
  /** 行内字段被改动后，清掉该字段的错误 */
  onClearError?: (errorKey: string) => void;
  /** 这些用户已有的盲态属性：设过 Blinded 或 Unblinded 后不能回到 Unspecified，Unblinded 不能改回 Blinded（对应选项禁用） */
  prevAttrs?: Record<string, string>;
  /** 盲态属性只读：显示文字而不是下拉（没有改盲点位，或属性由独立动作修改） */
  attrLocked?: boolean;
  /** 曾被移除的用户：选中后行下提示将恢复 */
  restorableUserIds?: string[];
  /** 表头下、成员行前的固定行（Create Study 的创建者行），与成员行共用列 */
  lead?: ReactNode;
  /** grid：表头加一行一条（Create Study 页）；stacked：每人一块、字段带标签（弹窗里用，窄宽度） */
  layout?: 'grid' | 'stacked';
  /** 读屏名称 */
  'aria-label'?: string;
}

const nextKey = (rows: MemberRow[]) => rows.reduce((n, r) => Math.max(n, r.key), 0) + 1;
const ATTRS = BLIND_ATTRS.map((a) => ({ value: a.value, label: a.label }));
const optionOf = (u: { id: string; name: string; email: string }) => ({ value: u.id, name: u.name, hint: u.email });

/** 成员行表格：Add members 弹窗、Edit 单行、Create Study 的初始成员共用。列：User、Role、Blinding、Validity（开始必填，结束可选，精确到分钟）、删除 */
export function MemberRowsEditor({ rows, onChange, excludeUserIds = [], studyBlinded, mode, errors = {}, onClearError, prevAttrs = {}, attrLocked, restorableUserIds = [], lead, layout = 'grid', ...rest }: MemberRowsEditorProps) {
  const single = mode === 'single';
  const FIELD: Record<keyof Omit<MemberRow, 'key'>, 'user' | 'role' | 'attr' | 'from' | 'to'> = { userId: 'user', role: 'role', attr: 'attr', validFrom: 'from', validUntil: 'to' };
  const patch = (key: number, p: Partial<MemberRow>) => {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...p } : r)));
    (Object.keys(p) as Array<keyof typeof FIELD>).forEach((k) => { onClearError?.(memberKey(key, FIELD[k])); if (k === 'validFrom') onClearError?.(memberKey(key, 'to')); });
  };
  const chosen = (key: number) => new Set(rows.filter((r) => r.key !== key && r.userId).map((r) => r.userId));
  const candidates = TENANT_USERS.filter((u) => !excludeUserIds.includes(u.id));

  if (layout === 'stacked') {
    return (
      <div className="mre mre--stacked" role="group" aria-label={rest['aria-label'] ?? 'Members'}>
        {rows.map((r, i) => {
          const u = userById(r.userId);
          const who = u?.name ?? 'member ' + (i + 1);
          const prev = prevAttrs[r.userId];
          const attrOff = (v: string) => (v === 'UNSET' && !!prev && prev !== 'UNSET') || (v === 'BLINDED' && prev === 'UNBLINDED');
          const opts = single && u ? [optionOf(u)] : candidates.filter((c) => c.id === r.userId || !chosen(r.key).has(c.id)).map(optionOf);
          return (
            <div className="mre-block" key={r.key}>
              {!single && rows.length > 1 && <Button className="mre-block__rm" variant="link" size="small" onClick={() => onChange(rows.filter((x) => x.key !== r.key))}>Remove</Button>}
              <MemberSelect label="User" required={!single} aria-label={`User ${i + 1}`} placeholder="Select a person" disabled={single} options={opts} value={r.userId || null} error={errors[memberKey(r.key, 'user')]}
                hint={r.userId && restorableUserIds.includes(r.userId) ? 'Will be restored with the settings below.' : undefined} onChange={(v) => patch(r.key, { userId: v })} />
              <div className="mre-block__2">
                <Select label="Role" aria-label={`Role of ${who}`} options={ROLES} value={r.role} error={errors[memberKey(r.key, 'role')]} onChange={(v) => patch(r.key, { role: v })} />
                {attrLocked
                  ? <Field label="Blinding"><span className={r.attr === 'UNSET' ? 'mre-ro app-muted' : 'mre-ro'}>{attrLabel(r.attr)}</span></Field>
                  : <Select label="Blinding" aria-label={`Blinding of ${who}`} options={ATTRS.map((a) => ({ ...a, disabled: attrOff(a.value) }))} value={r.attr} error={errors[memberKey(r.key, 'attr')]}
                      onChange={(v) => patch(r.key, { attr: v })} />}
              </div>
              {!attrLocked && !studyBlinded && <p className="mre-hint mre-hint--tight">Blinding is not enforced while the study is not blinded.</p>}
              <ValidityPicker endable label={<>Validity <span className="mre-tz">{systemTimeZone().label}</span></>} required aria-label={`Validity, ${who}`} placeholder="Select start time" value={{ start: r.validFrom, end: r.validUntil || null }}
                error={errors[memberKey(r.key, 'from')] ?? errors[memberKey(r.key, 'to')]} onChange={(v) => patch(r.key, { validFrom: v.start, validUntil: v.end ?? '' })} />
            </div>
          );
        })}
        {!single && <Button className="mre-add-link" variant="link" leftIcon="ri-add-line" onClick={() => onChange([...rows, emptyMemberRow(nextKey(rows))])}>Add another</Button>}
      </div>
    );
  }

  return (
    <div className="mre" role="table" aria-label={rest['aria-label'] ?? 'Members'}>
      <div className="mre-row mre-row--head" role="row">
        <span role="columnheader">User</span>
        <span role="columnheader">Role</span>
        <span role="columnheader" className="mre-th">
          Blinding
          {!studyBlinded && (
            <Tooltip content="Not enforced while the study is not blinded." direction="top">
              <span className="mre-info" role="img" aria-label="Not enforced while the study is not blinded."><i className="ri-information-line" aria-hidden="true" /></span>
            </Tooltip>
          )}
        </span>
        <span role="columnheader" className="mre-th">Validity<span className="mre-tz">{systemTimeZone().label}</span></span>
        <span role="columnheader"><span className="mre-sr">Action</span></span>
      </div>
      {lead}
      {rows.map((r, i) => {
        const u = userById(r.userId);
        const who = u?.name ?? 'member ' + (i + 1);
        const prev = prevAttrs[r.userId];
          const attrOff = (v: string) => (v === 'UNSET' && !!prev && prev !== 'UNSET') || (v === 'BLINDED' && prev === 'UNBLINDED');
        const opts = single && u ? [optionOf(u)] : candidates.filter((c) => c.id === r.userId || !chosen(r.key).has(c.id)).map(optionOf);
        return (
          <div className="mre-item" key={r.key} role="row">
            <div className="mre-row">
              <span role="cell">
                <MemberSelect aria-label={`User ${i + 1}`} placeholder="Select a person" disabled={single} options={opts} value={r.userId || null} error={errors[memberKey(r.key, 'user')]}
                  onChange={(v) => patch(r.key, { userId: v })} />
              </span>
              <span role="cell"><Select aria-label={`Role of ${who}`} options={ROLES} value={r.role} error={errors[memberKey(r.key, 'role')]} onChange={(v) => patch(r.key, { role: v })} /></span>
              <span role="cell">
                {attrLocked
                  ? <span className={r.attr === 'UNSET' ? 'mre-ro app-muted' : 'mre-ro'}>{attrLabel(r.attr)}</span>
                  : <Select aria-label={`Blinding of ${who}`} options={ATTRS.map((a) => ({ ...a, disabled: attrOff(a.value) }))} value={r.attr} error={errors[memberKey(r.key, 'attr')]} onChange={(v) => patch(r.key, { attr: v })} />}
              </span>
              <span role="cell">
                <ValidityPicker endable aria-label={`Validity, ${who}`} placeholder="Select start time" value={{ start: r.validFrom, end: r.validUntil || null }}
                  error={errors[memberKey(r.key, 'from')] ?? errors[memberKey(r.key, 'to')]} onChange={(v) => patch(r.key, { validFrom: v.start, validUntil: v.end ?? '' })} />
              </span>
              <span role="cell" className="mre-act">
                {!single && <IconButton size="compact" icon="ri-close-circle-fill" aria-label={`Remove row ${i + 1}`} title="Remove" onClick={() => onChange(rows.filter((x) => x.key !== r.key))} />}
              </span>
            </div>
            {r.userId && restorableUserIds.includes(r.userId) && <p className="mre-hint">Will be restored with the settings below.</p>}
          </div>
        );
      })}
      {!single && (
        <div className="mre-add">
          <Button variant="link" leftIcon="ri-add-line" onClick={() => onChange([...rows, emptyMemberRow(nextKey(rows))])}>{rows.length ? 'Add another' : 'Add member'}</Button>
        </div>
      )}
    </div>
  );
}
