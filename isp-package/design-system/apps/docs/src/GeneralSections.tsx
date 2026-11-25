import { useState, type ReactNode } from 'react';
import {
  Input, Textarea, Select, MultiSelect, Search, Checkbox, Radio, Switch, Chip, Upload, Divider,
  Message, Snackbar, SnackbarProvider, useSnackbar, Modal, Tooltip, Button,
  IconButton, OnStatusButton, ButtonGroup, CloseButton,
  type FieldSize, type FieldState, type SnackbarType, type IconButtonSize, type ButtonGroupItem,
} from '@wiz/react';

const LIB = 'https://www.figma.com/design/sqCnlegZT8mTTEu7ja1Mrq/Wiz-Guideline?node-id=';

function Sec({ id, title, node, meta, cols = 220, children }: { id: string; title: string; node: string; meta: string; cols?: number; children: ReactNode }) {
  return (
    <section id={id}>
      <h2>{title}</h2>
      <p className="meta">{meta} · <a href={LIB + node.replace(':', '-')} target="_blank" rel="noreferrer">主库 {node}</a></p>
      <div className="grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${cols}px, 1fr))` }}>{children}</div>
    </section>
  );
}
const Cell = ({ label, children, dark }: { label: string; children: ReactNode; dark?: boolean }) => (
  <div className="cell"><code>{label}</code>{dark ? <div className="on-status-bar">{children}</div> : children}</div>
);

const sizes: FieldSize[] = ['small', 'medium', 'large'];
const OPTIONS = ['Option 1', 'Option 2', 'Option 3', { value: 'x', label: 'Disabled option', disabled: true }];

function FieldMatrix({ kind }: { kind: 'input' | 'textarea' | 'select' | 'multi' }) {
  const states: FieldState[] = ['default', 'hover', 'focus', 'error', 'disable'];
  const out: ReactNode[] = [];
  for (const content of [false, true]) {
    for (const st of states) {
      if (st === 'focus' && !content) continue;
      if (st === 'focus' && (kind === 'select' || kind === 'multi')) continue;
      for (const sz of sizes) {
        const common = { label: 'Input title', required: true, size: sz, state: st === 'error' ? undefined : st, error: st === 'error' ? 'Error Message' : undefined, disabled: st === 'disable' };
        let el: ReactNode;
        if (kind === 'input') el = <Input {...common} placeholder="Input..." defaultValue={content ? 'Content' : ''} />;
        else if (kind === 'textarea') el = <Textarea {...common} placeholder="Input..." defaultValue={content ? 'Content' : ''} />;
        else if (kind === 'select') el = <Select {...common} options={OPTIONS} placeholder="Select..." defaultValue={content ? 'Option 1' : undefined} />;
        else el = <MultiSelect {...common} options={OPTIONS} placeholder="Select..." defaultValue={content ? ['Option 1', 'Option 2', 'Option 3'] : []} />;
        out.push(<Cell key={`${content}${st}${sz}`} label={`State=${st} · Content=${content ? 'Yes' : 'No'} · Size=${sz}`}><div style={{ width: 200 }}>{el}</div></Cell>);
      }
    }
  }
  return <>{out}</>;
}

function SnackbarDemo() {
  const s = useSnackbar();
  return (
    <div className="row">
      <Button onClick={() => s.show({ type: 'success', title: 'Saved', description: 'Your changes have been updated', actionable: true, actionLabel: 'Dismiss', onAction: () => {} })}>show success</Button>
      <Button onClick={() => s.show({ type: 'error', title: 'Failed', description: 'Sticky until closed', duration: 0 })}>show error（不自动消失）</Button>
    </div>
  );
}

function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>打开 Modal</Button>
      <Modal open={open} title="Modal Title" onClose={() => setOpen(false)} onConfirm={() => setOpen(false)}>
        <div className="modal-ph">Content 区域（宽 600、圆角 12、标题栏 64、确认栏 80）。Esc / 遮罩 / 关闭 均可关闭，Tab 在框内循环。</div>
      </Modal>
    </>
  );
}

function GroupLive() {
  const items: ButtonGroupItem[] = [{ value: 'a', icon: 'ri-add-line', ariaLabel: 'Add' }, { value: 'b', icon: 'ri-edit-line', ariaLabel: 'Edit' }, { value: 'c', icon: 'ri-delete-bin-line', ariaLabel: 'Delete' }];
  const [v, setV] = useState('a');
  return <ButtonGroup aria-label="live" items={items} value={v} onChange={setV} />;
}

