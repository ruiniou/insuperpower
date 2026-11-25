import { CODE_TYPES } from './assets';
import { buildCodePackageZip } from './codePackage';
import { canDownloadAsset } from './assetPermissions';
import { S } from './selectors';

export function assetDownloadFile(assetId: string, versionNumber: number): { error: string } | { name: string; content: Blob } {
  const asset = S.asset(assetId);
  if (!asset || !canDownloadAsset(asset)) return { error: 'You do not have permission to download this file.' };
  const version = S.vOf(asset, versionNumber);
  if (version?.archived) return { error: 'This version is archived.' };
  if (!version?.file || !version.fileContent) return { error: 'The original file is unavailable for this version.' };
  const content = typeof version.fileContent === 'string'
    ? new Blob([version.fileContent], { type: 'text/plain' })
    : version.fileContent;
  return { name: version.file, content };
}

export async function assetDownloadPackage(assetId: string, versionNumber: number): Promise<
  { error: string } | { name: string; content: Blob }
> {
  const asset = S.asset(assetId);
  if (!asset || !canDownloadAsset(asset)) return { error: 'You do not have permission to download this package.' };
  const version = S.vOf(asset, versionNumber);
  if (version?.archived) return { error: 'This version is archived.' };
  if (!Object.hasOwn(CODE_TYPES, asset.code) || !version?.packageMembers?.length) {
    return { error: 'The original files are unavailable for this version.' };
  }

  try {
    const content = await buildCodePackageZip({
      assetId,
      versionId: `${assetId}:${version.n}`,
      version: version.label,
      track: CODE_TYPES[asset.code].endsWith('(QC)') ? 'QC' : 'DEV',
    }, version.packageMembers);
    const current = S.asset(assetId);
    if (current !== asset || S.vOf(current, versionNumber) !== version || !canDownloadAsset(current)) {
      return { error: 'This package is no longer available to download.' };
    }
    const name = asset.name.replace(/[\\/:*?"<>|]/g, '_');
    return { name: `${name}-${version.label}.zip`, content };
  } catch {
    return { error: 'Could not prepare this ZIP. Try downloading it again.' };
  }
}
