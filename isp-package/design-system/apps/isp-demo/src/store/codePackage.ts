import type { CodePackageMember } from './types';

const MAX_FILES = 100;
const MAX_BYTES = 512 * 1024;

function checkEntries(entries: readonly { path: string; size: number }[]) {
  if (!entries.length || entries.length > MAX_FILES) throw new Error('Choose a package with 1 to 100 files.');
  if (entries.reduce((total, entry) => total + entry.size, 0) > MAX_BYTES) {
    throw new Error('The package must be 512 KB or smaller.');
  }

  const paths = new Set<string>();
  const directories = new Map<string, string>();
  for (const { path } of entries) {
    const parts = path.split('/');
    if (parts.some((part) => !part || part === '.' || part === '..' || /[\\:\x00-\x1f\x7f]/.test(part))
      || parts.at(-1)?.toLowerCase() === 'artifact-manifest.json') {
      throw new Error('The package contains an invalid or reserved file path.');
    }
    const key = path.toLowerCase();
    if (paths.has(key) || directories.has(key)) throw new Error('The package contains conflicting file paths.');
    paths.add(key);
    for (let index = 1; index < parts.length; index++) {
      const parent = parts.slice(0, index).join('/');
      const parentKey = parent.toLowerCase();
      const prior = directories.get(parentKey);
      if (paths.has(parentKey) || (prior && prior !== parent)) throw new Error('The package contains conflicting file paths.');
      directories.set(parentKey, parent);
    }
  }
}

async function packageMember(path: string, content: Blob): Promise<CodePackageMember> {
  const digest = await crypto.subtle.digest('SHA-256', await content.arrayBuffer());
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return { path, content, size: content.size, hash };
}

export async function buildCodePackageZip(
  identity: { assetId: string; versionId: string; version: string; track: 'DEV' | 'QC' },
  members: readonly CodePackageMember[],
): Promise<Blob> {
  validateCodePackage(members);
  const verified = await Promise.all(members.map(({ path, content }) => packageMember(path, content)));
  if (verified.some((member, index) => member.hash !== members[index].hash || member.size !== members[index].size)) {
    throw new Error('A package file no longer matches its registered contents.');
  }

  const { BlobReader, BlobWriter, TextReader, ZipWriter } = await import('@zip.js/zip.js');
  const writer = new ZipWriter(new BlobWriter('application/zip'), { useWebWorkers: false });
  try {
    for (const { path, content } of verified) await writer.add(path, new BlobReader(content));
    const files = verified.map(({ path, size, hash }) => ({ path, size, hash }));
    await writer.add('artifact-manifest.json', new TextReader(JSON.stringify({ ...identity, files }, null, 2)));
    return await writer.close();
  } catch (error) {
    await writer.close().catch(() => {});
    throw error;
  }
}

export function validateCodePackage(members: readonly CodePackageMember[]) {
  checkEntries(members.map(({ path, content }) => ({ path, size: content.size })));
}

export async function readCodeFolder(files: readonly File[]) {
  const roots = new Set(files.map((file) => file.webkitRelativePath.split('/')[0]));
  if (roots.size > 1) throw new Error('Choose one folder.');
  const entries = files.map((file) => ({
    path: file.webkitRelativePath.split('/').slice(1).join('/') || file.name,
    size: file.size,
    file,
  }));
  checkEntries(entries);
  return Promise.all(entries.map(({ path, file }) => packageMember(path, file)));
}

export async function readCodeZip(file: File) {
  if (!/\.zip$/i.test(file.name)) throw new Error('Choose a ZIP file or drop a folder.');
  if (file.size > MAX_BYTES) throw new Error('The package must be 512 KB or smaller.');
  const { BlobReader, ZipReader } = await import('@zip.js/zip.js');
  const reader = new ZipReader(new BlobReader(file), { useWebWorkers: false });
  try {
    const entries = await reader.getEntries();
    if (entries.some((entry) => entry.symlink || entry.encrypted)) {
      throw new Error('Symbolic links and encrypted files are not supported.');
    }
    const files = entries.filter((entry) => !entry.directory);
    checkEntries(files.map((entry) => ({ path: entry.filename, size: entry.uncompressedSize })));
    const members: CodePackageMember[] = [];
    for (const entry of files) {
      const bytes = new Uint8Array(entry.uncompressedSize);
      let size = 0;
      await entry.getData(new WritableStream<Uint8Array>({
        write(chunk) {
          if (size + chunk.length > bytes.length) throw new Error('The ZIP contains an invalid file size.');
          bytes.set(chunk, size);
          size += chunk.length;
        },
      }), { checkCrc32: true, checkOverlappingEntry: true });
      if (size !== bytes.length) throw new Error('The ZIP contains an invalid file size.');
      members.push(await packageMember(entry.filename, new Blob([bytes])));
    }
    return members;
  } finally {
    await reader.close();
  }
}

export async function readDroppedCodePackage(data: DataTransfer) {
  const items = Array.from(data.items).filter((item) => item.kind === 'file');
  if (items.length !== 1) throw new Error('Drop one folder or ZIP file.');
  const entry = items[0].webkitGetAsEntry?.();
  if (!entry?.isDirectory) {
    const file = items[0].getAsFile();
    if (!file || !/\.zip$/i.test(file.name)) throw new Error('Drop one folder or ZIP file.');
    return { name: file.name, members: await readCodeZip(file) };
  }

  const files: { path: string; file: File }[] = [];
  let bytes = 0;
  const walk = async (directory: FileSystemDirectoryEntry, prefix: string) => {
    const reader = directory.createReader();
    for (;;) {
      const children = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
      if (!children.length) return;
      for (const child of children) {
        const path = prefix + child.name;
        if (child.isDirectory) await walk(child as FileSystemDirectoryEntry, path + '/');
        else if (child.isFile) {
          const file = await new Promise<File>((resolve, reject) => (child as FileSystemFileEntry).file(resolve, reject));
          files.push({ path, file });
          bytes += file.size;
          if (files.length > MAX_FILES || bytes > MAX_BYTES) throw new Error('Use up to 100 files and 512 KB total.');
        }
      }
    }
  };
  await walk(entry as FileSystemDirectoryEntry, '');
  checkEntries(files.map(({ path, file }) => ({ path, size: file.size })));
  return { name: entry.name, members: await Promise.all(files.map(({ path, file }) => packageMember(path, file))) };
}
