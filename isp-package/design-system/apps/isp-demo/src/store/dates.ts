const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const dShort = (d = new Date()) => MON[d.getMonth()] + ' ' + d.getDate();
export const dLong = (d = new Date()) => MON[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
/** 本地 ISO 串 YYYY-MM-DDTHH:mm → `Oct 31, 2026 14:02`（24 小时制）；无法解析时原样返回 */
export const dTime = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(iso);
  return m ? MON[Number(m[2]) - 1] + ' ' + Number(m[3]) + ', ' + m[1] + ' ' + m[4] + ':' + m[5] : iso;
};
