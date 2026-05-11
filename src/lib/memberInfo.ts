/**
 * 共用會員資料儲存 / 載入（localStorage）
 * 用於：個人結帳填表、揪團建立填表「帶入會員資料」
 */

const MEMBER_INFO_KEY = 'gc:solo:member_info';

export type SavedMemberInfo = {
  name?: string;
  phone?: string;
  taxId?: string;
};

export function loadSavedMemberInfo(): SavedMemberInfo | null {
  try {
    const raw = localStorage.getItem(MEMBER_INFO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedMemberInfo;
    if (!parsed?.phone && !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveMemberInfo(info: SavedMemberInfo) {
  try {
    localStorage.setItem(MEMBER_INFO_KEY, JSON.stringify(info));
  } catch {}
}
