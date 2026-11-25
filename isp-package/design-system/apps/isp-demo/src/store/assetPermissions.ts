import { nowIso } from '@wiz/isp';
import { DEMO_TENANT, ME_USER } from './people';
import { effectiveDuty } from './role';
import { S } from './selectors';
import { getDb } from './store';
import type { Asset, MemberRole } from './types';

type AssetGrants = Partial<Record<string, readonly MemberRole[]>>;

// Preset grants from Study Asset configuration.
const DEFAULT_DOWNLOAD_ROLES: AssetGrants = {
  PROTOCOL: ['STAT'],
  SAP: ['STAT'],
  RAW_SCHEMA: ['DM'],
  RAW_DATA_SPEC: ['DM'],
  SDTM_SPEC: ['STAT', 'DEV', 'QC', 'DM'],
  ADAM_SPEC: ['STAT', 'DEV', 'QC', 'DM'],
  TFL_MOCKSHELL: ['STAT', 'DEV', 'QC'],
  TABLE_SHELL: ['STAT', 'DEV', 'QC'],
  FIGURE_SHELL: ['STAT', 'DEV', 'QC'],
  LISTING_SHELL: ['STAT', 'DEV', 'QC'],
  SDTM_PROGRAM: ['DEV'],
  ADAM_PROGRAM: ['DEV'],
  TFL_PRODUCTION_CODE: ['DEV'],
  SDTM_QC_PROGRAM: ['QC'],
  ADAM_QC_PROGRAM: ['QC'],
  TFL_QC_CODE: ['QC'],
};

const DEFAULT_MAINTAIN_ROLES: AssetGrants = {
  PROTOCOL: ['STAT'],
  SAP: ['STAT'],
  RAW_SCHEMA: ['DM'],
  RAW_DATA_SPEC: ['DM'],
  SDTM_SPEC: ['DEV', 'DM'],
  ADAM_SPEC: ['DEV', 'DM'],
  TFL_MOCKSHELL: ['STAT', 'DEV'],
  TABLE_SHELL: ['STAT', 'DEV'],
  FIGURE_SHELL: ['STAT', 'DEV'],
  LISTING_SHELL: ['STAT', 'DEV'],
  SDTM_PROGRAM: ['DEV'],
  ADAM_PROGRAM: ['DEV'],
  TFL_PRODUCTION_CODE: ['DEV'],
  SDTM_QC_PROGRAM: ['QC'],
  ADAM_QC_PROGRAM: ['QC'],
  TFL_QC_CODE: ['QC'],
};

function hasAssetGrant(studyId: string, code: string, grants: AssetGrants, requireWritable: boolean): boolean {
  const study = S.study(studyId);
  const db = getDb();
  if (!study || study.tenant !== DEMO_TENANT || study.lifecycle === 'DELETED' || db.me.name !== ME_USER.name) return false;

  if (requireWritable && study.lifecycle !== 'ACTIVE') return false;
  const now = nowIso();
  const member = db.members.find((entry) =>
    entry.studyId === study.id && entry.userId === ME_USER.id && entry.status === 'ACTIVE'
    && entry.validFrom <= now && (!entry.validUntil || now < entry.validUntil));
  if (!member) return false;

  const duty = effectiveDuty({ study });
  if (duty === 'System Owner') return false;
  if (duty === 'Study Admin' && member.isAdmin) return true;
  return grants[code]?.includes(member.role) ?? false;
}

export const canMaintainAsset = (studyId: string, code: string) =>
  hasAssetGrant(studyId, code, DEFAULT_MAINTAIN_ROLES, true);

export const canDownloadAsset = (asset: Asset) =>
  hasAssetGrant(asset.studyId, asset.code, DEFAULT_DOWNLOAD_ROLES, false);
