import { useEffect, useState, type ReactNode } from 'react';
import { GeneralSections } from './GeneralSections';
import { NavSections } from './NavSections';
import { Batch7b1Sections } from './Batch7b1Sections';
import {
  LabelStatus, LabelScope, EventStatusBadge, AITagMini, AIStatus,
  Button, AIAskOption, AIAskUser, AIAskUserResult, CardScope, CodeDiff,
  AIAttachmentThumbnail, AttachedItemsChips, PromptShortcut, PromptInput, AddOn, PendingChanges, MetadataChanges, EventProgress,
  UserChat, AIThinkingStatus, AIImageRenderCard, AIToolCall, AIErrorAlert, AIRiskSummary, PureText, ChatStream,
  type PromptAttachment, type EventProgressItem, type ChatMessage,
  Markdown, MarkdownHeading, MarkdownLink, MarkdownInlineCode, MarkdownCallout, MarkdownBlockquote, MarkdownDivider,
  MarkdownCodeBlock, MarkdownImage, MarkdownCitation, MarkdownFootnote, MarkdownCheckbox,
  type LabelStatusValue, type ButtonSize, type CodeDiffLine,
} from '@wiz/react';

const FIGMA = 'https://www.figma.com/design/7wcCVMH0CyyjN4XxUbcM6T/Wiz-Agent-UI-Components?node-id=';

function Section({ id, title, node, meta, children }: { id: string; title: string; node: string; meta: string; children: ReactNode }) {
  return (
    <section id={id}>
      <h2>{title}</h2>
      <p className="meta">{meta} · <a href={FIGMA + node.replace(':', '-')} target="_blank" rel="noreferrer">Figma {node}</a></p>
      <div className="grid">{children}</div>
    </section>
  );
}
const Cell = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="cell"><code>{label}</code>{children}</div>
);

const statuses: LabelStatusValue[] = ['normal', 'running', 'queued', 'blocked', 'failed', 'skipped', 'interrupted', 'done'];

const sizes: ButtonSize[] = ['small', 'medium', 'large'];
const diffLines: CodeDiffLine[] = [
  { type: 'del', line: 1, text: "'ABC999 10 mg/kg'" },
  { type: 'del', line: 2, text: "'ABC999 20 mg/kg'" },
  { type: 'add', line: 1, text: "'ABC999 Cohort A (10 mg/kg)'" },
  { type: 'add', line: 2, text: "'ABC999 Cohort B (20 mg/kg)'" },
];
const scopeItems = [
  { title: 'Table 14.1.1 Demographics', description: 'Uses the changed variable AGE.' },
  { title: 'Table 14.1.1 Demographics', description: 'Uses the changed variable AGE.', tag: 'blocked' as const },
  { title: 'Table 14.1.1 Demographics', description: 'Uses the changed variable AGE.', selected: false },
];
const T = 'Table 14.1.1 Demographics';
const MISSING = 'Source variable AGE is missing in the uploaded file.';
const Q1 = { question: 'What type of assistance do you need?', options: ['Planning / Task Breakdown', 'Implementation', 'Review & Testing'] };
const Q2 = { question: 'How familiar are you with the codebase?', options: ['Expert', 'Intermediate', 'Newcomer'] };

const SAMPLE = `# 标题一 Heading 1
## 标题二 Heading 2
### 标题三 Heading 3

正文段落，包含 **加粗**、*斜体*、~~删除线~~、\`inline_code\`、[链接](https://example.com) 和脚注引用[^1]。

> 引用块：Keep the original meaning, and make every conclusion traceable to its source.
>
> > 嵌套引用。

> [!NOTE]
> Note：补充说明。

> [!TIP]
> Tip：小建议。

> [!WARNING]
> Warning：需要注意。

> [!CAUTION]
> Caution：可能造成数据丢失。

- 无序列表项一
- 无序列表项二
  - 嵌套项
1. 有序列表项一
2. 有序列表项二

- [x] 已完成的任务
- [ ] 未完成的任务

---

| Section | Items | Status |
|:--|--:|:--|
| Source documents | 12 | Ready |
| Validation rules | 8 | Review |
| Report sections | 4 | Ready |

\`\`\`sas
/* Demographics */
proc sql;
  create table work.dm as
  select usubjid, age from inds where age > 18 and sex = 'F';
quit;
%put done;
\`\`\`

\`\`\`json
{ "project": "Wiz workspace", "documents": 12 }
\`\`\`

![Figure 1. Document review workflow.](data:image/svg+xml;base64,AAAA "此处 data: 图片被安全规则丢弃，不渲染")

<script>alert('raw html is not rendered')</script>

[^1]: Source: Project documentation, version 2.1.
`;
const SAS_DEMO = "/* Demographics */\nproc sql;\n  create table work.dm as\n  select usubjid, age from inds where age > 18 and sex = 'F';\nquit;\n%put done;";


