import type { ReactNode, SVGAttributes } from 'react';
import { cx } from '../cx';
import type { PipelineState } from '../PipelineStatus/PipelineStatus';
import './PipelineWire.css';

export interface PipelineWireProps extends Omit<SVGAttributes<SVGPathElement>, 'd'> {
  /** SVG path，坐标系同 PipelineCanvas */
  d: string;
  /** 下游节点展示状态决定线型：locked 灰实线 · ready 蓝实线 · stale 黄虚线 · todo 灰虚线 · running 蓝流动虚线 · review 蓝实线 */
  state: PipelineState;
}

/** 节点之间的连线；放在 <PipelineWires> 里 */
export function PipelineWire({ d, state, className, ...rest }: PipelineWireProps) {
  return <path d={d} className={cx('wiz-isp-wire', `wiz-isp-wire--${state}`, className)} {...rest} />;
}

export interface PipelineWiresProps { width: number; height: number; children?: ReactNode }

export function PipelineWires({ width, height, children }: PipelineWiresProps) {
  return <svg className="wiz-isp-wires" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">{children}</svg>;
}
