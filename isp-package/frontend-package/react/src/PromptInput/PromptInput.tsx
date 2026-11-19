import {
  useCallback, useLayoutEffect, useRef, useState,
  type ChangeEvent, type HTMLAttributes, type KeyboardEvent,
} from 'react';
import { cx } from '../cx';
import { AIAttachmentThumbnail } from '../AIAttachmentThumbnail/AIAttachmentThumbnail';
import './PromptInput.css';

/** 单行行高（Body 1：14px），8 行 = 136px */
const LINE_HEIGHT = 17;
/** 无附件时输入区最小高度：对应 Figma Default 总高 128 */
const MIN_AREA_HEIGHT = 60;

export interface PromptAttachment {
  id: string;
  name: string;
  /** 缩略图地址 */
  src?: string;
  /** uploading 时缩略图置灰并显示转圈，发送键禁用 */
  status?: 'ready' | 'uploading';
}

/**
 * 预览用的强制状态：Figma 的 Hover、Focused。其余 Figma 状态由 props 推导：
 * Default = 无内容；Filled = 有内容；Running = running；Stopping = stopping；
 * Extra States = disabled；Max Height = 内容超过 maxRows 行；With Attachments = attachments 非空。
 */
export type PromptInputPreviewState = 'hover' | 'focused';

export interface PromptInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children' | 'defaultValue'> {
  /** 受控值；不传则内部自管（配合 defaultValue） */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** 发送：Enter（Shift+Enter 换行）或点击发送键。受控时由调用方清空 value 与附件 */
  onSend?: (value: string, attachments: PromptAttachment[]) => void;
  /** 停止：running 时点击停止键 */
  onStop?: () => void;
  /** 运行中：整框收成一行状态条 + 停止键 */
  running?: boolean;
  /** 运行中状态条文字 */
  runningText?: string;
  /** 停止中：恢复输入框外观，停止键置灰不可点 */
  stopping?: boolean;
  /** 只读（如历史会话）：整框置灰、不可输入 */
  disabled?: boolean;
  /** 空值提示；不传显示「Type a prompt or press @ for commands」 */
  placeholder?: string;
  /** disabled 时的提示 */
  disabledPlaceholder?: string;
  attachments?: PromptAttachment[];
  /** 附件上限，默认 5；达到上限后附件入口禁用 */
  maxAttachments?: number;
  /** 点击回形针；文件选择由调用方完成 */
  onAttach?: () => void;
  onRemoveAttachment?: (id: string) => void;
  onPreviewAttachment?: (id: string) => void;
  /** 点击 @ 入口；菜单由调用方渲染 */
  onMention?: () => void;
  /** 最大行数，默认 8；超出后框内滚动，输入框不再变高 */
  maxRows?: number;
  previewState?: PromptInputPreviewState;
}

export function PromptInput({
  value: valueProp, defaultValue = '', onChange, onSend, onStop,
  running = false, runningText = 'AI analysis in progress', stopping = false, disabled = false,
  placeholder, disabledPlaceholder = 'Historical session is read-only',
  attachments = [], maxAttachments = 5, onAttach, onRemoveAttachment, onPreviewAttachment, onMention,
  maxRows = 8, previewState, className, ...rest
}: PromptInputProps) {
  const [inner, setInner] = useState(defaultValue);
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : inner;
  const ref = useRef<HTMLTextAreaElement>(null);
  const hasAttachments = attachments.length > 0;
  const uploading = attachments.some((a) => a.status === 'uploading');
  const canSend = !disabled && !stopping && !uploading && (value.trim().length > 0 || hasAttachments);
  const maxHeight = maxRows * LINE_HEIGHT;
  const showRunning = running && !stopping && !disabled;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const min = hasAttachments ? LINE_HEIGHT : MIN_AREA_HEIGHT;
    el.style.height = `${Math.min(Math.max(el.scrollHeight, min), maxHeight)}px`;
  }, [value, hasAttachments, maxHeight, showRunning]);

  const set = useCallback((v: string) => {
    if (!controlled) setInner(v);
    onChange?.(v);
  }, [controlled, onChange]);

  const send = () => {
    if (!canSend) return;
    onSend?.(value.trim(), attachments);
    if (!controlled) setInner('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const status = disabled ? 'disabled' : stopping ? 'stopping' : showRunning ? 'running' : 'idle';
  const classes = cx(
    'wiz-prompt', `wiz-prompt--${status}`,
    previewState === 'hover' && 'is-hover', previewState === 'focused' && 'is-focused',
    className,
  );

  if (showRunning) {
    return (
      <div {...rest} className={classes}>
        <div className="wiz-prompt__running">
          <span className="wiz-prompt__icon wiz-prompt__icon--spark"><i className="ri-sparkling-2-fill" aria-hidden="true" /></span>
          <span className="wiz-prompt__running-text" role="status">{runningText}</span>
          <button type="button" className="wiz-prompt__round wiz-prompt__stop is-running" aria-label="Stop" onClick={onStop}>
            <span className="wiz-prompt__square" />
          </button>
        </div>
      </div>
    );
  }

  const canAddMore = !disabled && attachments.length < maxAttachments;
  const empty = value.length === 0;
  return (
    <div {...rest} className={classes}>
      {hasAttachments && (
        <div className="wiz-prompt__attachments">
          {attachments.map((a, i) => (
            <AIAttachmentThumbnail
              key={a.id} name={a.name} src={a.src} order={i + 1}
              state={a.status === 'uploading' ? 'uploading' : 'default'}
              onRemove={() => onRemoveAttachment?.(a.id)}
              onPreview={() => onPreviewAttachment?.(a.id)}
            />
          ))}
        </div>
      )}
      <div className={cx('wiz-prompt__area', hasAttachments && 'has-attachments')}>
        <textarea
          ref={ref}
          className="wiz-prompt__textarea"
          rows={1}
          value={value}
          disabled={disabled}
          aria-label="Prompt"
          placeholder={disabled ? disabledPlaceholder : placeholder}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => set(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {empty && !disabled && placeholder === undefined && (
          <div className="wiz-prompt__hint" aria-hidden="true">
            <span>Type a prompt or press</span>
            <span className="wiz-prompt__kbd"><i className="ri-at-line" /></span>
            <span>for commands</span>
          </div>
        )}
      </div>
      <div className="wiz-prompt__actions">
        <div className="wiz-prompt__tools">
          <button
            type="button" className="wiz-prompt__round wiz-prompt__tool" disabled={!canAddMore}
            aria-label={canAddMore ? 'Upload image' : 'Maximum attachments reached'} onClick={onAttach}
          ><i className="ri-attachment-2" aria-hidden="true" /></button>
          <button
            type="button" className="wiz-prompt__round wiz-prompt__tool" disabled={disabled}
            aria-label="Mention scope or table" onClick={onMention}
          ><i className="ri-at-line" aria-hidden="true" /></button>
        </div>
        {stopping ? (
          <button type="button" className="wiz-prompt__round wiz-prompt__stop is-stopping" disabled aria-label="Stopping">
            <span className="wiz-prompt__square" />
          </button>
        ) : (
          <button
            type="button" className={cx('wiz-prompt__round wiz-prompt__send', canSend && 'is-ready')}
            disabled={!canSend} aria-label="Send" onClick={send}
          ><i className="ri-arrow-up-line" aria-hidden="true" /></button>
        )}
      </div>
    </div>
  );
}
