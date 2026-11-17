/** 当前租户的有效用户（用户 ID 去重；创建者本人不在候选里）。用户在 eConfig 侧邀请，iSP 不提供邀请入口 */
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

/** 业务 Role（单选）。缩写在括号里 */
export const ROLES = [
  { value: 'DEV', label: 'Programmer (DEV)' },
  { value: 'STAT', label: 'Statistician (STAT)' },
  { value: 'DM', label: 'Data Manager (DM)' },
  { value: 'QC', label: 'QC Programmer (QC)' },
  { value: 'VIEW', label: 'Viewer (VIEW)' },
];
