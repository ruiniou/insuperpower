import { DEMO_TENANT, ME_USER } from './people';
import { effectiveDuty } from './role';
import { S } from './selectors';
import { getDb } from './store';
import type { Asset, MemberRole } from './types';

import { activeStudyMember, documentPermission, permissionValue } from './studyPermissions';

function hasAssetGrant(studyId: string, code: string, action: 'W' | 'P' | 'D'): boolean {
  const study = S.study(studyId);
  if (!study || study.tenant !== DEMO_TENANT || study.lifecycle === 'DELETED' || getDb().me.name !== ME_USER.name) return false;
  if (action === 'W' && study.lifecycle !== 'ACTIVE') return false;
  const member = activeStudyMember(studyId);
  if (!member) return false;
  const duty = effectiveDuty({ study });
  if (duty === 'System Owner') return false;
  if (duty === 'Study Admin' && member.isAdmin) return true;
  const item = documentPermission(code);
  if (!item) return false;
  const { current, ceiling } = permissionValue(studyId, 'document', member.role, item);
  return current.includes(action) && ceiling.includes(action);
}

export const canMaintainAsset = (studyId: string, code: string) => hasAssetGrant(studyId, code, 'W');
export const canPreviewAsset = (asset: Asset) => hasAssetGrant(asset.studyId, asset.code, 'P');
export const canDownloadAsset = (asset: Asset) => hasAssetGrant(asset.studyId, asset.code, 'D');
export const canSeeAsset = (asset: Asset) =>
  canPreviewAsset(asset) || canDownloadAsset(asset) || canMaintainAsset(asset.studyId, asset.code);
