const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const dShort = (d = new Date()) => MON[d.getMonth()] + ' ' + d.getDate();
export const dLong = (d = new Date()) => MON[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
