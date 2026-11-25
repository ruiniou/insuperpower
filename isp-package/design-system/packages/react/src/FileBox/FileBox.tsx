import { useRef, type HTMLAttributes } from 'react';
import { IconButton } from '../IconButton/IconButton';
import { Button } from '../Button/Button';
import { cx } from '../cx';
import './FileBox.css';

/** 文件选择框（原型 .fileb）：虚线框 = 「Choose file…」按钮 + 文件名；只选一个文件，不做拖放（需要拖放用 Upload） */
export interface FileBoxProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** 当前文件名；空 = 未选择 */
  fileName?: string;
  /** 例如 ".pdf,.docx"，传给原生 input */
  accept?: string;
  onChange?: (fileName: string, file: File) => void;
  onRemove?: () => void;
  buttonLabel?: string;
  emptyText?: string;
  disabled?: boolean;
  /** 错误态（描边变红） */
  invalid?: boolean;
}

export function FileBox({ fileName, accept, onChange, onRemove, buttonLabel = 'Choose file…', emptyText = 'No file chosen', disabled, invalid, className, ...rest }: FileBoxProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div {...rest} className={cx('wiz-filebox', invalid && 'is-invalid', disabled && 'is-disabled', className)}>
      <input ref={input} type="file" hidden accept={accept} data-testid="filebox-input" tabIndex={-1}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange?.(f.name, f); e.target.value = ''; }} />
      <Button size="small" leftIcon="ri-upload-2-line" disabled={disabled} onClick={() => input.current?.click()}>{buttonLabel}</Button>
      <span className={cx('wiz-filebox__name', fileName && 'has-file')} title={fileName || undefined}>{fileName || emptyText}</span>
      {fileName && onRemove && <IconButton icon="ri-close-line" size="small" disabled={disabled}
        aria-label={`Remove ${fileName}`} tooltip="Remove file" onClick={onRemove} />}
    </div>
  );
}
