export async function client<T>(url: string, config?: RequestInit): Promise<T> {
  const res = await fetch(new Request(url, config));
  if (res.ok) {
    return res.json() as Promise<T>;
  }
  throw new Error(res.statusText);
}
