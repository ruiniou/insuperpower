import { useState } from 'react';
import { Button, Dropdown, EmptyState, Table, type TableColumn } from '@wiz/react';
import { assetDirectoryType, CODE_TYPES, FILE_UPLOAD_GROUPS, TYPE } from '../../store/assets';
import { canMaintainAsset } from '../../store/assetPermissions';
import { S } from '../../store/selectors';
import { useDb } from '../../store/store';
import type { Asset, Version } from '../../store/types';
import { openDrawer, openModal, ui } from '../../store/ui';
import { PageToolbar, RowMenu, SearchBox } from './common';
import { AssetVersionDrawer } from './VersionDrawer';

const ICON: Record<string, string> = { doc: 'ri-file-text-line', list: 'ri-list-check', shell: 'ri-table-line', code: 'ri-code-line' };

const TYPE_GROUPS = ['Study Design', 'Study Spec', 'Code', 'Other'];

interface AssetRow {
  asset: Asset;
  version: Version;
  type: string;
}

const uploadTypes = [
  ...FILE_UPLOAD_GROUPS.flatMap(({ label: group, codes }) =>
    codes.map((value) => ({ value, group, label: value === 'PROTOCOL' ? 'Protocol' : TYPE(value)!.name }))),
  ...Object.entries(CODE_TYPES).map(([value, label]) => ({ value, label, group: 'Code Package' })),
];

function openVersion({ asset, version }: AssetRow) {
  openDrawer({ kind: 'assetV', id: asset.id, n: version.n });
}

export function AssetPage({ sid }: { sid: string }) {
  useDb();
  const [type, setType] = useState('');
  const [query, setQuery] = useState('');
  const assets = S.assetsOf(sid);
  const categories = assets.map((asset) => ({ asset, ...assetDirectoryType(asset) }));
  const types = [...new Map(categories.map(({ name, group }) => [name, { name, group }])).values()]
    .sort((a, b) => TYPE_GROUPS.indexOf(a.group) - TYPE_GROUPS.indexOf(b.group) || a.name.localeCompare(b.name));
  const needle = query.trim().toLowerCase();
  const selectedCategories = categories.filter(({ name }) => !type || name === type);
  const rows: AssetRow[] = selectedCategories.flatMap(({ asset, name }) => asset.versions
      .filter((version) => [asset.name, version.file, version.label]
        .some((value) => value?.toLowerCase().includes(needle)))
      .map((version) => ({ asset, version, type: name })));

  const filteredCode = !type ? undefined
    : type === 'Mock Shell' ? 'TFL_MOCKSHELL'
    : selectedCategories[0]?.asset.code;
  const allowedUploadTypes = uploadTypes.filter(({ value }) => canMaintainAsset(sid, value));
  const canUploadFilteredType = allowedUploadTypes.some(({ value }) => value === filteredCode);
  const upload = (code: string, assetId: string | null = null, replaceVersion?: number) =>
    openModal({ kind: 'uploadAsset', sid, assetId, code, replaceVersion });
  const uploadButton = canUploadFilteredType && filteredCode ? (
    <Button variant="primary" leftIcon="ri-upload-2-line" onClick={() => upload(filteredCode)}>Upload</Button>
  ) : allowedUploadTypes.length > 0 && (!type || !uploadTypes.some(({ value }) => value === filteredCode)) ? (
    <Dropdown variant="primary" icon="ri-upload-2-line" label="Upload" align="right" width={228}
      items={allowedUploadTypes} onSelect={(code) => upload(code)} />
  ) : null;
  const columns: TableColumn[] = [
    { key: 'name', header: 'Name', render: (_value, { asset, version }: AssetRow) => (
      <span className="app-nm">
        <i className={ICON[asset.icon] ?? ICON.doc} aria-hidden="true" />
        <span className="app-ell" title={version.file || asset.name}>{version.file || asset.name}</span>
      </span>
    ) },
    { key: 'type', header: 'Type', width: 180, render: (_value, row: AssetRow) => row.type },
    { key: 'version', header: 'Version', width: 112, render: (_value, { version }: AssetRow) => version.label },
    { key: 'uploaded', header: 'Uploaded', width: 120, render: (_value, { version }: AssetRow) => version.date },
    { key: 'more', header: '', width: 56, align: 'right', render: (_value, row: AssetRow) => canMaintainAsset(sid, row.asset.code) ? (
      <RowMenu
        label={`${row.asset.name} ${row.version.label}`}
        items={[
          { label: 'Upload new version', value: 'upload' },
          { label: 'Replace content', value: 'replace', disabled: S.assetUsers(row.asset, row.version.n).length > 0 },
        ]}
        onSelect={(value) => upload(row.asset.code, row.asset.id, value === 'replace' ? row.version.n : undefined)}
      />
    ) : null },
  ];

  const activeRow = ({ asset, version }: AssetRow) =>
    ui.drawer?.kind === 'assetV' && ui.drawer.id === asset.id && ui.drawer.n === version.n;

  return (
    <div className="studies">
      {assets.length > 0 && <PageToolbar
        filters={<Dropdown size="medium" shadow="none" filterName="Type" label={type || 'All'} width={200}
          items={[
            { label: 'All', value: '', selected: !type },
            ...types.map(({ name, group }) => ({ label: name, value: name, group, selected: name === type })),
          ]}
          onSelect={(value) => setType(String(value))} />}
        search={<SearchBox value={query} onChange={setQuery} placeholder="Search name or version" />}
        actions={uploadButton}
      />}
      <div className="page-scroll">
        {rows.length > 0 ? (
          <Table variant="plain" columnLayout="fixed" rowHeight={48} columns={columns} rows={rows}
            aria-label="Assets" onRowClick={openVersion} activeRow={activeRow} />
        ) : assets.length === 0 ? (
          <EmptyState title="No assets yet" action={uploadButton || undefined} />
        ) : (
          <EmptyState title={selectedCategories.length ? "No matching assets" : "No assets in this type"}
            description={selectedCategories.length ? "Try a different search or type." : undefined} />
        )}
      </div>
      {ui.drawer?.kind === 'assetV' && <AssetVersionDrawer key={ui.drawer.id} id={ui.drawer.id} n={ui.drawer.n} />}
    </div>
  );
}
