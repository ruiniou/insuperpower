// @vitest-environment node
import { BlobReader, BlobWriter, TextReader, TextWriter, ZipReader, ZipWriter } from '@zip.js/zip.js';
import { buildCodePackageZip, readCodeFolder, readCodeZip, readDroppedCodePackage } from './codePackage';

it('reads nested ZIP members and preserves their original contents', async () => {
  const writer = new ZipWriter(new BlobWriter(), { useWebWorkers: false });
  await writer.add('analysis/main.sas', new TextReader('sample program'));
  const zip = new File([await writer.close()], 'programs.zip');
  const [entry] = await readCodeZip(zip);
  expect(entry.path).toBe('analysis/main.sas');
  expect(await entry.content.text()).toBe('sample program');
  expect(entry.hash).toMatch(/^[a-f0-9]{64}$/);
  const droppedZip = { items: [{ kind: 'file', getAsFile: () => zip }] } as unknown as DataTransfer;
  await expect(readDroppedCodePackage(droppedZip)).resolves.toMatchObject({
    name: 'programs.zip', members: [{ path: 'analysis/main.sas', hash: entry.hash }],
  });
});

it('keeps the selected folder’s relative paths and rejects conflicts', async () => {
  const file = new File(['sample'], 'main.sas');
  Object.defineProperty(file, 'webkitRelativePath', { value: 'programs/analysis/main.sas' });
  await expect(readCodeFolder([file])).resolves.toMatchObject([{ path: 'analysis/main.sas', size: 6 }]);
  await expect(readCodeFolder([file, file])).rejects.toThrow('conflicting file paths');
});

it('identifies a dropped folder and rejects a standalone non-ZIP file', async () => {
  const file = new File(['sample'], 'main.sas');
  const fileEntry = { name: file.name, isFile: true, file: (done: (value: File) => void) => done(file) };
  let read = false;
  const directory = {
    name: 'programs',
    isDirectory: true,
    createReader: () => ({ readEntries: (done: (entries: unknown[]) => void) => {
      done(read ? [] : [fileEntry]);
      read = true;
    } }),
  };
  const drop = (item: object) => ({ items: [{ kind: 'file', ...item }] }) as unknown as DataTransfer;
  await expect(readDroppedCodePackage(drop({ webkitGetAsEntry: () => directory }))).resolves.toMatchObject({
    name: 'programs', members: [{ path: 'main.sas', size: 6 }],
  });
  await expect(readDroppedCodePackage(drop({ getAsFile: () => file }))).rejects.toThrow('Drop one folder or ZIP file.');
});

it('exports the selected version with its relative paths and verified manifest', async () => {
  const file = new File(['older version'], 'main.sas');
  Object.defineProperty(file, 'webkitRelativePath', { value: 'programs/analysis/main.sas' });
  const members = await readCodeFolder([file]);
  const identity = { assetId: 'A8', versionId: 'A8:1', version: '1.0', track: 'DEV' as const };
  const content = await buildCodePackageZip(identity, members);
  const reader = new ZipReader(new BlobReader(content));
  try {
    const entries = (await reader.getEntries()).filter((entry) => !entry.directory);
    expect(entries.map((entry) => entry.filename)).toEqual(['analysis/main.sas', 'artifact-manifest.json']);
    expect(await entries[0].getData(new TextWriter())).toBe('older version');
    expect(JSON.parse(await entries[1].getData(new TextWriter()))).toEqual({
      ...identity, files: [{ path: 'analysis/main.sas', size: file.size, hash: members[0].hash }],
    });
  } finally {
    await reader.close();
  }
  await expect(buildCodePackageZip(identity, [{ ...members[0], content: new Blob(['replacement']) }])).rejects.toThrow('registered contents');
});
