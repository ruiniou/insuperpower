import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import './UserChat.css';

/**
 * Figma User Chat 的 6 个变体均由 props 推导：
 * Short / Long：只传 content；With Files：files + content；Only File：只传 files；
 * Variant6（标签折叠）：tags + content；With Tags Expanded：tags + tagsExpanded + content。
 */
export interface UserChatProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  /** 用户输入文字，按 \n 换行 */
  content?: string;
  /** 附件文件名（显示为带 Excel 图标的小块，位于文字上方） */
  files?: string[];
  /** 引用的标签（如 TC-001） */
  tags?: string[];
  /** 标签是否展开；不传则内部不自管，由调用方控制（默认折叠） */
  tagsExpanded?: boolean;
  /** 折叠时最多显示的标签数，默认 4，其余显示 “+N” */
  maxCollapsedTags?: number;
  onToggleTags?: (next: boolean) => void;
}

export function UserChat({
  content, files = [], tags = [], tagsExpanded = false, maxCollapsedTags = 4, onToggleTags, className, ...rest
}: UserChatProps) {
  const onlyFile = !content && files.length > 0 && tags.length === 0;
  const shownTags = tagsExpanded ? tags : tags.slice(0, maxCollapsedTags);
  const hidden = tags.length - shownTags.length;
  const hasChips = !onlyFile && (files.length > 0 || tags.length > 0);
  return (
    <div {...rest} className={cx('wiz-user-chat', onlyFile && 'wiz-user-chat--only-file', className)}>
      {onlyFile ? (
        files.map((f) => (
          <span key={f} className="wiz-user-chat__only-file">
            <i className="ri-file-excel-2-fill wiz-user-chat__file-icon" aria-hidden="true" />
            <span>{f}</span>
          </span>
        ))
      ) : (
        <>
          {hasChips && (
            <div className="wiz-user-chat__chips">
              {files.map((f) => (
                <span key={f} className="wiz-user-chat__chip">
                  <i className="ri-file-excel-2-fill wiz-user-chat__file-icon" aria-hidden="true" />
                  <span>{f}</span>
                </span>
              ))}
              {shownTags.map((t) => (
                <span key={t} className="wiz-user-chat__chip">
                  <i className="ri-list-check-3 wiz-user-chat__tag-icon" aria-hidden="true" />
                  <span>{t}</span>
                </span>
              ))}
              {hidden > 0 && (
                <button type="button" className="wiz-user-chat__chip wiz-user-chat__more" onClick={() => onToggleTags?.(true)}>+{hidden}</button>
              )}
              {tagsExpanded && tags.length > maxCollapsedTags && (
                <button type="button" className="wiz-user-chat__chip wiz-user-chat__more" onClick={() => onToggleTags?.(false)}>Collapse</button>
              )}
            </div>
          )}
          {content && <p className="wiz-user-chat__text">{content}</p>}
        </>
      )}
    </div>
  );
}
