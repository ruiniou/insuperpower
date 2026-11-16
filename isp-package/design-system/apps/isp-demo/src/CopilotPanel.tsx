import { useEffect, useState } from 'react';
import { ChatStream, IconButton, PromptInput, Status, type ChatMessage } from '@wiz/react';
import type { Route } from './router';
import { S } from './store/selectors';

/** 当前页的上下文标签与占位对话（文案与 index.html 的 copCtx 一致） */
function copilotContext(R: Route): { label: string; ask: string; answer: string } {
  if (R.name === 'studies') return { label: 'Studies', ask: 'Which studies need attention?', answer: 'STU-001 has a newer SAP version than its Primary Analysis Event is using. Open the Event to review the update.' };
  if (R.name === 'studyNew') return { label: 'New Study', ask: 'What do I need for a new Study?', answer: 'Study ID and name are required. Role defaults to STAT, and new Studies start Unblinded. Members are optional.' };
  if (R.name === 'study') {
    const tab = ({ events: 'Events', asset: 'Asset', dataset: 'Dataset', member: 'Member' } as Record<string, string>)[R.tab] ?? '';
    return { label: `${R.sid} ${tab}`.trim(), ask: 'Summarize what changed in this Study.', answer: 'Open the Asset tab to see the latest versions, and the Events tab to see which Events are behind.' };
  }
  const name = S.event(R.eid)?.name ?? '';
  if (R.tab === 'workflow') return { label: `${name} Workflow`, ask: 'Which Workflow should I open next?', answer: 'Open the one that is In review. Generate Code can start only after the Shell is locked.' };
  const tab = ({ overview: 'Overview', asset: 'Asset', dataset: 'Dataset', member: 'Member' } as Record<string, string>)[R.tab] ?? '';
  return { label: `${name} ${tab}`.trim(), ask: 'What should I do next in this Event?', answer: 'Check Next steps below the pipeline: start what is Ready, and adopt or keep the steps marked Update available.' };
}

const seed = (ask: string, answer: string): ChatMessage[] => [
  { id: 'seed-u', type: 'user', props: { content: ask } },
  { id: 'seed-a', type: 'assistant-text', props: { children: answer } },
];

/** Copilot 卡片：与主卡片并排的独立卡片，宽 360，头部 56。回复为占位，未接 AI 服务 */
export function CopilotPanel({ route, onClose }: { route: Route; onClose: () => void }) {
  const ctx = copilotContext(route);
  const [messages, setMessages] = useState<ChatMessage[]>(() => seed(ctx.ask, ctx.answer));
  const [draft, setDraft] = useState('');
  // 换页后上下文变了，对话换成该页的占位对话
  useEffect(() => { setMessages(seed(ctx.ask, ctx.answer)); }, [ctx.label, ctx.ask, ctx.answer]);
  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const id = String(Date.now());
    setMessages((m) => [...m, { id: `${id}-u`, type: 'user', props: { content: t } }, { id: `${id}-a`, type: 'assistant-text', props: { children: 'Demo reply: Copilot answers are not connected in this prototype.' } }]);
    setDraft('');
  };
  return (
    <aside className="app-cop" aria-label="Copilot">
      <header className="app-cop__head">
        <span className="app-cop__title"><i className="ri-bard-fill" aria-hidden="true" />Copilot</span>
        <span className="app-cop__acts">
          <IconButton size="small" icon="ri-chat-new-line" aria-label="New chat" title="New chat"
            onClick={() => { setMessages([{ id: 'new', type: 'assistant-text', props: { children: 'New conversation. Ask about what is on this page.' } }]); setDraft(''); }} />
          <IconButton size="small" icon="ri-close-line" aria-label="Close Copilot" title="Close Copilot" onClick={onClose} />
        </span>
      </header>
      <ChatStream className="app-cop__stream" messages={messages}
        footer={<div className="app-cop__foot"><Status variant="style1" tone="grey" textCase="normal" title="Context for this conversation">{ctx.label}</Status><PromptInput value={draft} onChange={setDraft} onSend={send} placeholder="Ask Copilot" /></div>} />
    </aside>
  );
}
