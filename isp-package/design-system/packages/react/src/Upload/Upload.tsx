import { useRef, useState, type DragEvent, type HTMLAttributes, type ReactNode } from 'react';
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
  invalid?: boolean;
  /** 是否在下方渲染已选文件条，默认 true */
  showFiles?: boolean;
  /** Replace the picker with the selected file list inside the same zone. */
  selectedInZone?: boolean;
  /** 受控文件名列表 */
  files?: string[];
  defaultFiles?: string[];
  onFilesChange?: (files: string[]) => void;
  /** Actual files from the native picker or standard drop zone. */
  onFilesPick?: (files: File[]) => void;
  /** 覆盖点击行为（不弹原生选择器） */
  onBrowse?: () => void;
  /** Alternate file pickers rendered inside a non-interactive upload zone. */
  browseActions?: ReactNode;
  /** Handles dropped content when the upload zone uses custom pickers. */
  onFilesDrop?: (data: DataTransfer) => void;
  /** 强制 hover 样式，供展示用 */
  forceHover?: boolean;
}

export function Upload({
  title = 'Drag and Drop or Browse File', hint = 'Supports .docx, .xlsx ; Max 50 MB', accept, multiple = true, disabled, invalid, showFiles = true,
  selectedInZone = false, files, defaultFiles = [], onFilesChange, onFilesPick, onBrowse, browseActions, onFilesDrop, forceHover, className, ...rest
}: UploadProps) {
  const [list, setList] = useControllable<string[]>(files, defaultFiles, onFilesChange);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const pickFiles = (files: File[]) => {
    const picked = multiple ? files : files.slice(0, 1);
    if (!picked.length) return;
    const names = picked.map((file) => file.name);
    setList(multiple ? [...list, ...names] : names);
    onFilesPick?.(picked);
  };
  const browse = () => { if (disabled) return; if (onBrowse) onBrowse(); else input.current?.click(); };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (disabled) return;
    if (onFilesDrop) onFilesDrop(e.dataTransfer);
    else pickFiles(Array.from(e.dataTransfer.files));
  };

  const customBrowse = browseActions != null;
  const acceptsDrop = !customBrowse || Boolean(onFilesDrop);

  const fileList = showFiles && list.length > 0 && (
    <ul className="wiz-upload__files">
      {list.map((name, i) => (
        <li key={`${name}-${i}`}>
          <FileChip name={name} onRemove={disabled ? undefined : () => setList(list.filter((_, j) => j !== i))} />
        </li>
      ))}
    </ul>
  );

  if (selectedInZone && fileList) {
    return (
      <div {...rest} className={cx('wiz-upload', className)}>
        <div className={cx('wiz-upload__zone--selected', invalid && 'is-invalid')}
          onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'none'; }}
          onDrop={(event) => event.preventDefault()}>
          {fileList}
        </div>
      </div>
    );
  }

  return (
    <div {...rest} className={cx('wiz-upload', className)}>
      <div
        role={customBrowse ? undefined : "button"}
        tabIndex={customBrowse ? undefined : disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-invalid={invalid || undefined}
        className={cx('wiz-upload__zone', customBrowse && 'wiz-upload__zone--custom-browse', (drag || forceHover) && 'is-hover', disabled && 'is-disabled', invalid && 'is-invalid')}
        onClick={customBrowse ? undefined : browse}
        onKeyDown={customBrowse ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); browse(); } }}
        onDragOver={!acceptsDrop ? undefined : (e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
        onDragLeave={!acceptsDrop ? undefined : () => setDrag(false)}
        onDrop={acceptsDrop ? onDrop : undefined}
      >
        <i className="ri-file-add-fill wiz-upload__icon" aria-hidden="true" />
        <span className="wiz-upload__title">{title}</span>
        {hint && <span className="wiz-upload__hint">{hint}</span>}
        {customBrowse ? <div className="wiz-upload__actions">{browseActions}</div> : <input ref={input} type="file" hidden accept={accept} multiple={multiple} disabled={disabled} data-testid="wiz-upload-input"
          onChange={(e) => { pickFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }} />}
      </div>
      {fileList}
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
