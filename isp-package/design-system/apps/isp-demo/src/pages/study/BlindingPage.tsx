import { Button, Card, Table, type TableColumn } from '@wiz/react';
import { go } from '../../router';
import { hrefStudy } from '../../store/actions';
import { protectionsOf } from '../../store/blinding';
import { activeMembers, canChangeBlinding } from '../../store/members';
import { can } from '../../store/role';
import { S } from '../../store/selectors';
import { useDb } from '../../store/store';
import { openModal } from '../../store/ui';
import { BlindTag } from './common';

const sharedColumns: TableColumn[] = [
  { key: 'name', header: 'Dataset', render: (v: string) => <span className="app-mono">{v}</span> },
  { key: 'category', header: 'Category', width: 180 },
];
const versionsColumns: TableColumn[] = [...sharedColumns, { key: 'version', header: 'Version', width: 240 }];
const rulesColumns: TableColumn[] = [...sharedColumns, { key: 'rule', header: 'Rule', width: 240 }];

/** Study 级盲态概览；保护策略只读，成员属性仍在 Member 页修改。 */
export function BlindingPage({ sid }: { sid: string }) {
  const db = useDb();
  const study = S.study(sid)!;
  const members = activeMembers(sid);
  const protections = protectionsOf(sid);
  const protectedRows = protections.flatMap((p) => {
    const d = db.datasets.find((item) => item.id === p.datasetId && item.studyId === sid && item.space === 'prod');
    return d ? d.versions.filter((v) => p.versions.includes(v.n)).map((v) => ({ id: d.id + ':' + v.n, name: d.name, category: d.cat, version: v.label })) : [];
  });
  const futureRows = protections.filter((p) => p.future).flatMap((p) => {
    const d = db.datasets.find((item) => item.id === p.datasetId && item.studyId === sid && item.space === 'prod');
    return d ? [{ id: d.id, name: d.name, category: d.cat, rule: 'Protect all new PROD versions' }] : [];
  });
  const pending = members.filter((member) => member.attr === 'UNSET').length;
  const memberSummary = pending === 0
    ? 'All active members have a blinding status.'
    : pending === 1
      ? '1 active member needs a blinding status.'
      : pending + ' active members need a blinding status.';
  const canReviewMembers = pending > 0 && canChangeBlinding(sid);
  const canManage = can('study.blinding.manage', { study });

  return <div className="studies blinding-page">
    <div className="page-scroll blinding-page__body" tabIndex={0} role="region" aria-label="Study blinding">
      <div className="blinding-section__head">
        <div className="blinding-section__title">
          <span>Study blinding</span>
          <BlindTag v={study.blinding} />
        </div>
          {canManage && <Button variant={study.blinding === 'Blinded' ? 'danger' : 'primary'} onClick={() => openModal({ kind: study.blinding === 'Blinded' ? 'unblindStudy' : 'enableBlinding', sid })}>{study.blinding === 'Blinded' ? 'Unblind study' : 'Enable blinding'}</Button>}
      </div>
      <section className="blinding-section" aria-labelledby="protected-content-title">
        <div className="blinding-section__head"><h2 id="protected-content-title">Dataset protection</h2></div>
        <Card className="blinding-content-card">
        {study.blinding === 'Unblinded' ? <p className="blinding-section__empty">No content protection is active while this study is Unblinded.</p> : <div className="blinding-content-grid">
          <h3 className="blinding-section__subhead">Protected versions</h3>
          {protectedRows.length ? <Table className="blinding-table" variant="plain" columnLayout="fixed" rowHeight={48} columns={versionsColumns} rows={protectedRows} aria-label="Protected versions" /> : <p className="blinding-section__empty">No protected PROD versions.</p>}
          <h3 className="blinding-section__subhead">Future version rules</h3>
          {futureRows.length ? <Table className="blinding-table blinding-table--last" variant="plain" columnLayout="fixed" rowHeight={48} columns={rulesColumns} rows={futureRows} aria-label="Future version rules" /> : <p className="blinding-section__empty">No future PROD version rules.</p>}
        </div>}
        </Card>
      </section>
      <section className="blinding-section" aria-labelledby="blinding-members-title">
        <div className="blinding-section__head"><h2 id="blinding-members-title">Member blinding</h2></div>
        <Card className="blinding-members-card">
          <span>{members.length === 0 ? 'No active members yet.' : memberSummary}</span>
          <Button onClick={() => go(hrefStudy(sid, 'member', canReviewMembers ? 'unspecified' : undefined))}>
            {canReviewMembers ? 'Review members' : 'View members'}
          </Button>
        </Card>
      </section>
    </div>
  </div>;
}
