import { useRef, useState, type DragEvent, type HTMLAttributes } from 'react';
import { cx } from '../cx';
import { useControllable } from '../useControllable';
import './Upload.css';

/** Figma Upload 377:908：Default / hover（拖入或悬停）/ Uploaded（下方显示文件条） */
export interface UploadProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  title?: string;
  hint?: string;
  accept?: string;
  /** 默认 true */
  multiple?: boolean;
  disabled?: boolean;
  /** 是否在下方渲染已选文件条，默认 true */
  showFiles?: boolean;
  /** 受控文件名列表 */
  files?: string[];
  defaultFiles?: string[];
  onFilesChange?: (files: string[]) => void;
  /** 覆盖点击行为（不弹原生选择器） */
  onBrowse?: () => void;
  /** 强制 hover 样式，供展示用 */
  forceHover?: boolean;
}

export function Upload({
  title = 'Drag and Drop or Browse File', hint = 'Supports .docx, .xlsx ; Max 50 MB', accept, multiple = true, disabled, showFiles = true,
  files, defaultFiles = [], onFilesChange, onBrowse, forceHover, className, ...rest
}: UploadProps) {
  const [list, setList] = useControllable<string[]>(files, defaultFiles, onFilesChange);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const addNames = (names: string[]) => { if (names.length) setList(multiple ? [...list, ...names] : names.slice(0, 1)); };
  const browse = () => { if (disabled) return; if (onBrowse) onBrowse(); else input.current?.click(); };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); if (!disabled) addNames(Array.from(e.dataTransfer.files).map((f) => f.name)); };

  return (
    <div {...rest} className={cx('wiz-upload', className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        className={cx('wiz-upload__zone', (drag || forceHover) && 'is-hover', disabled && 'is-disabled')}
        onClick={browse}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); browse(); } }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        <i className="ri-file-add-fill wiz-upload__icon" aria-hidden="true" />
        <span className="wiz-upload__title">{title}</span>
        {hint && <span className="wiz-upload__hint">{hint}</span>}
        <input ref={input} type="file" hidden accept={accept} multiple={multiple} disabled={disabled} data-testid="wiz-upload-input"
          onChange={(e) => { addNames(Array.from(e.target.files ?? []).map((f) => f.name)); e.target.value = ''; }} />
      </div>
      {showFiles && list.length > 0 && (
        <ul className="wiz-upload__files">
          {list.map((name, i) => (
            <li key={`${name}-${i}`}><FileChip name={name} onRemove={disabled ? undefined : () => setList(list.filter((_, j) => j !== i))} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}

export interface FileChipProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  onRemove?: () => void;
}

function iconFor(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { cls: 'ri-file-excel-2-fill', tone: 'success' };
  if (['doc', 'docx'].includes(ext)) return { cls: 'ri-file-word-2-fill', tone: 'info' };
  if (ext === 'pdf') return { cls: 'ri-file-pdf-2-fill', tone: 'error' };
  return { cls: 'ri-file-text-fill', tone: 'grey' };
}

/** 已上传文件条（Figma Upload / Uploaded 下方的灰条） */
export function FileChip({ name, onRemove, className, ...rest }: FileChipProps) {
  const ic = iconFor(name);
  return (
    <div {...rest} className={cx('wiz-file-chip', className)}>
      <i className={cx(ic.cls, 'wiz-file-chip__icon', `is-${ic.tone}`)} aria-hidden="true" />
      <span className="wiz-file-chip__name" title={name}>{name}</span>
      {onRemove && (
        <button type="button" className="wiz-file-chip__remove" aria-label={`Remove ${name}`} onClick={onRemove}>
          <i className="ri-close-line" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
