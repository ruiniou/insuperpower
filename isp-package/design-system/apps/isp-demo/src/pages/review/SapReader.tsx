import { Fragment, useEffect, useRef } from 'react';
import { OUTPUTS, PARAS, SAP_TITLE, SECTION } from './tocMock';

const noOf = (id: string) => OUTPUTS.find((o) => o.id === id)?.no ?? id;

/** SAP 原文阅读器：灰色桌面上叠放白色纸页，只有桌面滚动。已关联片段点状下划线，选中输出的片段染选中色并在上方标出输出编号 */
export function SapReader({ sel, cites, onPick, focusPara }: { sel: string; cites: boolean; onPick: (id: string) => void; focusPara: string | null }) {
  const desk = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLElement | null>(null);
  /** 选中输出变化时，把它引用的第一个片段滚到视野中央 */
  useEffect(() => { first.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' }); }, [sel]);
  useEffect(() => {
    if (focusPara) desk.current?.querySelector(`#sap-${focusPara}`)?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [focusPara]);
  first.current = null;

  return (
    <div className="rv-desk" ref={desk} tabIndex={0} role="region" aria-label="SAP document">
      <article className="rv-page">
        <div className="rv-page__hd">{SAP_TITLE}</div>
        <h3 className="rv-h2">4.2. Participant Information</h3>
        <div className="rv-omit">⋯ 4.2.1 Participant Disposition, 4.2.2 Protocol Deviations (earlier on this page, omitted)</div>
        <h4 className="rv-h3">{SECTION.no}. {SECTION.title}</h4>
        {PARAS.map((p) => (
          <div key={p.id} id={'sap-' + p.id} className={'rv-para' + (p.kind === 'li' ? ' is-li' : '') + (focusPara === p.id ? ' is-focus' : '')}>
            <span className="rv-para__no">{p.id}</span>
            <p>
              {p.segs.map((s, i) => {
                if (!s.c || !cites) return <Fragment key={i}>{s.t}</Fragment>;
                const on = s.c.includes(sel);
                const next = () => { const k = s.c!.indexOf(sel); onPick(s.c![(k + 1) % s.c!.length]); };
                return (
                  <button key={i} type="button" className={'rv-seg' + (on ? ' is-on' : '')} aria-pressed={on} onClick={next}
                    ref={(el) => { if (on && !first.current) first.current = el; }}>
                    {on && <span className="rv-seg__tags" aria-hidden="true">{s.c.map((c) => <span key={c} className={c === sel ? 'is-sel' : ''}>{noOf(c)}</span>)}</span>}
                    {s.t}
                  </button>
                );
              })}
            </p>
          </div>
        ))}
        <div className="rv-page__ft">Page 15</div>
      </article>
      <article className="rv-page">
        <div className="rv-page__hd">{SAP_TITLE}</div>
        <h4 className="rv-h3">4.2.4. Pre-Treatment Events, Past/Current Medical History and Surgical History</h4>
        <div className="rv-para"><span className="rv-para__no">P184</span><p>A pre-treatment event (PTE) is any adverse medical event that occurs after a participant signs the informed consent form (ICF) and before the first dose of study drug.</p></div>
        <div className="rv-omit">⋯ remainder omitted</div>
        <div className="rv-page__ft">Page 16</div>
      </article>
    </div>
  );
}
