import { useEffect, useLayoutEffect, type RefObject } from 'react';

const MARGIN = 4;

/**
 * 弹出层边缘检测（规则同 Tooltip，参考 Atlas）：
 * 下方放不下且上方放得下（或上方空间更大）时翻到触发元素上方；仍放不下则限制最大高度；
 * 左右越界时整体平移，保持离视口边缘 4px。
 * 弹出层须是相对触发元素绝对定位的元素（默认在其下方）。open 为 true 时每次渲染后同步测量，避免闪烁。
 */
export function useEdgeFit(ref: RefObject<HTMLElement | null>, open: boolean) {
  const fit = () => {
    const el = ref.current; const anchor = el?.offsetParent as HTMLElement | null;
    if (!el || !anchor) return;
    // 复位到默认位置再测量
    el.style.top = ''; el.style.bottom = ''; el.style.maxHeight = ''; el.style.translate = '';
    const a = anchor.getBoundingClientRect(); const r = el.getBoundingClientRect();
    const vw = window.innerWidth; const vh = window.innerHeight;
    const gap = Math.max(0, r.top - a.bottom);
    const below = vh - MARGIN - r.top; const above = a.top - gap - MARGIN;
    if (r.height > below) {
      if (above > below) {
        el.style.top = 'auto'; el.style.bottom = `calc(100% + ${gap}px)`;
        if (r.height > above) el.style.maxHeight = `${Math.floor(above)}px`;
      } else el.style.maxHeight = `${Math.floor(below)}px`;
    }
    const r2 = el.getBoundingClientRect();
    let dx = 0;
    if (r2.right > vw - MARGIN) dx = vw - MARGIN - r2.right;
    if (r2.left + dx < MARGIN) dx = MARGIN - r2.left;
    if (dx) el.style.translate = `${Math.round(dx)}px 0`;
  };
  useLayoutEffect(() => { if (open) fit(); });
  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', fit); window.addEventListener('scroll', fit, true);
    return () => { window.removeEventListener('resize', fit); window.removeEventListener('scroll', fit, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
