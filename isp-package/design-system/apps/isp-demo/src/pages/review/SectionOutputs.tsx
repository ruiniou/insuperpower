import { Button, IconButton, KeyValueRow, PanelHead, Status } from '@wiz/react';
import { patchToc, type TocUi } from '../../store/review';
import type { TocOutput, TocVar } from './tocMock';

const refLabel = (r: TocVar['src'][number]) => (r.k === 'sap' ? r.t : 'Shell');

function Refs({ ids, onJump }: { ids: string[]; onJump: (id: string) => void }) {
  return <>{ids.map((id) => <button key={id} type="button" className="rv-pref" title={'Go to ' + id + ' in the SAP'} onClick={(e) => { e.stopPropagation(); onJump(id); }}>{id}</button>)}</>;
}

function groupVars(vars: TocVar[]) {
  const g = new Map<string, TocVar[]>();
  vars.forEach((v) => { const k = v.src.every((s) => s.k === 'shell') ? 'Shell only, not in SAP' : 'SAP ' + v.src.filter((s) => s.k === 'sap').map(refLabel).join(', '); g.set(k, (g.get(k) ?? []).concat(v)); });
  return [...g.entries()];
}

interface Props {
  eid: string; ui: TocUi; outputs: TocOutput[]; reviewed: (id: string) => boolean; readOnly: boolean;
  onSelect: (id: string) => void; onMark: (id: string) => void; onJump: (para: string) => void; onOpenShell: () => void;
  style?: React.CSSProperties;
}

/** 本节输出：每个输出一行，选中的展开，展开后的每行都带依据；标记已评审只记进度 */
export function SectionOutputs({ eid, ui, outputs, reviewed, readOnly, onSelect, onMark, onJump, onOpenShell }: Props) {
  return (
    <aside className="rv-outs" id="toc-outs" aria-label="Section outputs">
      <PanelHead title="Section outputs" meta={outputs.length} />
      <div className="rv-outs__body">
        {outputs.map((o) => {
          const open = ui.sel === o.id, done = reviewed(o.id);
          const noSap = o.vars.filter((v) => v.src.every((s) => s.k === 'shell')).length;
          const mode = ui.vars[o.id] ?? 'closed';
          const shown = mode === 'flag' ? o.vars.filter((v) => v.src.every((s) => s.k === 'shell')) : o.vars;
          const label = o.type === 'Listing' ? 'Listing fields' : 'Statistics';
          const count = o.vars.length + (o.moreText ? Number(o.moreText.split(' ')[0]) : 0);
          return (
            <section key={o.id} className={'rv-out' + (open ? ' is-open' : '')} aria-label={o.no + ' ' + o.title}>
              <button type="button" className="rv-out__row" aria-expanded={open} onClick={() => onSelect(o.id)}>
                <i className={'rv-out__st ' + (done ? 'ri-checkbox-circle-fill is-done' : 'ri-checkbox-blank-circle-line')} role="img" aria-label={done ? 'Reviewed' : 'Not reviewed'} />
                <span className="rv-out__main">
                  <span className="rv-out__no">{o.no}</span>
                  <span className="rv-out__nm">{o.title}</span>
                  <span className="rv-out__sm">{o.pop}, {count} {o.type === 'Listing' ? 'fields' : 'variables'}</span>
                  <span className="rv-out__sm">SAP {o.popSrc.concat(o.scopeSrc).filter((x, i, a) => a.indexOf(x) === i).join(', ')}</span>
                  {noSap > 0 && <span><Status variant="style1" tone="yellow" textCase="normal">{noSap} variables not in SAP</Status></span>}
                </span>
                <span className="rv-out__ty">{o.type}</span>
                <i className={'rv-out__chev ri-arrow-down-s-line' + (open ? '' : ' is-closed')} aria-hidden="true" />
              </button>
              {open && (
                <div className="rv-out__det">
                  <KeyValueRow label="Title" labelWidth={96} wrap>{o.title}</KeyValueRow>
                  <KeyValueRow label="Analysis population" labelWidth={96} wrap>
                    <span>{o.pop} <Refs ids={o.popSrc} onJump={onJump} />
                      <button type="button" className="rv-pref rv-pref--txt" aria-expanded={!!ui.why[o.id]} onClick={() => patchToc(eid, { why: { ...ui.why, [o.id]: !ui.why[o.id] } })}>Why</button></span>
                    {ui.why[o.id] && <span className="rv-out__why">{o.why}</span>}
                  </KeyValueRow>
                  <KeyValueRow label="Record scope" labelWidth={96} wrap><span>{o.scope} <Refs ids={o.scopeSrc} onJump={onJump} /></span></KeyValueRow>
                  <KeyValueRow label={label} labelWidth={96} wrap>
                    <span className="rv-out__vh">
                      <button type="button" className="rv-pref rv-pref--txt" aria-expanded={mode !== 'closed'}
                        onClick={() => patchToc(eid, { vars: { ...ui.vars, [o.id]: mode === 'closed' ? 'all' : 'closed' } })}>
                        <i className={'ri-arrow-down-s-line' + (mode === 'closed' ? ' is-closed' : '')} aria-hidden="true" /> {count} items
                      </button>
                      {noSap > 0 && <button type="button" className="rv-out__flag" onClick={() => patchToc(eid, { vars: { ...ui.vars, [o.id]: 'flag' } })}>{noSap} not in SAP</button>}
                    </span>
                    {mode === 'flag' && <span className="rv-out__why">Showing only variables not mentioned in the SAP text, supported only by the Shell document. <button type="button" className="rv-pref rv-pref--txt" onClick={() => patchToc(eid, { vars: { ...ui.vars, [o.id]: 'all' } })}>Show all {count}</button></span>}
                    {mode !== 'closed' && groupVars(shown).map(([g, vs]) => (
                      <span key={g} className="rv-vg"><span className="rv-vg__h">{g}</span>{vs.map((v) => <span key={v.name} className="rv-vg__i">{v.name}</span>)}</span>
                    ))}
                    {mode === 'all' && o.moreText && <span className="rv-out__why">and {o.moreText}</span>}
                  </KeyValueRow>
                  <KeyValueRow label="Result presentation" labelWidth={96} wrap divider={false}><span>{o.present} <Refs ids={o.presentSrc} onJump={onJump} /></span></KeyValueRow>
                  <div className="rv-out__foot">
                    {done ? <Button leftIcon="ri-check-line" status={readOnly ? 'disable' : 'default'} aria-pressed aria-label={readOnly ? 'Reviewed' : 'Unmark as reviewed'} title={readOnly ? undefined : 'Click to unmark'} onClick={() => onMark(o.id)}>Reviewed</Button> : <IconButton icon="ri-checkbox-blank-line" size="medium" disabled={readOnly} aria-label="Mark as reviewed" title="Mark as reviewed" onClick={() => onMark(o.id)} />}
                    <Button rightIcon="ri-arrow-right-up-line" onClick={onOpenShell}>Open Shell</Button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
}
