import { useCallback, useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../cx';
import { UserChat, type UserChatProps } from '../UserChat/UserChat';
import { PureText, type PureTextProps } from '../PureText/PureText';
import { AIThinkingStatus, type AIThinkingStatusProps } from '../AIThinkingStatus/AIThinkingStatus';
import { AIToolCall, type AIToolCallProps } from '../AIToolCall/AIToolCall';
import { AIImageRenderCard, type AIImageRenderCardProps } from '../AIImageRenderCard/AIImageRenderCard';
import { CodeDiff, type CodeDiffProps } from '../CodeDiff/CodeDiff';
import { AIAskUser, type AIAskUserProps } from '../AIAskUser/AIAskUser';
import { CardScope, type CardScopeScopeProps, type CardScopeProgressProps, type CardScopeSummaryProps } from '../CardScope/CardScope';
import { AIErrorAlert, type AIErrorAlertProps } from '../AIErrorAlert/AIErrorAlert';
import { AIRiskSummary, type AIRiskSummaryProps } from '../AIRiskSummary/AIRiskSummary';
import './ChatStream.css';

/** 对话流消息：用 type 区分，props 为对应组件的 Props */
export type ChatMessage =
  | { id: string; type: 'user'; props: UserChatProps }
  | { id: string; type: 'assistant-text'; props: PureTextProps }
  | { id: string; type: 'thinking-status'; props?: AIThinkingStatusProps }
  | { id: string; type: 'tool-call'; props?: AIToolCallProps }
  | { id: string; type: 'image-render'; props?: AIImageRenderCardProps }
  | { id: string; type: 'diff'; props: CodeDiffProps }
  | { id: string; type: 'ask-user'; props: AIAskUserProps }
  | { id: string; type: 'scope-card'; props: Omit<CardScopeScopeProps, 'type'> }
  | { id: string; type: 'progress-card'; props: Omit<CardScopeProgressProps, 'type'> }
  | { id: string; type: 'summary-card'; props: Omit<CardScopeSummaryProps, 'type'> }
  | { id: string; type: 'error'; props?: AIErrorAlertProps }
  | { id: string; type: 'risk-summary'; props: AIRiskSummaryProps };

export type ChatMessageType = ChatMessage['type'];

export interface ChatStreamProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  messages: ChatMessage[];
  /** 底部固定区（放 Prompt Input 等），不随消息滚动 */
  footer?: ReactNode;
  /** 新消息自动滚到底部（用户上滑后不强制），默认 true */
  autoScroll?: boolean;
}

const NEAR_BOTTOM = 24;

function renderMessage(m: ChatMessage): ReactNode {
  switch (m.type) {
    case 'user': return <UserChat {...m.props} />;
    case 'assistant-text': return <PureText {...m.props} />;
    case 'thinking-status': return <AIThinkingStatus {...m.props} />;
    case 'tool-call': return <AIToolCall {...m.props} />;
    case 'image-render': return <AIImageRenderCard {...m.props} />;
    case 'diff': return <CodeDiff {...m.props} />;
    case 'ask-user': return <AIAskUser {...m.props} />;
    case 'scope-card': return <CardScope type="scope" {...m.props} />;
    case 'progress-card': return <CardScope type="progress" {...m.props} />;
    case 'summary-card': return <CardScope type="summary" {...m.props} />;
    case 'error': return <AIErrorAlert {...m.props} />;
    case 'risk-summary': return <AIRiskSummary {...m.props} />;
  }
}

export function ChatStream({ messages, footer, autoScroll = true, className, ...rest }: ChatStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM;
  }, []);

  const last = messages[messages.length - 1];
  // 末条内容变化（流式追加文字）时也要跟随
  const tick = last && 'props' in last && last.props && 'children' in last.props ? String(last.props.children).length : 0;
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !autoScroll) return;
    if (last?.type === 'user') stick.current = true; // 用户自己发送：一定回到底部
    if (stick.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, last?.type, tick, autoScroll]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div {...rest} className={cx('wiz-chat-stream', className)}>
      <div ref={scrollRef} className="wiz-chat-stream__scroll" role="log" aria-live="polite" onScroll={onScroll}>
        <div className="wiz-chat-stream__list">
          {messages.map((m) => (
            <div key={m.id} className={cx('wiz-chat-stream__item', `wiz-chat-stream__item--${m.type === 'user' ? 'user' : 'ai'}`, `wiz-chat-stream__item--${m.type}`)}>
              {renderMessage(m)}
            </div>
          ))}
        </div>
      </div>
      {footer && <div className="wiz-chat-stream__footer">{footer}</div>}
    </div>
  );
}
