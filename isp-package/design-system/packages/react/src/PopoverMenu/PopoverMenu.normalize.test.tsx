import { describe, expect, it } from 'vitest';
import { normalizeMenuItems } from './PopoverMenu';

const kinds = (a: ReturnType<typeof normalizeMenuItems>) => a.map((i) => (i.divider ? '|' : i.value));

describe('normalizeMenuItems', () => {
  it('danger 项沉到末尾并与前面隔开', () => {
    expect(kinds(normalizeMenuItems([{ value: 'rm', danger: true }, { value: 'a' }, { value: 'b' }]))).toEqual(['a', 'b', '|', 'rm']);
  });
  it('分组不同的相邻项之间插入分隔线', () => {
    expect(kinds(normalizeMenuItems([{ value: 'a', group: 'x' }, { value: 'b', group: 'x' }, { value: 'c', group: 'y' }]))).toEqual(['a', 'b', '|', 'c']);
  });
  it('只有 danger 项时不出现前导分隔线', () => {
    expect(kinds(normalizeMenuItems([{ value: 'rm', danger: true }]))).toEqual(['rm']);
  });
  it('无分组无 danger 时原样返回', () => {
    expect(kinds(normalizeMenuItems([{ value: 'a' }, { value: 'b' }]))).toEqual(['a', 'b']);
  });
});
