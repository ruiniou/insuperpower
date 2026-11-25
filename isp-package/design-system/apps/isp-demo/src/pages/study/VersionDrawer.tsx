import { useState } from 'react';
import { Button, Drawer, DrawerSectionHead, Tooltip } from '@wiz/react';
import { VersionRow } from '@wiz/isp';
import { go } from '../../router';
import { hrefEvent } from '../../store/actions';
import { assetDownloadFile, assetDownloadPackage } from '../../store/assetDownload';
import { canDownloadAsset } from '../../store/assetPermissions';
import { toast } from '../../store/store';
import { assetDirectoryType } from '../../store/assets';
import { cutOf, specOf, SPACE, S } from '../../store/selectors';
import type { Version } from '../../store/types';
import { openModal, setDrawerWidth, ui, openDrawer } from '../../store/ui';
import { LifecycleMark } from './common';
import './asset-version-drawer.css';

const HEADER_H = 48;

export function AssetVersionLabel({ version, inButton = false }: { version: Version; inButton?: boolean }) {
  return (
    <span className="app-inline">
      {version.label}
      {version.archived && <LifecycleMark v="ARCHIVED" focusable={!inButton} tooltip={!inButton} />}
    </span>
  );
}

export function AssetVersionDrawer({ id, n }: { id: string; n?: number }) {
  const [preparingZip, setPreparingZip] = useState(false);
  const asset = S.asset(id);
  const version = asset && (n == null ? S.latest(asset) : S.vOf(asset, n));
  if (!asset || !version) return null;

  const events = S.assetUsers(asset, version.n);
  const selectVersion = (value: number) => openDrawer({ kind: 'assetV', id, n: value });

  const download = async () => {
    if (preparingZip) return;
    let file;
    if (version.packageMembers) {
      setPreparingZip(true);
      try {
        file = await assetDownloadPackage(id, version.n);
      } finally {
        setPreparingZip(false);
      }
    } else {
      file = assetDownloadFile(id, version.n);
    }
    if ('error' in file) { toast(file.error, { type: 'error' }); return; }
    const url = URL.createObjectURL(file.content);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Drawer className="asset-dataset-drawer" title={asset.name} top={HEADER_H}
      width={ui.drawerWidth} onWidthChange={setDrawerWidth} onClose={() => openDrawer(null)}
      aria-label="Asset version">
      <div className="asset-drawer__details">
        <dl className="asset-drawer__metadata">
          <dt>Type</dt><dd>{assetDirectoryType(asset).name}</dd>
          <dt>Version</dt><dd><AssetVersionLabel version={version} /></dd>
          {version.file && <>
            <dt>File</dt>
            <dd className="asset-drawer__file">
              <span>{version.file}</span>
              {!version.archived && version.fileContent && canDownloadAsset(asset) && (
                <Button size="small" leftIcon="ri-download-2-line" onClick={download}>Download</Button>
              )}
            </dd>
          </>}
          {version.packageMembers && <>
            <dt>Files</dt>
            <dd className="asset-drawer__file">
              <span>{version.packageMembers.length}</span>
              {!version.archived && canDownloadAsset(asset) && <Button size="small" leftIcon="ri-download-2-line"
                disabled={preparingZip} onClick={download}>
                {preparingZip ? 'Preparing ZIP…' : 'Download ZIP'}
              </Button>}
            </dd>
            <dt>Size</dt><dd>{version.packageMembers.reduce((total, member) => total + member.size, 0).toLocaleString()} bytes</dd></>}
          <dt>Uploaded</dt><dd>{version.date} by {version.by}</dd>
          {version.meta?.['Effective date'] && <><dt>Effective date</dt><dd>{version.meta['Effective date']}</dd></>}
          {asset.source && asset.source !== 'Uploaded' && <><dt>Source</dt><dd>{asset.source}</dd></>}
        </dl>

        <section className="asset-drawer__section" aria-labelledby="asset-referenced-events">
          <h3 id="asset-referenced-events">Referenced Events</h3>
          {events.length ? (
            <ul className="asset-drawer__items">
              {events.map((event) => (
                <li key={event.id}>
                  <button type="button" className="asset-drawer__item" onClick={() => go(hrefEvent(event.id, 'overview'))}>
                    <span>{event.name}</span><span className="asset-drawer__muted">{event.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className="asset-drawer__muted">No referenced events</p>}
        </section>

        {asset.versions.length > 1 && (
          <details className="asset-drawer__section">
            <summary className="asset-drawer__field asset-drawer__summary">
              <i className="ri-arrow-right-s-line" aria-hidden="true" />
              Version history
            </summary>
            <ul className="asset-drawer__items">
              {asset.versions.map((entry) => {
                const description = <span className="asset-drawer__muted">{entry.date} by {entry.by}</span>;
                const isViewing = entry.n === version.n;
                const selectButton = (
                  <button type="button" className="asset-drawer__item" onClick={() => selectVersion(entry.n)}>
                    <AssetVersionLabel version={entry} inButton />
                    {description}
                  </button>
                );
                return (
                  <li key={entry.n}>
                    {isViewing ? (
                      <div className="asset-drawer__item" aria-current="true">
                        <span><AssetVersionLabel version={entry} /> <span className="asset-drawer__muted">(Viewing)</span></span>
                        {description}
                      </div>
                    ) : entry.archived ? (
                      <Tooltip content="Archived" direction="top" className="asset-drawer__version-tooltip">
                        {selectButton}
                      </Tooltip>
                    ) : selectButton}
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </div>
    </Drawer>
  );
}

/** 数据集版本抽屉：标题只放名称，副标题「Type, Mode」；label 表格里已有，抽屉不重复；版本行右侧显示 Cut，Spec 单独一行 */
export function DatasetVersionDrawer({ id }: { id: string }) {
  const d = S.ds(id);
  if (!d) return null;
  const lv = S.latest(d), users = S.dsUsers(d);
  return (
    <Drawer className="asset-dataset-drawer" title={d.name} subtitle={`${d.cat}, ${SPACE(d.space)!.name}`} top={HEADER_H} width={ui.drawerWidth} onWidthChange={setDrawerWidth} onClose={() => openDrawer(null)} aria-label="Version history">
      <div className="dataset-drawer__versions">
        <DrawerSectionHead title="Versions" count={d.versions.length}
        actions={<Button leftIcon="ri-upload-2-line" onClick={() => openModal({ kind: 'uploadDataset', sid: d.studyId, dsId: d.id, mode: SPACE(d.space)!.mode })}>Upload new version</Button>} />
      {d.versions.map((v, i) => {
        const us = users.filter((e) => e.refs.datasets[d.id].v === v.n);
        return <VersionRow key={v.n} label={v.label} latest={i === 0} by={v.by} date={v.date} note={v.note} cut={cutOf(v)} spec={specOf(v)} hideUnused usedBy={us.map((e) => e.name)} behind={v.n < lv.n} />;
      })}
      </div>
    </Drawer>
  );
}
