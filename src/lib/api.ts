export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-Studio-Request': '1', ...init.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new ApiError(response.status, data.error || '请求未完成');
  return data;
}
export const local = {
  get(key: string) {
    try {
      return localStorage.getItem(`studio:${key}`);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(`studio:${key}`, value);
    } catch {
      /* file persistence remains primary */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(`studio:${key}`);
    } catch {
      /* optional cache */
    }
  },
};
