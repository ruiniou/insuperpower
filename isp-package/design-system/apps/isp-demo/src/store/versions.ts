import type { Version } from './types';

export const VERSION_FORMAT_HINT = 'Use digits separated by periods, e.g. 1.2.3.';

export function parseVersionLabel(input: string): string | null {
  const label = input.trim();
  return /^[0-9]+(?:\.[0-9]+)*$/.test(label) ? label : null;
}

/** Old records can have a v prefix. Keep their labels and compare the numeric text. */
export function storedVersionLabel(label: string): string | null {
  return parseVersionLabel(label.trim().replace(/^v/i, ''));
}

function compareSegments(a: bigint[], b: bigint[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  }
  return a.length - b.length;
}

export function suggestNextVersion(versions: readonly Version[]): string {
  let highest: bigint[] = [];
  for (const version of versions) {
    const label = storedVersionLabel(version.label);
    if (!label) continue;
    const segments = label.split('.').map((segment) => BigInt(segment));
    if (compareSegments(segments, highest) > 0) highest = segments;
  }
  if (!highest.length) return '1.0';
  highest[highest.length - 1] += 1n;
  return highest.join('.');
}
