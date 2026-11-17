import { createContext, useContext } from 'react';

/** Review 工作台里 Nav 默认收起；外壳提供收起状态，页头据此显示展开按钮 */
export const ReviewNavContext = createContext<{ collapsed: boolean; expand: () => void; copilotOpen: boolean; openCopilot: () => void; closeCopilot: () => void } | null>(null);
export const useReviewNav = () => useContext(ReviewNavContext);
