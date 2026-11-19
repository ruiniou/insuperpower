import { useEffect, useState, type HTMLAttributes } from 'react';
import { cx } from '../cx';
import './AIImageRenderCard.css';

/** Figma 变体属性 State（State6 即失败态，这里命名为 failed） */
export type AIImageRenderState = 'generating' | 'complete' | 'complete-hover' | 'complete-focused' | 'failed';

export interface AIImageRenderCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  state?: AIImageRenderState;
  /** 版本号，默认 V1.0 */
  versionLabel?: string;
  /** 版本角标，默认 Latest */
  badge?: string;
  /** 图片地址；不传显示占位 */
  imageSrc?: string;
  alt?: string;
  /** 点击图片区域（或悬停按钮）；不传则内部打开全屏预览 */
  onView?: () => void;
  onRetry?: () => void;
}

export function AIImageRenderCard({
  state = 'generating', versionLabel = 'V1.0', badge = 'Latest', imageSrc, alt = 'AI generated figure', onView, onRetry, className, ...rest
}: AIImageRenderCardProps) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (state === 'generating' || state === 'failed') {
    const failed = state === 'failed';
    return (
      <div {...rest} className={cx('wiz-image-card', 'wiz-image-card--row', failed && 'wiz-image-card--failed', className)} role={failed ? 'alert' : 'status'}>
        <i className={cx('wiz-image-card__icon', failed ? 'ri-error-warning-line' : 'ri-image-line')} aria-hidden="true" />
        <span className="wiz-image-card__label">{failed ? 'Preview generation failed' : 'Generating Preview...'}</span>
        {failed ? (
          <button type="button" className="wiz-image-card__retry" onClick={onRetry}>Retry</button>
        ) : (
          <i className="ri-sparkling-2-fill wiz-image-card__spark" aria-hidden="true" />
        )}
      </div>
    );
  }
  const view = () => (onView ? onView() : setOpen(true));
  return (
    <div {...rest} className={cx('wiz-image-card', 'wiz-image-card--complete', `wiz-image-card--${state}`, className)}>
      <div className="wiz-image-card__header">
        <i className="ri-image-line wiz-image-card__icon" aria-hidden="true" />
        <span className="wiz-image-card__title">{versionLabel}</span>
        <span className="wiz-image-card__badge">{badge}</span>
      </div>
      <button type="button" className="wiz-image-card__image" aria-label={`View ${versionLabel}`} onClick={view}>
        {imageSrc ? (
          <img src={imageSrc} alt={alt} className="wiz-image-card__img" />
        ) : (
          <span className="wiz-image-card__placeholder">
            <i className="ri-image-line" aria-hidden="true" />
            <span>AI generated figure preview</span>
          </span>
        )}
        <span className="wiz-image-card__overlay" aria-hidden="true" />
        <span className="wiz-image-card__view" aria-hidden="true"><i className="ri-eye-line" /></span>
      </button>
      {open && (
        <div className="wiz-image-modal" role="dialog" aria-modal="true" aria-label={versionLabel} onClick={() => setOpen(false)}>
          <div className="wiz-image-modal__panel" onClick={(e) => e.stopPropagation()}>
            <div className="wiz-image-modal__head">
              <span>{versionLabel}</span>
              <button type="button" className="wiz-image-modal__close" aria-label="Close" onClick={() => setOpen(false)}><i className="ri-close-line" /></button>
            </div>
            <div className="wiz-image-modal__body">
              {imageSrc ? <img src={imageSrc} alt={alt} /> : <span className="wiz-image-card__placeholder"><i className="ri-image-line" /><span>AI generated figure preview</span></span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
