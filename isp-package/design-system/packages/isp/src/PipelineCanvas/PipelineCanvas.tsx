import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import './PipelineCanvas.css';

export interface PipelineCanvasProps extends HTMLAttributes<HTMLDivElement> {
  /** 画布内容区固定尺寸（节点、连线用该坐标系绝对定位） */
  width?: number;
  height?: number;
}

/** 流水线画布：点阵底的舞台 + 固定尺寸、居中的内容区；内容区溢出时舞台横向滚动 */
export function PipelineCanvas({ width = 1182, height = 508, className, children, ...rest }: PipelineCanvasProps) {
  return (
    <div className={cx('wiz-isp-stage', className)} {...rest}>
      <div className="wiz-isp-pipe" style={{ width, height }}>{children}</div>
    </div>
  );
}

export interface PipelineLaneLabelProps extends HTMLAttributes<HTMLDivElement> { left: number; width: number }

/** 画布顶部的分组标题（如 Generate Shell、Input），下划线跨 width */
export function PipelineLaneLabel({ left, width, className, style, children, ...rest }: PipelineLaneLabelProps) {
  return <div className={cx('wiz-isp-lane', className)} style={{ left, width, ...style }} {...rest}><span>{children}</span></div>;
}