const ICONS = ['ri-add-line', 'ri-edit-line', 'ri-delete-bin-line', 'ri-more-line'];
const groupItems = (n: number): ButtonGroupItem[] => ICONS.slice(0, n).map((ic, i) => ({ value: String(i), icon: ic, ariaLabel: ic }));

export function GeneralSections() {
  const [files, setFiles] = useState<string[]>(['Verification_Plan_Data.xlsx']);
  const [chk, setChk] = useState(false);
  const types: SnackbarType[] = ['info', 'success', 'warning', 'error'];
  const iconSizes: IconButtonSize[] = ['small', 'medium', 'big', 'large'];
  return (
    <>
      <Sec id="g-input" title="表单 · Input / Single Line" node="365:1106" meta="State × Content × Size（Focus 仅 Content=Yes）；Error 由 error 文案触发，Disable 由 disabled 触发；真实悬停 / 聚焦同效">
        <FieldMatrix kind="input" />
      </Sec>
      <Sec id="g-textarea" title="表单 · Input / Multiple Line" node="443:646" meta="State × Content × Size（Small 48 / Medium 64 / Large 80 起，可拖拽纵向）">
        <FieldMatrix kind="textarea" />
      </Sec>
      <Sec id="g-select" title="表单 · Input / Select" node="393:609" meta="State × Content × Size；末格为展开态（键盘 ↑↓ Enter Esc，searchable 可过滤）">
        <FieldMatrix kind="select" />
        <Cell label="展开态（open 强制）"><div style={{ width: 200, height: 190 }}><Select label="Input title" options={OPTIONS} defaultValue="Option 2" open /></div></Cell>
        <Cell label="searchable（输入过滤）"><div style={{ width: 200, height: 190 }}><Select label="Input title" options={OPTIONS} searchable placeholder="Search..." /></div></Cell>
      </Sec>
      <Sec id="g-multi" title="表单 · Input / Multi Select" node="1120:1199" meta="State × Content × Size；已选以 Chip 展示；末格展开态">
        <FieldMatrix kind="multi" />
        <Cell label="展开态（open 强制）"><div style={{ width: 200, height: 220 }}><MultiSelect label="Input title" options={OPTIONS} defaultValue={['Option 1']} open /></div></Cell>
        <Cell label="searchable（Backspace 删最后一个 Chip）"><div style={{ width: 200, height: 190 }}><MultiSelect label="Input title" options={OPTIONS} searchable defaultValue={['Option 1']} /></div></Cell>
      </Sec>
      <Sec id="g-search" title="表单 · Search" node="273:337" meta="Default / Hover / Search；280×40；Enter 或右侧按钮触发 onSearch" cols={320}>
        <Cell label="Property 1=Default"><Search /></Cell>
        <Cell label="Property 1=Hover（state=hover）"><Search state="hover" /></Cell>
        <Cell label="Property 1=Search（state=search，有内容）"><Search state="search" defaultValue="Protocol ID.00001" /></Cell>
        <Cell label="disabled"><Search disabled /></Cell>
      </Sec>
      <Sec id="g-check" title="表单 · Checkbox · Radio · Switch" node="254:304" meta="Checkbox 254:304（Status × Hover × Disable）· Radio 377:836 · Switch 1174:677（Size × State）" cols={200}>
        {(['unchecked', 'checked', 'indeterminate'] as const).flatMap((s) => [
          <Cell key={s} label={`Status=${s}`}><Checkbox state={s} aria-label={s} /></Cell>,
          <Cell key={s + 'h'} label={`Status=${s} · Hover`}><Checkbox state={s} forceHover aria-label={s} /></Cell>,
          <Cell key={s + 'd'} label={`Status=${s} · Disable`}><Checkbox state={s} disabled aria-label={s} /></Cell>,
        ])}
        <Cell label="带文字，可点（受控）"><Checkbox checked={chk} onChange={setChk} label="Label" /></Cell>
        <Cell label="Radio=Default"><Radio aria-label="r1" /></Cell>
        <Cell label="Radio=hover"><Radio forceHover aria-label="r2" /></Cell>
        <Cell label="Radio=Selected"><Radio defaultChecked aria-label="r3" /></Cell>
        <Cell label="Radio=selected-hover"><Radio defaultChecked forceHover aria-label="r4" /></Cell>
        <Cell label="Radio disabled / 带文字"><div className="row"><Radio disabled aria-label="r5" /><Radio disabled defaultChecked label="Label" /></div></Cell>
        {sizes.flatMap((sz) => [
          <Cell key={sz + 'off'} label={`Switch Size=${sz} · Off`}><Switch size={sz} aria-label="sw" /></Cell>,
          <Cell key={sz + 'on'} label={`Switch Size=${sz} · On`}><Switch size={sz} defaultChecked aria-label="sw" /></Cell>,
        ])}
        <Cell label="Switch disabled / 带文字"><div className="row"><Switch disabled aria-label="sw" /><Switch label="Label" defaultChecked /></div></Cell>
      </Sec>
      <Sec id="g-chip" title="表单 · Chip · Upload · Divider" node="1121:329" meta="Chip 1121:329（Size × Normal/Disable）· Upload 377:908（Default/hover/Uploaded/uploaded-hover）· Divider 335:355" cols={340}>
        <Cell label="Chip Default · Normal / 可移除"><div className="row"><Chip>Label</Chip><Chip onRemove={() => {}}>Label</Chip></div></Cell>
        <Cell label="Chip Default · Disable"><div className="row"><Chip disabled>Label</Chip><Chip disabled onRemove={() => {}}>Label</Chip></div></Cell>
        <Cell label="Chip Small · Normal / Disable"><div className="row"><Chip size="small" onRemove={() => {}}>Label</Chip><Chip size="small" disabled onRemove={() => {}}>Label</Chip></div></Cell>
        <Cell label="Upload · Default"><Upload showFiles={false} /></Cell>
        <Cell label="Upload · hover（forceHover，拖入同效）"><Upload showFiles={false} forceHover /></Cell>
        <Cell label="Upload · Uploaded（可选择 / 拖入 / 移除，受控）"><Upload files={files} onFilesChange={setFiles} /></Cell>
        <Cell label="Upload · uploaded-hover"><Upload forceHover defaultFiles={['Verification_Plan_Data.xlsx']} /></Cell>
        <Cell label="Divider Default / 竖线"><div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 12 }}><Divider /><div style={{ display: 'flex', height: 24, gap: 12 }}><span>A</span><Divider orientation="vertical" /><span>B</span></div></div></Cell>
        <Cell label="Divider With text middle / left / right"><div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 12 }}><Divider>test</Divider><Divider align="left">test</Divider><Divider align="right">test</Divider></div></Cell>
      </Sec>

      <SnackbarProvider>
        <Sec id="g-message" title="反馈 · Message · Tooltip" node="377:970" meta="Message 377:970（Warning 为主库样式，其余类型同结构换语义色）· Tooltip 1167:1280（Direction，open 强制显示；真实使用为悬停 / 聚焦）" cols={380}>
          {(['warning', 'error', 'success', 'info'] as const).map((t) => (
            <Cell key={t} label={`Message tone=${t}`}><div style={{ width: 362 }}><Message tone={t} closable>Message content content content</Message></div></Cell>
          ))}
          {(['top', 'bottom', 'left', 'right'] as const).map((d) => (
            <Cell key={d} label={`Tooltip Direction=${d}`}><div className="tip-stage"><Tooltip content="Tooltip text" open arrow direction={d}><Button size="small">Target</Button></Tooltip></div></Cell>
          ))}
          <Cell label="Tooltip 真实交互（悬停 / Tab 聚焦，Esc 关闭）"><Tooltip content="Delete item"><IconButton icon="ri-delete-bin-line" aria-label="Delete" variant="outline" /></Tooltip></Cell>
        </Sec>
        <Sec id="g-snackbar" title="反馈 · Snackbar" node="889:3809" meta="顶部 Toast 48 px，四种状态均可带操作，且都有关闭按钮。详细版为独立展示。" cols={420}>
          {types.map((t) => (
            <Cell key={t + 's'} label={`Single Line · ${t}`}>
              <Snackbar type={t} title="Notification" description="Your changes have been updated" actionable={t === 'success'} actionLabel="View" onAction={() => {}} />
            </Cell>
          ))}
          {types.map((t) => (
            <Cell key={t + 'd'} label={`Detailed · ${t}`}>
              <Snackbar type={t} title="Notification" description="Your changes have been updated" actionable={t === 'success'} actionLabel="View" onAction={() => {}}
                details={[{ text: 'DAT_Listing_01', status: 'done' }, { text: 'DAT_Listing_02', status: 'loading' }, { text: 'DAT_Listing_03' }]} />
            </Cell>
          ))}
          <Cell label="SnackbarProvider + useSnackbar"><SnackbarDemo /></Cell>
        </Sec>
        <Sec id="g-modal" title="反馈 · Modal" node="377:972" meta="宽 600、圆角 12；portal + 焦点陷阱 + Esc / 遮罩关闭 + 关闭后焦点还原。点按钮打开" cols={420}>
          <Cell label="Modal（默认取消 / 确认）"><ModalDemo /></Cell>
          <Cell label="Close button · Default / hover"><div className="row"><CloseButton /><CloseButton status="hover" /></div></Cell>
        </Sec>
      </SnackbarProvider>

      <Sec id="g-iconbtn" title="按钮 · Icon Button（合并 Icon Button + 两套 Actions）" node="784:1045" meta="Icon Button 784:1045 → variant=outline；Actions 2354:1450 / 784:1055 → variant=ghost|primary × size × shape × color × status" cols={240}>
        {(['default', 'hover', 'disable'] as const).map((st) => (
          <Cell key={st} label={`outline · Status=${st}`}><IconButton icon="ri-sparkling-2-line" aria-label="x" variant="outline" status={st} /></Cell>
        ))}
        {(['default', 'hover', 'disable'] as const).flatMap((st) => (['rectangle', 'circle'] as const).map((sh) => (
          <Cell key={st + sh} label={`ghost · ${st} · shape=${sh} · size 24/28/36/40`}>
            <div className="row">{iconSizes.map((sz) => <IconButton key={sz} icon="ri-attachment-2" aria-label="x" size={sz} shape={sh} status={st} />)}</div>
          </Cell>
        )))}
        {(['black', 'grey'] as const).flatMap((c) => (['default', 'hover'] as const).map((st) => (
          <Cell key={c + st} label={`ghost · color=${c} · ${st}`}>
            <div className="row">{iconSizes.map((sz) => <IconButton key={sz} icon="ri-home-5-line" aria-label="x" size={sz} color={c} status={st} />)}</div>
          </Cell>
        )))}
        {(['default', 'hover', 'disable'] as const).map((st) => (
          <Cell key={'p' + st} label={`primary（circle）· ${st} · size 24/28/36/40`}>
            <div className="row">{iconSizes.map((sz) => <IconButton key={sz} icon="ri-attachment-2" aria-label="x" variant="primary" size={sz} status={st} />)}</div>
          </Cell>
        ))}
      </Sec>
      <Sec id="g-onstatus" title="按钮 · On Status Button" node="889:3634" meta="Status × Size（Small / Default→medium / Large）；用在深色或彩色状态条上" cols={300}>
        {(['default', 'hover', 'disable'] as const).flatMap((st) => (['small', 'medium', 'large'] as const).map((sz) => (
          <Cell key={st + sz} dark label={`Status=${st} · Size=${sz}`}>
            <OnStatusButton status={st} size={sz} leftIcon="ri-sparkling-2-line" rightIcon="ri-arrow-down-s-line">Button</OnStatusButton>
          </Cell>
        )))}
      </Sec>
      <Sec id="g-btngroup" title="按钮 · Button Group" node="1146:208" meta="Count 2 / 3 / 4 × Hover（None 或第 N 个，forceHoverIndex）；间距 -1 边框叠合；传 value 时为单选分段" cols={240}>
        {[2, 3, 4].flatMap((n) => [undefined, ...Array.from({ length: n }, (_, i) => i + 1)].map((h) => (
          <Cell key={`${n}-${h}`} label={`Count=${n} · Hover=${h ?? 'None'}`}><ButtonGroup aria-label="g" items={groupItems(n)} forceHoverIndex={h} /></Cell>
        )))}
        <Cell label="单选分段（value / onChange）"><GroupLive /></Cell>
      </Sec>
    </>
  );
}
