export async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  const data = await response
    .json()
    .catch(() => ({ error: "The service returned an unreadable response." }));
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("auth/"))
      window.location.assign("/sign-in?expired=true");
    throw new Error(data.error ?? "Please try again.");
  }
  return data;
}
