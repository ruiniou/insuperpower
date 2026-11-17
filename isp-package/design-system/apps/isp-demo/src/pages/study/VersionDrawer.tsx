import { Button, Drawer, DrawerRow, DrawerSectionHead, IconButton } from '@wiz/react';
import { VersionRow } from '@wiz/isp';
import { TYPE } from '../../store/assets';
import { catOf, SPACE, S } from '../../store/selectors';
import { openModal, setDrawerWidth, ui, openDrawer } from '../../store/ui';
import { soon } from './common';

const HEADER_H = 48; // 抽屉盖住页签，顶边贴页头底（页头高 48，与各面板 Head 同高）
const more = (what: string) => <IconButton icon="ri-more-2-fill" size="small" aria-label={what} tooltip="More" onClick={soon('Version actions (preview / download)')} />;

/** 资产版本抽屉：Name / Type + 版本列表（Latest、Official、Used by、behind） */
export function AssetVersionDrawer({ id }: { id: string }) {
  const a = S.asset(id);
  if (!a) return null;
  const t = TYPE(a.code), users = S.assetUsers(a), lv = S.latest(a);
  return (
    <Drawer title={a.name} subtitle="Versions" top={HEADER_H} width={ui.drawerWidth} onWidthChange={setDrawerWidth} onClose={() => openDrawer(null)} aria-label="Version history">
      <DrawerRow label="Name" action={<Button variant="link" size="small" onClick={soon('Rename')}>Rename</Button>}>{a.name}</DrawerRow>
      <DrawerRow label="Type">{t ? t.name : a.tl}, {catOf(a)}</DrawerRow>
      <DrawerSectionHead title="Versions" count={a.versions.length} style={{ marginTop: 8 }}
        actions={<Button leftIcon="ri-upload-2-line" onClick={() => openModal({ kind: 'uploadAsset', sid: a.studyId, assetId: a.id, code: a.code })}>Upload new version</Button>} />
      {a.versions.map((v, i) => {
        const us = users.filter((e) => e.refs.assets[a.id].v === v.n);
        return <VersionRow key={v.n} label={v.label} latest={i === 0} official={v.status === 'Official'} by={v.by} date={v.date} note={v.note} usedBy={us.map((e) => e.name)} behind={v.n < lv.n} action={more(`More actions for ${a.name} ${v.label}`)} />;
      })}
    </Drawer>
  );
}

/** 数据集版本抽屉 */
export function DatasetVersionDrawer({ id }: { id: string }) {
  const d = S.ds(id);
  if (!d) return null;
  const lv = S.latest(d), users = S.dsUsers(d);
  return (
    <Drawer title={d.name} subtitle="Versions" top={HEADER_H} width={ui.drawerWidth} onWidthChange={setDrawerWidth} onClose={() => openDrawer(null)} aria-label="Version history">
      <DrawerRow label="Dataset">{d.name} {d.label}</DrawerRow>
      <DrawerRow label="Category">{d.cat}, {SPACE(d.space)!.name} space</DrawerRow>
      <DrawerSectionHead title="Versions" count={d.versions.length} style={{ marginTop: 8 }}
        actions={<Button leftIcon="ri-upload-2-line" onClick={() => openModal({ kind: 'uploadDataset', sid: d.studyId, dsId: d.id, mode: SPACE(d.space)!.mode })}>Upload new version</Button>} />
      {d.versions.map((v, i) => {
        const us = users.filter((e) => e.refs.datasets[d.id].v === v.n);
        return <VersionRow key={v.n} label={v.label} latest={i === 0} by={v.by} date={v.date} note={v.note} usedBy={us.map((e) => e.name)} behind={v.n < lv.n} action={more(`More actions for ${d.name} ${v.label}`)} />;
      })}
    </Drawer>
  );
}
