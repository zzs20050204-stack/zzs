export const BASE_URL = 'http://localhost:8080';

/** 格式化 ISO 日期字符串为 YYYY-MM-DD HH:mm:ss */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return dateStr.replace('T', ' ');
}
