import { emit } from './store';

/** 版本抽屉状态（原型 UI.drawer / UI.pw.drawer）：路由变化时清空，除非 go() 带 drawer；宽度跨打开保留 */
/** n：版本抽屉里要定位到的版本（内部序号） */
export type DrawerState = { kind: 'assetV' | 'dsV' | 'studyDetails'; id: string; n?: number } | null;
export const ui: { drawer: DrawerState; drawerWidth: number; pending: DrawerState | undefined } = { drawer: null, drawerWidth: 440, pending: undefined };
export const openDrawer = (d: DrawerState) => { ui.drawer = d; emit(); };
export const setDrawerWidth = (w: number) => { ui.drawerWidth = w; emit(); };
/** 路由切换时调用：有待定抽屉则打开，否则清空 */
export function applyPendingDrawer() { ui.drawer = ui.pending ?? null; ui.pending = undefined; }

/** 弹窗状态：由页头按钮 / 行菜单 / 抽屉按钮打开，StudyModals 统一渲染 */
export type ModalState =
  | { kind: 'createEvent'; sid: string }
  | { kind: 'uploadAsset'; sid: string; assetId: string | null; code: string }
  | { kind: 'uploadDataset'; sid: string; dsId: string | null; mode: string }
  | { kind: 'addMembers'; sid: string; userId: string | null }
  | { kind: 'editMember'; sid: string; memberId: string }
  | { kind: 'removeMember'; sid: string; memberId: string }
  | { kind: 'changeBlinding'; sid: string; memberId: string }
  | { kind: 'transferAdmin'; sid: string }
  | null;
export const modalUi: { modal: ModalState } = { modal: null };
export const openModal = (m: ModalState) => { modalUi.modal = m; emit(); };
export const closeModal = () => { modalUi.modal = null; emit(); };
