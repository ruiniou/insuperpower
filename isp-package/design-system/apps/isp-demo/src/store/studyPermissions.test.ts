import { beforeEach, describe, expect, it } from 'vitest';
import { assetDownloadFile } from './assetDownload';
import { canMaintainAsset, canPreviewAsset, canSeeAsset } from './assetPermissions';
import { setDuty } from './role';
import { S } from './selectors';
import { getDb, resetDb } from './store';
import { documentPermission, saveStudyPermissions, type PermissionChange } from './studyPermissions';

describe('Study document policy demo', () => {
  beforeEach(() => {
    resetDb();
    setDuty('Study Admin');
  });

  it('applies a saved Preview-only grant when the sidebar switches to Member', () => {
    const asset = S.asset('A2')!;
    const changes: PermissionChange[] = [{ role: 'STAT', item: documentPermission(asset.code)!, proposed: 'P' }];
    expect(saveStudyPermissions(asset.studyId, 'document', ' ', changes)).toBe(false);
    expect(saveStudyPermissions(asset.studyId, 'document', 'Review analysis plan', changes)).toBe(true);
    expect(getDb().audit[0]).toMatchObject({ action: 'Study permissions updated', reason: 'Review analysis plan' });

    setDuty('Member');
    expect(canSeeAsset(asset)).toBe(true);
    expect(canPreviewAsset(asset)).toBe(true);
    expect(canMaintainAsset(asset.studyId, asset.code)).toBe(false);
    expect(assetDownloadFile(asset.id, 3)).toHaveProperty('error');
    expect(saveStudyPermissions(asset.studyId, 'document', 'Member attempt', changes)).toBe(false);
  });
});
