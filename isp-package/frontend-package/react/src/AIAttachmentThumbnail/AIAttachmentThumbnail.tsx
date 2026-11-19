import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import './AIAttachmentThumbnail.css';

/** Figma 变体属性 State；hover 为强制显示悬停样式（真实悬停也会生效） */
export type AIAttachmentThumbnailState = 'default' | 'uploading' | 'hover';

export interface AIAttachmentThumbnailProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onClick'> {
  state?: AIAttachmentThumbnailState;
  /** 图片地址；不传显示灰底占位 */
  src?: string;
  /** 文件名，用于 alt 与提示 */
  name?: string;
  /** 序号；传入后左上角显示序号角标 */
  order?: number;
  /** 点击缩略图（预览） */
  onPreview?: () => void;
  /** 点击右上角关闭（移除） */
  onRemove?: () => void;
}

export function AIAttachmentThumbnail({
  state = 'default', src, name = 'Attachment', order, onPreview, onRemove, className, ...rest
}: AIAttachmentThumbnailProps) {
  const uploading = state === 'uploading';
  return (
    <div
      {...rest}
      className={cx('wiz-attach-thumb', `wiz-attach-thumb--${state}`, className)}
      title={rest.title ?? name}
    >
      <button
        type="button"
        className="wiz-attach-thumb__image"
        aria-label={`Preview ${name}`}
        onClick={onPreview}
        style={src ? { backgroundImage: `url("${src}")` } : undefined}
      />
      {uploading && (
        <>
          <span className="wiz-attach-thumb__overlay" aria-hidden="true" />
          <i className="ri-loader-4-line wiz-attach-thumb__spinner" aria-hidden="true" />
        </>
      )}
      {order != null && !uploading && <span className="wiz-attach-thumb__order" aria-hidden="true">{order}</span>}
      <button
        type="button"
        className="wiz-attach-thumb__close"
        aria-label={`Remove ${name}`}
        onClick={onRemove}
      >
        <i className="ri-close-circle-fill" aria-hidden="true" />
      </button>
    </div>
  );
}
