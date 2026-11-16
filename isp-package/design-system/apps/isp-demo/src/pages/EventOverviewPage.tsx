import { useRef } from 'react';
import { Button, IconButton } from '@wiz/react';
import {
  AttentionRow, AttentionSection, EdgeButton, InputsCard, NodeCard, NodeCardBody, NodeCardConfirm, NodeCardFooter, NodeCardNote, NodeCardRow,
  PipelineCanvas, PipelineLaneLabel, PipelineLegend, PipelineNote, PipelinePill, PipelineWire, PipelineWires, RefLink, UploadSlots, WorkflowPopover,
} from '@wiz/isp';
import { go } from '../router';
import { DS_FILE_OK, hrefEvent, ovDoReplace, ovKeep, ovStartOrFix, ovUi, quickUploadDs, reviewHref } from '../store/actions';
import { EDGES, NODE, NODES, PIPE_H, PIPE_W } from '../store/config';
import { ovCtx } from '../store/flow';
import { attentionRows, inputsGroups, nodeCard, popoverFor, type Target } from '../store/overview';
import { dsCnt, S } from '../store/selectors';
import { toast, useDb } from '../store/store';
import type { NodeId } from '../store/types';

/** #/event/:eid/overview：流水线（18b）。全部状态由 event.flow 派生，UI 只做渲染与分发 */
export function EventOverviewPage({ eid }: { eid: string }) {
  useDb();
  const e = S.event(eid)!;
  const C = ovCtx(e), f = e.flow, ui = f.ui;
  const fileInput = useRef<HTMLInputElement>(null);
  const pickCat = useRef('ADaM');

  /** 跳转类目标（Asset / Dataset / Workflow 页尚未做，落到占位页） */
  const run = (t: Target) => {
    switch (t.act) {
      case 'jumpAsset': case 'jumpEventAsset': case 'pinAsset': case 'refAsset': go(hrefEvent(e.id, 'asset')); break;
      case 'jumpDs': go(hrefEvent(e.id, 'dataset', t.arg)); break;
      case 'pinDs': go(hrefEvent(e.id, 'dataset', t.arg || 'dummy')); break;
      case 'jumpWf': go(hrefEvent(e.id, 'workflow')); break;
    }
  };
  const start = (id: NodeId) => { const h = ovStartOrFix(e, id); if (h) go(h); };
  const review = (id: NodeId) => { const h = reviewHref(e, id); if (h) go(h); else toast('Package review is not in this prototype'); };

  const groups = inputsGroups(e);
  const slots = (['ADaM', 'SDTM'] as const).map((c) => ({ key: c, label: c, count: dsCnt(e, c) }));
  const onPickSlot = (cat: string) => { pickCat.current = cat; if (fileInput.current) { fileInput.current.value = ''; fileInput.current.click(); } };

  const rowsA = attentionRows(e, C);
  const edgeVM = ui.edge ? popoverFor(e, C, ui.edge) : null;

  return (
    <div className="ov">
      <div className="page-head ov-legend"><PipelineLegend /></div>
      <input ref={fileInput} type="file" hidden accept={DS_FILE_OK.map((x) => '.' + x).join(',')} aria-label="Choose dataset file"
        onChange={(ev) => { const file = ev.target.files?.[0]; if (file) quickUploadDs(e, pickCat.current, file.name); }} />
      <PipelineCanvas width={PIPE_W} height={PIPE_H} onClick={(ev) => { if (!(ev.target as HTMLElement).closest('.wiz-isp-xc, .wiz-isp-inputs, .wiz-isp-pop, .wiz-isp-pill, .wiz-isp-eb')) ovUi.clear(e); }}>
        <PipelineWires width={PIPE_W} height={PIPE_H}>
          {EDGES.map((x) => <PipelineWire key={x.id} d={x.d} state={C.disp(x.to)} />)}
        </PipelineWires>
        <PipelineLaneLabel left={222} width={358}>Generate Shell</PipelineLaneLabel>
        <PipelineLaneLabel left={644} width={538}>Generate Code</PipelineLaneLabel>
        <PipelineLaneLabel left={0} width={176}>Input</PipelineLaneLabel>

        <InputsCard style={{ left: 0, top: 64, width: 176 }} open={ui.inputsOpen} onToggle={() => ovUi.toggleInputs(e)}
          groups={groups.map((g) => ({
            label: g.label, text: g.text, badge: g.badge, changeLabel: g.changeLabel,
            onOpen: g.open && g.text !== 'None pinned' ? () => run(g.open!) : undefined,
            onChange: g.change ? () => run(g.change!) : undefined,
            footer: g.dz ? <UploadSlots className="wiz-isp-slots--inline" slots={slots} onPick={onPickSlot} /> : undefined,
          }))} />

        {NODES.filter((n) => n.id !== ui.sel).map((n) => {
          const d = C.disp(n.id), top = n.row === 1 ? 66 : 320, note = (d === 'stale' && f.note[n.id]) || '';
          return (
            <span key={n.id}>
              <PipelinePill state={d} name={n.name} count={C.countOf(n)} style={{ left: n.x, top, width: n.w }}
                aria-label={n.name + ', ' + C.captionOf(n)} onClick={() => ovUi.sel(e, n.id)} />
              {note && <PipelineNote style={{ left: n.x, top: top + 46 }}>{note}</PipelineNote>}
            </span>
          );
        })}

        {NODES.filter((n) => n.id === ui.sel).map((n) => {
          const vm = nodeCard(e, C, n);
          const pos = n.row === 1 ? { top: 64 } : { bottom: PIPE_H - 360 };
          return (
            <NodeCard key={n.id} state={vm.d} title={n.name} caption={vm.caption} style={{ left: n.x, width: n.w, ...pos }} onCollapse={() => ovUi.close(e)}>
              {vm.confirming ? (
                <NodeCardConfirm>
                  <span>{vm.confirmText}</span>
                  <Button variant="primary" onClick={() => ovDoReplace(e, n.id)}>Replace File</Button>
                  <Button shadow="none" onClick={() => ovUi.cancel(e)}>Cancel</Button>
                </NodeCardConfirm>
              ) : (
                <>
                  {vm.note && <NodeCardNote>{vm.note}</NodeCardNote>}
                  <NodeCardBody>
                    {vm.rows.map((r) => (
                      <NodeCardRow key={r.label} label={r.label}>
                        {r.type === 'none' ? <span>{r.text}</span> : <RefLink onClick={() => run(r.target)}>{r.text}</RefLink>}
                        {r.type === 'replace' && <IconButton icon="ri-upload-2-line" size="small" aria-label="Replace File" disabled={!!vm.replaceDisabled} title={vm.replaceDisabled || undefined} onClick={() => ovUi.replaceAsk(e, n.id)} />}
                        {r.type === 'change' && <IconButton icon="ri-exchange-line" size="small" aria-label="Change version" onClick={() => run({ act: 'pinDs', arg: 'dummy' })} />}
                      </NodeCardRow>
                    ))}
                  </NodeCardBody>
                  {vm.showBtn && (
                    <NodeCardFooter>
                      <Button shadow="none" variant={vm.btn.primary ? 'primary' : 'secondary'} disabled={vm.d === 'running'} onClick={() => start(n.id)}>{vm.btn.text}</Button>
                    </NodeCardFooter>
                  )}
                </>
              )}
            </NodeCard>
          );
        })}

        {EDGES.map((x) => {
          const d = C.disp(x.to);
          const title = ({ ready: 'Start', stale: 'Update', review: 'Open Review', running: 'View progress', locked: 'Open file', todo: 'Not ready' } as Record<string, string>)[d];
          return <EdgeButton key={x.id} state={d} selected={ui.edge === x.id} title={title} aria-label={'Workflow: ' + NODE[x.to].wfName}
            style={{ left: x.bx - 11, top: x.by - 11 }} onClick={() => ovUi.edge(e, x.id)} />;
        })}

        {edgeVM && (() => {
          const left = Math.max(0, Math.min(PIPE_W - 300, edgeVM.bx - 150));
          const pos = edgeVM.placement === 'below' ? { top: edgeVM.by + 18 } : { bottom: PIPE_H - (edgeVM.by - 18) };
          return (
            <WorkflowPopover key={edgeVM.edgeId} title={edgeVM.title} badge={edgeVM.badge} badgeTone={edgeVM.badgeTone} placement={edgeVM.placement}
              tailLeft={edgeVM.bx - left - 5} style={{ left, ...pos }}
              lines={edgeVM.lines.map((l) => ({ label: l.label, text: l.text, onOpen: l.link ? () => go(hrefEvent(e.id, 'asset')) : undefined }))}
              footer={<>
                <Button shadow="none" variant={edgeVM.btn.primary ? 'primary' : 'secondary'} onClick={() => start(edgeVM.target)}>{edgeVM.btn.text}</Button>
                <Button shadow="none" onClick={() => run({ act: 'jumpWf' })}>All workflows</Button>
              </>} />
          );
        })()}
      </PipelineCanvas>

      <AttentionSection title="Next steps" count={rowsA.length}>
        {rowsA.map((a) => (
          <AttentionRow key={a.key} tag={a.tag} tagTone={a.tone} title={a.title} description={a.sub}
            actions={<>
              {a.keepLabel && <Button shadow="none" onClick={() => ovKeep(e, a.keepArg!)}>{a.keepLabel}</Button>}
              <Button shadow="none" variant={a.primary ? 'primary' : 'secondary'} onClick={() => {
                if (a.act === 'start') start(a.arg as NodeId);
                else if (a.act === 'review') review(a.arg as NodeId);
                else run({ act: a.act, arg: a.arg });
              }}>{a.btnText}</Button>
            </>} />
        ))}
      </AttentionSection>
    </div>
  );
}

