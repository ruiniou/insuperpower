/** 当前租户的有效用户（用户 ID 去重；创建者本人不在候选里）。用户在 eConfig 侧邀请，iSP 不提供邀请入口 */
export const DEMO_TENANT = 'Demo Tenant';
/** 当前登录用户（Demo 的 me）。创建者本人不在候选里，但在自己创建或担任 Admin 的 Study 里是成员 */
export const ME_USER: TenantUser = { id: 'U-101', name: 'User Name', email: 'user.name@demo-tenant.com' };
export interface TenantUser { id: string; name: string; email: string }
export const TENANT_USERS: TenantUser[] = [
  { id: 'U-102', name: 'Li Wei', email: 'li.wei@demo-tenant.com' },
  { id: 'U-103', name: 'Chen Yu', email: 'chen.yu@demo-tenant.com' },
  { id: 'U-104', name: 'Zhao Min', email: 'zhao.min@demo-tenant.com' },
  { id: 'U-105', name: 'Wang Fang', email: 'wang.fang@demo-tenant.com' },
  { id: 'U-106', name: 'Zhang Hui', email: 'zhang.hui@demo-tenant.com' },
  { id: 'U-107', name: 'Liu Yang', email: 'liu.yang@demo-tenant.com' },
  { id: 'U-108', name: 'Sun Qian', email: 'sun.qian@demo-tenant.com' },
];

/** 按姓名找用户（含当前用户） */
export const userByName = (name: string): TenantUser | undefined => [ME_USER, ...TENANT_USERS].find((u) => u.name === name);
export const userById = (id: string): TenantUser | undefined => [ME_USER, ...TENANT_USERS].find((u) => u.id === id);

/** 业务 Role（单选）。全局只显示缩写 */
export const ROLES = [
  { value: 'DEV', label: 'DEV' },
  { value: 'STAT', label: 'STAT' },
  { value: 'DM', label: 'DM' },
  { value: 'QC', label: 'QC' },
  { value: 'VIEW', label: 'VIEW' },
];

/** 盲态属性（单选，与 Role 相互独立）。UNSET 为默认 */
export const BLIND_ATTRS = [
  { value: 'BLINDED', label: 'Blinded' },
  { value: 'UNBLINDED', label: 'Unblinded' },
  { value: 'UNSET', label: 'Unspecified' },
];
