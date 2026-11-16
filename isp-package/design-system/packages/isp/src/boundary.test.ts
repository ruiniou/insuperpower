/** 依赖方向：@wiz/isp → @wiz/react，反向不允许；isp 样式不写色值 */
const reactSrc = import.meta.glob('../../react/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const ispCss = import.meta.glob('./**/*.css', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('packages/isp 边界', () => {
  it('@wiz/react 源码不引用 @wiz/isp', () => {
    const files = Object.entries(reactSrc);
    expect(files.length).toBeGreaterThan(50);
    const bad = files.filter(([, src]) => /@wiz\/isp|packages\/isp/.test(src)).map(([f]) => f);
    expect(bad).toEqual([]);
  });
  it('isp 的 CSS 不含写死色值（#hex / rgb() / rgba()）', () => {
    const files = Object.entries(ispCss);
    expect(files.length).toBeGreaterThan(5);
    const bad = files.filter(([, src]) => /#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(src)).map(([f]) => f);
    expect(bad).toEqual([]);
  });
});