const LONG = Array.from({ length: 14 }, (_, i) => `${i + 1}. Update the Study Code field for the selected events and keep the existing output names unchanged.`).join('\n');
const thumb = (c: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="${c}"/></svg>`)}`;
const progressItems: EventProgressItem[] = [
  { status: 'done', label: 'Table 14.1.1 Demographics' },
  { status: 'running', label: 'Table 14.1.2 Demographics' },
  { status: 'queued', label: 'Table 14.2.1 Demographics' },
];
const manyProgress: EventProgressItem[] = Array.from({ length: 10 }, (_, i) => ({ status: (i < 4 ? 'done' : i === 4 ? 'running' : 'queued') as EventProgressItem['status'], label: `Table 14.${i + 1}.1 Demographics` }));
const pendingItems = [{ label: 'Lines 3-5' }, { label: 'Line 9' }, { label: 'Lines 12-14' }];
const manyPending = Array.from({ length: 12 }, (_, i) => ({ label: `Lines ${i * 4 + 1}-${i * 4 + 3}` }));
const metaRows = (n: number) => Array.from({ length: n }, (_, i) => (
  <div key={i} className="wiz-label-status" style={{ padding: '4px 12px', fontSize: 13 }}>Study Code · Variable label changed ({i + 1})</div>
));
const W = { width: 560 } as const;

/** 可真实输入的 Prompt Input：Enter 发送、Shift+Enter 换行，演示 Max Height 滚动、附件、运行/停止 */
function LivePrompt() {
  const [value, setValue] = useState('');
  const [atts, setAtts] = useState<PromptAttachment[]>([]);
  const [phase, setPhase] = useState<'idle' | 'running' | 'stopping'>('idle');
  const [log, setLog] = useState('（发送后这里显示结果）');
  useEffect(() => {
    if (phase !== 'stopping') return;
    const t = setTimeout(() => setPhase('idle'), 1200);
    return () => clearTimeout(t);
  }, [phase]);
  const add = () => {
    const id = String(Date.now());
    setAtts((a) => [...a, { id, name: `image-${a.length + 1}.png`, src: thumb(['#cfe0ff', '#ffe3cf', '#d6f2d6', '#f2d6ee', '#fff3b8'][a.length % 5]), status: 'uploading' }]);
    setTimeout(() => setAtts((a) => a.map((x) => (x.id === id ? { ...x, status: 'ready' } : x))), 1500);
  };
  return (
    <div style={W}>
      <PromptInput
        value={value} onChange={setValue} attachments={atts}
        running={phase !== 'idle'} stopping={phase === 'stopping'} runningText="AI analysis in progress, estimated time 10 minutes"
        onAttach={add} onRemoveAttachment={(id) => setAtts((a) => a.filter((x) => x.id !== id))}
        onSend={(v, a) => { setLog(`onSend(${JSON.stringify(v.length > 40 ? v.slice(0, 40) + '…' : v)}, ${a.length} 个附件)`); setValue(''); setAtts([]); setPhase('running'); }}
        onStop={() => setPhase('stopping')}
        onMention={() => setLog('onMention()')}
      />
      <div className="row" style={{ marginTop: 8 }}>
        <Button size="small" onClick={() => setValue(LONG)}>填入 14 行长文本</Button>
        <Button size="small" onClick={() => setValue('')}>清空</Button>
        <code style={{ fontSize: 11, color: 'var(--wiz-agent-muted)' }}>{log}</code>
      </div>
    </div>
  );
}
function AddOnLive() {
  const [v, setV] = useState('');
  return (
    <div style={W}>
      <EventProgress items={manyProgress} defaultExpanded title="Event Progress" input={<PromptInput value={v} onChange={setV} />} />
    </div>
  );
}


const TAGS = ['TC-001', 'TC-002', 'TC-003', 'TC-004', 'TC-005', 'TC-006', 'TC-007', 'TC-008', 'TC-009'];
const ERR_DETAILS = 'Error reason details here. This section can contain very long error messages including stack traces, variable states, and other diagnostic information that helps identify the root cause of the failure.';
const riskItems = [
  { level: 'attention' as const, title: 'Subject ID format differs between sources', detail: 'May break the merge of ADSL and ADAE.' },
  { level: 'attention' as const, title: 'Visit window overlaps in 2 events', detail: 'Derived windows may double count records.' },
  { level: 'reference' as const, title: 'Cohort labels follow the protocol title', detail: 'Basis: protocol section 4.2.' },
];
const imgSrc = (() => {
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='360' height='227'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#cfe0ff'/><stop offset='1' stop-color='#e8f3ec'/></linearGradient></defs><rect width='360' height='227' fill='url(#g)'/><polyline points='20,190 90,120 150,150 230,70 340,40' fill='none' stroke='#0049cd' stroke-width='3'/></svg>";
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
})();

const NOOP = () => {};
const STREAM_SCRIPT: ChatMessage[] = [
  { id: 's1', type: 'user', props: { files: ['DVP Verification.xlsx'], tags: TAGS.slice(0, 6), content: 'Please change the visit’s value of these items to “*” and generate edit rules by referring the document.' } },
  { id: 's2', type: 'thinking-status', props: { status: 'loading' } },
  { id: 's3', type: 'tool-call', props: { toolName: 'Read document', args: ['file: DVP Verification.xlsx', 'sheet: Visits'], result: ['6 rows matched'] } },
  { id: 's4', type: 'assistant-text', props: { children: "I found **6 matching rows**. Here is the plan:\n\n1. Replace the visit value with `*`\n2. Re-run the checks\n\n```sas\nproc format;\n  value $visit '*' = 'Any';\nrun;\n```\n\n> [!NOTE]\n> Only the selected items are changed." } },
  { id: 's5', type: 'image-render', props: { state: 'generating' } },
  { id: 's6', type: 'image-render', props: { state: 'complete', imageSrc: imgSrc } },
  { id: 's7', type: 'diff', props: { lines: diffLines } },
  { id: 's8', type: 'ask-user', props: { step: '1 of 2', question: 'What type of assistance do you need?', options: ['Planning / Task Breakdown', 'Implementation', 'Review & Testing'], onSelectOption: NOOP } },
  { id: 's9', type: 'thinking-status', props: { status: 'waiting' } },
  { id: 's10', type: 'scope-card', props: { items: scopeItems, onCancel: NOOP, onConfirm: NOOP } },
  { id: 's11', type: 'progress-card', props: { state: 'running', items: [{ status: 'done', title: T }, { status: 'running', title: T }, { status: 'queued', title: T }] } },
  { id: 's12', type: 'summary-card', props: { items: [{ status: 'done', title: T, description: 'Regenerated with the new mapping.' }, { status: 'failed', title: T, description: MISSING }] } },
  { id: 's13', type: 'error', props: { title: 'Source variable AGE is missing', details: ERR_DETAILS, onRetry: NOOP } },
  { id: 's14', type: 'risk-summary', props: { items: riskItems } },
];
function UserChatToggle() {
  const [open, setOpen] = useState(true);
  return <UserChat tags={TAGS} tagsExpanded={open} onToggleTags={setOpen} content="Please change the visit’s value of these items to “*”" />;
}
function ChatStreamLive() {
  const [n, setN] = useState(4);
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!auto) return;
    if (n >= STREAM_SCRIPT.length) { setAuto(false); return; }
    const t = setTimeout(() => setN((x) => x + 1), 900);
    return () => clearTimeout(t);
  }, [auto, n]);
  const shown = STREAM_SCRIPT.slice(0, n);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
      <div className="row">
        <Button size="small" disabled={n >= STREAM_SCRIPT.length} onClick={() => setN((x) => Math.min(x + 1, STREAM_SCRIPT.length))}>追加下一条（{n}/{STREAM_SCRIPT.length}）</Button>
        <Button size="small" variant="secondary" disabled={auto || n >= STREAM_SCRIPT.length} onClick={() => setAuto(true)}>自动播放</Button>
        <Button size="small" variant="secondary" onClick={() => { setAuto(false); setN(1); }}>重置</Button>
      </div>
      <div className="chat-demo"><ChatStream messages={shown} footer={<PromptInput />} /></div>
    </div>
  );
}

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  return (
    <>
      <header className="docs-head">
        <h1>Wiz 组件预览 · 批 2–7a-1：小件、卡片、Markdown、Prompt Input、Chat 流与通用组件（表单 / 反馈 / 按钮）</h1>
        <nav>
          <a href="#label-status">Label/Status</a><a href="#label-scope">Label/Scope</a>
          <a href="#event-badge">Event Status Badge</a><a href="#ai-tag">AI Tag Mini</a><a href="#ai-status">AI Status</a>
          <a href="#button">Button</a><a href="#ask-option">AI Ask Option</a><a href="#ask-user">AI Ask User</a><a href="#ask-result">Ask User Result</a><a href="#card-scope">Card/Scope</a><a href="#code-diff">Code Diff</a><a href="#md-all">Markdown</a><a href="#prompt-input">Prompt Input</a><a href="#prompt-misc">Shortcut/Chip/Thumbnail</a><a href="#addon">Add-on</a>
        <a href="#chat-parts">Chat 组件</a><a href="#chat-stream">Chat 流</a>
        <a href="#g-input">表单</a><a href="#g-message">反馈</a><a href="#g-iconbtn">按钮</a><a href="#n-tabs">导航</a><a href="#b7-table">7b-1 通用补充</a><a href="#d-status">数据</a><a href="#l-title">布局</a>
        </nav>
        <button className="docs-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? '切换到暗色' : '切换到亮色'}
        </button>
      </header>
      <main>
        <Section id="label-status" title="Label/Status" node="526:302" meta="status：8 种">
          {statuses.map((s) => (
            <Cell key={s} label={`status="${s}"`}>
              <div className="box"><LabelStatus status={s}>Table 14.1.1 Demographics</LabelStatus></div>
            </Cell>
          ))}
        </Section>
        <Section id="label-scope" title="Label/Scope" node="526:353" meta="selection × tag（Figma 里存在的 4 种组合）">
          {([['selected', 'none'], ['unselected', 'none'], ['selected', 'blocked'], ['unselected', 'skipped']] as const).map(([s, t]) => (
            <Cell key={s + t} label={`selection="${s}" tag="${t}"`}>
              <div className="box"><LabelScope selection={s} tag={t} title="Table 14.1.1 Demographics" description="Uses the changed variable AGE." /></div>
            </Cell>
          ))}
        </Section>
        <Section id="event-badge" title="Event Status Badge" node="526:248" meta="status：blocked、skipped">
          <Cell label='status="blocked"'><EventStatusBadge status="blocked" /></Cell>
          <Cell label='status="skipped"'><EventStatusBadge status="skipped" /></Cell>
        </Section>
        <Section id="ai-tag" title="AI Tag Mini" node="522:128" meta="单一状态">
          <Cell label="默认"><AITagMini>Table.1(290-321)</AITagMini></Cell>
        </Section>
        <Section id="ai-status" title="AI Status / Confidence" node="323:2155" meta="type=text：high、medium、low；type=number：>90%、80%-90%、70%-80%">
          <Cell label='type="text" level="high"'><AIStatus type="text" level="high" /></Cell>
          <Cell label='type="text" level="medium"'><AIStatus type="text" level="medium" /></Cell>
          <Cell label='type="text" level="low"'><AIStatus type="text" level="low" /></Cell>
          <Cell label='type="number" level=">90%"'><AIStatus type="number" level=">90%" /></Cell>
          <Cell label='type="number" level="80%-90%"'><AIStatus type="number" level="80%-90%" /></Cell>
          <Cell label='type="number" level="70%-80%"'><AIStatus type="number" level="70%-80%" /></Cell>
        </Section>
        <Section id="button" title="Button" node="784:1013" meta="主库 Primary 784:1013 · Secondary 784:1029 · Danger 2367:1571 · Link 337:1734；status × size；右上角切亮暗看对比">
          {(['primary', 'secondary'] as const).flatMap((v) =>
            (['default', 'hover', 'disable'] as const).concat(v === 'primary' ? ['loading' as never] : []).map((st) => (
              <Cell key={v + st} label={`variant="${v}" status="${st}"`}>
                <div className="row">{sizes.map((sz) => (
                  <Button key={sz} variant={v} size={sz} status={st} leftIcon="ri-add-line" rightIcon="ri-arrow-down-s-line">Button</Button>
                ))}</div>
              </Cell>
            )))}
          {(['outline', 'solid'] as const).flatMap((ds) => (['default', 'hover'] as const).map((st) => (
            <Cell key={ds + st} label={`variant="danger" dangerStyle="${ds}" status="${st}"`}>
              <Button variant="danger" dangerStyle={ds} status={st} leftIcon="ri-delete-bin-line" rightIcon="ri-arrow-down-s-line">Button</Button>
            </Cell>
          )))}
          <Cell label='variant="link" status="default"'><Button variant="link">link</Button></Cell>
          <Cell label='variant="link" status="hover"'><Button variant="link" status="hover">link</Button></Cell>
        </Section>
        <Section id="ask-option" title="AI Ask Option" node="522:114" meta="type × state：selection 3 种、custom 2 种">
          {([['selection', 'default'], ['selection', 'hover'], ['selection', 'selected'], ['custom', 'default'], ['custom', 'selected']] as const).map(([t, st]) => (
            <Cell key={t + st} label={`type="${t}" state="${st}"`}>
              <div className="box"><AIAskOption type={t} state={st} letter={t === 'custom' ? 'D' : 'A'} /></div>
            </Cell>
          ))}
        </Section>
        <Section id="ask-user" title="AI Ask User" node="522:433" meta="step × state：6 种；点选项、Skip、翻页仅回调（此处不改状态）">
          {(['1 of 2', '2 of 2'] as const).flatMap((step) => (['none', 'option-selected', 'custom-selected'] as const).map((state) => (
            <Cell key={step + state} label={`step="${step}" state="${state}"`}>
              <AIAskUser style={{ width: 360 }} step={step} state={state} {...(step === '1 of 2' ? Q1 : Q2)} />
            </Cell>
          )))}
        </Section>
        <Section id="ask-result" title="AI Ask User Result" node="522:124" meta="state：answered、skipped">
          <Cell label='state="answered"'><AIAskUserResult style={{ width: 360 }} pairs={[{ question: 'Which study should the update apply to?', answer: 'Study ABC-001' }, { question: 'Keep the existing output names?', answer: 'Yes, keep them' }]} /></Cell>
          <Cell label='state="skipped"'><AIAskUserResult style={{ width: 360 }} state="skipped" /></Cell>
        </Section>
        <Section id="card-scope" title="Card/Scope" node="526:610" meta="type=scope：pending、confirmed、cancelled；type=progress：running、completed；type=summary">
          <Cell label='type="scope" state="pending"'><CardScope style={{ width: 360 }} items={scopeItems} /></Cell>
          <Cell label='type="scope" state="confirmed"'><CardScope style={{ width: 360 }} state="confirmed" items={scopeItems} /></Cell>
          <Cell label='type="scope" state="cancelled"'><CardScope style={{ width: 360 }} state="cancelled" items={scopeItems} /></Cell>
          <Cell label='type="progress" state="running"'>
            <CardScope style={{ width: 360 }} type="progress" progressText="1 of 3 completed" items={[{ status: 'normal', title: T }, { status: 'running', title: T }, { status: 'queued', title: T }]} />
          </Cell>
          <Cell label='type="progress" state="completed"'>
            <CardScope style={{ width: 360 }} type="progress" state="completed" items={[{ title: T, status: 'normal' }, { title: T, status: 'normal' }, { title: T, status: 'normal' }]} progressText="3 of 3 completed" />
          </Cell>
          <Cell label='type="summary"'>
            <CardScope style={{ width: 360 }} type="summary" items={[{ status: 'normal', title: T }, { status: 'failed', title: T, description: MISSING, actionLabel: 'Retry' }, { status: 'blocked', title: T, description: MISSING }]} />
          </Cell>
        </Section>
        <Section id="code-diff" title="Code Diff" node="615:7" meta="state：collapsed、expanded（点头部可切换）">
          <Cell label='state="collapsed"'><CodeDiff style={{ width: 360 }} state="collapsed" lines={diffLines} addedCount={4} removedCount={4} /></Cell>
          <Cell label='state="expanded"'><CodeDiff style={{ width: 360 }} state="expanded" lines={diffLines} /></Cell>
          <Cell label="非受控（可点击）"><CodeDiff style={{ width: 360 }} lines={diffLines} /></Cell>
        </Section>
        <section id="md-all">
          <h2>Markdown</h2>
          <p className="meta">Copilot 对话流 · 正文 13 · Figma <a href={FIGMA + '593-4699'} target="_blank" rel="noreferrer">Copilot 4 件 593:4699</a> · <a href={FIGMA + '457-30'} target="_blank" rel="noreferrer">Markdown/* 457:30</a>；整段示例 = 一个 &lt;Markdown&gt; 的输出</p>
          <div className="md-demo">
            <div className="md-demo__src"><code>源文本</code><pre>{SAMPLE}</pre></div>
            <div className="md-demo__out"><code>渲染结果</code><Markdown>{SAMPLE}</Markdown></div>
          </div>
        </section>
        <Section id="md-states" title="Markdown 单元素状态" node="457:39" meta="Link 4 态 · Callout 4 类 · Code Block Copy 2 态 · Image 3 态 · Task 2 态 · Citation 3 态 · Heading · Blockquote · Footnote">
          <Cell label='Heading level 1 / 2 / 3（同一样式）'>
            <div style={{ width: 360 }}><MarkdownHeading level={1}>Heading 1</MarkdownHeading><MarkdownHeading level={2}>Heading 2</MarkdownHeading><MarkdownHeading level={3}>Heading 3</MarkdownHeading></div>
          </Cell>
          {(['default', 'hover', 'focus', 'visited'] as const).map((s) => (
            <Cell key={s} label={`Link state="${s}"`}><div className="wiz-md"><MarkdownLink href="#md-states" state={s}>View source document</MarkdownLink></div></Cell>
          ))}
          <Cell label="Inline：Strong / Strikethrough / Inline Code / Link">
            <div className="markdown-inline wiz-md"><strong className="wiz-md-strong">Bold text</strong> · <del className="wiz-md-del">Removed text</del> · <MarkdownInlineCode>inline_code</MarkdownInlineCode> · <MarkdownLink href="#md-states">Link text</MarkdownLink></div>
          </Cell>
          {(['note', 'tip', 'warning', 'caution'] as const).map((t) => (
            <Cell key={t} label={`Callout type="${t}"`}><div style={{ width: 360 }}><MarkdownCallout type={t}>Callout content explaining the point to the reader in one or two lines.</MarkdownCallout></div></Cell>
          ))}
          <Cell label='Code Block copyState="default"（SAS 高亮）'><div style={{ width: 360 }}><MarkdownCodeBlock language="sas" code={SAS_DEMO} /></div></Cell>
          <Cell label='Code Block copyState="copied"（JSON 纯文本）'><div style={{ width: 360 }}><MarkdownCodeBlock language="json" copyState="copied" code={'{\n  "project": "Wiz workspace",\n  "documents": 12,\n  "status": "ready"\n}'} /></div></Cell>
          <Cell label='Code Block showHeader=false'><div style={{ width: 360 }}><MarkdownCodeBlock showHeader={false} code={'plain text, no header'} /></div></Cell>
          {(['loaded', 'loading', 'error'] as const).map((s) => (
            <Cell key={s} label={`Image state="${s}"`}><div style={{ width: 360 }}>
              <MarkdownImage state={s} caption="Figure 1. Document review workflow." src={`data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120"><rect width="360" height="120" fill="#f5f5f5"/><text x="180" y="66" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" fill="#666">Source documents → Review → Report</text></svg>')}`} />
            </div></Cell>
          ))}
          <Cell label="Task checked / unchecked"><div className="wiz-md" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="wiz-md-task wiz-md-task--checked"><MarkdownCheckbox checked /><span>Check the Study Code rule</span></div>
            <div className="wiz-md-task"><MarkdownCheckbox checked={false} /><span>Confirm the treatment labels</span></div>
          </div></Cell>
          {(['default', 'hover', 'focus'] as const).map((s) => (
            <Cell key={s} label={`Citation state="${s}"`}><div className="wiz-md"><MarkdownCitation href="#md-states" state={s}>1</MarkdownCitation></div></Cell>
          ))}
          <Cell label="Blockquote + attribution"><div style={{ width: 360 }}><MarkdownBlockquote attribution="— Project review guidelines">“Keep the original meaning, and make every conclusion traceable to its source.”</MarkdownBlockquote></div></Cell>
          <Cell label="Divider"><div style={{ width: 360 }}><MarkdownDivider /></div></Cell>
          <Cell label="Footnote"><div className="wiz-md" style={{ width: 360 }}><MarkdownFootnote number="1">Source: Project documentation, version 2.1.</MarkdownFootnote></div></Cell>
        </Section>

        <Section id="prompt-input" title="Prompt Input" node="111:1763" meta="Status：Default · Hover · Filled · Running · Stopping · Extra States（disabled）· Max Height · With Attachments；Focused 为强制预览（真实聚焦同效）">
          <Cell label='Default（status 由 props 推导：空值）'><div style={W}><PromptInput /></div></Cell>
          <Cell label='Hover（previewState="hover"，真实悬停同效）'><div style={W}><PromptInput previewState="hover" /></div></Cell>
          <Cell label='Focused（previewState="focused"）'><div style={W}><PromptInput previewState="focused" /></div></Cell>
          <Cell label='Filled（有内容）'><div style={W}><PromptInput defaultValue="Building a To-Do application requires a balance between simplicity for quick entries and enough structure to stay organized. Here is a comprehensive blueprint." /></div></Cell>
          <Cell label='Running（running）'><div style={W}><PromptInput running runningText="AI analysis in progress, estimated time 10 minutes" /></div></Cell>
          <Cell label='Stopping（stopping）'><div style={W}><PromptInput stopping defaultValue="Summarize the changes in the selected tables" /></div></Cell>
          <Cell label='Extra States（disabled）'><div style={W}><PromptInput disabled /></div></Cell>
          <Cell label='Max Height（8 行 136px，超出框内滚动）'><div style={W}><PromptInput defaultValue={LONG} /></div></Cell>
          <Cell label='With Attachments（Default + Uploading）'><div style={W}><PromptInput defaultValue="Please check these two screenshots." attachments={[{ id: '1', name: 'a.png' }, { id: '2', name: 'b.png', status: 'uploading' }]} /></div></Cell>
          <Cell label='真实输入：Enter 发送 · Shift+Enter 换行 · 回形针模拟上传 · 发送后进入 Running，点停止进入 Stopping'><LivePrompt /></Cell>
        </Section>
        <Section id="prompt-misc" title="Prompt Shortcut · Attached Items Chips · AI Attachment Thumbnail" node="106:1313" meta="Shortcut：Status × With Description；Chips 111:2121：Default/Hover；Thumbnail 619:621：Default/Uploading/Hover">
          {(['default', 'hover', 'disable'] as const).map((s) => (
            <Cell key={s} label={`Shortcut status="${s}"`}><PromptShortcut status={s}>Make an App</PromptShortcut></Cell>
          ))}
          {(['default', 'hover', 'disable'] as const).map((s) => (
            <Cell key={s} label={`Shortcut status="${s}" + description`}><div style={{ width: 240 }}><PromptShortcut status={s} description="One click to make an app without coding">Make an App</PromptShortcut></div></Cell>
          ))}
          <Cell label='Shortcut showIcon=false'><PromptShortcut showIcon={false}>Make an App</PromptShortcut></Cell>
          <Cell label='Chips status="default"'><AttachedItemsChips /></Cell>
          <Cell label='Chips status="hover"'><AttachedItemsChips status="hover" /></Cell>
          <Cell label='Chips showIcon=false'><AttachedItemsChips showIcon={false} itemName="report.xlsx" /></Cell>
          <Cell label='Thumbnail state="default"（带序号）'><AIAttachmentThumbnail order={1} src={thumb('#cfe0ff')} /></Cell>
          <Cell label='Thumbnail state="uploading"'><AIAttachmentThumbnail state="uploading" /></Cell>
          <Cell label='Thumbnail state="hover"'><AIAttachmentThumbnail state="hover" order={1} /></Cell>
        </Section>
        <Section id="addon" title="Add-on：Pending Changes · Metadata Changes · Event Progress" node="665:6077" meta="外壳 AddOn（Figma Add-on 665:6079）；各组 Collapsed / Expanded / Expanded Max Height（列表 140 / 200 / 180）；最后一格为叠在 Prompt Input 之上的完整样子">
          <Cell label='Pending Changes · Collapsed'><div style={W}><PendingChanges items={pendingItems} /></div></Cell>
          <Cell label='Pending Changes · Expanded'><div style={W}><PendingChanges items={pendingItems} defaultExpanded /></div></Cell>
          <Cell label='Pending Changes · Expanded Max Height（140）'><div style={W}><PendingChanges items={manyPending} defaultExpanded /></div></Cell>
          <Cell label='Metadata Changes · Collapsed'><div style={W}><MetadataChanges count={4} onClose={() => {}} /></div></Cell>
          <Cell label='Metadata Changes · Expanded（children 占位）'><div style={W}><MetadataChanges count={4} defaultExpanded onClose={() => {}}>{metaRows(4)}</MetadataChanges></div></Cell>
          <Cell label='Metadata Changes · Expanded Max Height（200）'><div style={W}><MetadataChanges count={14} defaultExpanded onClose={() => {}}>{metaRows(14)}</MetadataChanges></div></Cell>
          <Cell label='Event Progress · Collapsed'><div style={W}><EventProgress items={progressItems} /></div></Cell>
          <Cell label='Event Progress · Expanded（Figma “3 Tasks to do”）'><div style={W}><EventProgress items={progressItems} title="3 Tasks to do" defaultExpanded /></div></Cell>
          <Cell label='Event Progress · Expanded Max Height（180）'><div style={W}><EventProgress items={manyProgress} defaultExpanded /></div></Cell>
          <Cell label='叠在输入框之上（Collapsed，Figma 665:6078）'><div style={W}><EventProgress items={progressItems} title="3 Tasks to do" input={<PromptInput />} /></div></Cell>
          <Cell label='叠在输入框之上（Expanded Max Height，可输入）'><AddOnLive /></Cell>
        </Section>

        <Section id="chat-parts" title="Chat 流组件：User Chat · Thinking · Image Render · Tool Call · Error · Risk · Pure Text" node="116:2252" meta="User Chat 116:2252 · AI Thinking Status 519:112 · AI Image Render Card 522:491 · AI Tool Call 598:5443 · AI Error Alert 536:519 · AI Risk Summary 536:552 · Pure Text 447:2492">
          <Cell label='User Chat · Short'><UserChat content="Hello，World" /></Cell>
          <Cell label='User Chat · Long'><div style={{ width: '100%' }}><UserChat content="Please generate edit rules by referring the document please generate edit rules by referring the document please generate edit rules by referring the document" /></div></Cell>
          <Cell label='User Chat · Only File'><UserChat files={['DVP Verification.xlsx']} /></Cell>
          <Cell label='User Chat · With Files'><UserChat files={['DVP Verification.xlsx']} content="Please generate edit rules by referring the document" /></Cell>
          <Cell label='User Chat · Variant6（标签折叠，+5）'><div style={{ width: '100%' }}><UserChat tags={TAGS} content="Please change the visit’s value of these items to “*”" /></div></Cell>
          <Cell label='User Chat · With Tags Expanded（可点 +5 / Collapse）'><div style={{ width: '100%' }}><UserChatToggle /></div></Cell>
          <Cell label='AI Thinking Status · Loading'><AIThinkingStatus status="loading" /></Cell>
          <Cell label='AI Thinking Status · Waiting'><AIThinkingStatus status="waiting" /></Cell>
          <Cell label='AI Image Render Card · Generating'><div style={{ width: 360 }}><AIImageRenderCard state="generating" /></div></Cell>
          <Cell label='AI Image Render Card · Complete'><div style={{ width: 360 }}><AIImageRenderCard state="complete" /></div></Cell>
          <Cell label='AI Image Render Card · Complete Hover'><div style={{ width: 360 }}><AIImageRenderCard state="complete-hover" /></div></Cell>
          <Cell label='AI Image Render Card · Complete Focused'><div style={{ width: 360 }}><AIImageRenderCard state="complete-focused" /></div></Cell>
          <Cell label='AI Image Render Card · Failed（Figma State6）'><div style={{ width: 360 }}><AIImageRenderCard state="failed" onRetry={() => {}} /></div></Cell>
          <Cell label='AI Image Render Card · Complete + 真实图片（点击全屏预览，Esc 关闭）'><div style={{ width: 360 }}><AIImageRenderCard state="complete" imageSrc={imgSrc} /></div></Cell>
          <Cell label='AI Tool Call · Collapsed'><div style={{ width: 320 }}><AIToolCall /></div></Cell>
          <Cell label='AI Tool Call · Hover'><div style={{ width: 320 }}><AIToolCall state="hover" /></div></Cell>
          <Cell label='AI Tool Call · Expanded'><div style={{ width: 320 }}><AIToolCall state="expanded" /></div></Cell>
          <Cell label='AI Error Alert · Collapsed'><div style={{ width: 400 }}><AIErrorAlert state="collapsed" details={ERR_DETAILS} onRetry={() => {}} /></div></Cell>
          <Cell label='AI Error Alert · Expanded'><div style={{ width: 400 }}><AIErrorAlert state="expanded" details={ERR_DETAILS} onRetry={() => {}} /></div></Cell>
          <Cell label='AI Risk Summary · With Items'><div style={{ width: 360 }}><AIRiskSummary items={riskItems} /></div></Cell>
          <Cell label='Pure Text（13px，无内边距，Markdown 渲染）'><div style={{ width: 360 }}><PureText>{"Here is a **summary** of the change with `inline_code` and a [link](https://example.com).\n\n- First point\n- Second point"}</PureText></div></Cell>
        </Section>
        <Section id="chat-stream" title="Chat 流：ChatStream" node="129:2415" meta="对话流容器（不含面板外壳）：块间距 16，用户消息左缩进 40 靠右，AI 回复右缩进 40，可滚动，新消息自动到底部（上滑后不强制），footer 放 Prompt Input。左：整条示例；右：逐条追加">
          <Cell label='整条对话（用户提问 → thinking → tool call → markdown → image → diff → ask user → 卡片 → error → risk）'><div className="chat-demo"><ChatStream messages={STREAM_SCRIPT} footer={<PromptInput />} /></div></Cell>
          <Cell label='逐条追加（模拟流式）：点按钮追加，或自动播放；滚到底部后继续跟随，上滑后不强制'><ChatStreamLive /></Cell>
        </Section>
        <GeneralSections />
        <NavSections />
        <Batch7b1Sections />
      </main>
    </>
  );
}
