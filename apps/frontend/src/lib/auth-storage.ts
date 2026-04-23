export interface StoredUserMeta {
  role: string;
  name: string;
}

export function saveUserMeta(user: StoredUserMeta) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user_role', user.role);
  localStorage.setItem('user_name', user.name);
}

export function clearUserMeta() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_name');
}
