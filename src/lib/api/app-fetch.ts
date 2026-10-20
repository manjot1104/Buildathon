type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = {
  success: false;
  error: { code: string; message: string };
};

export type AppFetchResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; message: string; status: number; code?: string };

async function parseJson<T>(res: Response): Promise<AppFetchResult<T>> {
  let json: ApiSuccess<T> | ApiFailure;
  try {
    json = (await res.json()) as ApiSuccess<T> | ApiFailure;
  } catch {
    return { ok: false, message: "Unexpected response from server", status: res.status };
  }

  if (!json.success) {
    return {
      ok: false,
      message: json.error?.message ?? "Something went wrong",
      status: res.status,
      code: json.error?.code,
    };
  }

  return { ok: true, data: json.data, status: res.status };
}

export async function appGet<T>(path: string): Promise<AppFetchResult<T>> {
  const res = await fetch(path, { credentials: "same-origin", cache: "no-store" });
  return parseJson<T>(res);
}

export async function appPost<T>(
  path: string,
  body?: Record<string, unknown>
): Promise<AppFetchResult<T>> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });
  return parseJson<T>(res);
}

export async function appPatch<T>(
  path: string,
  body: Record<string, unknown>
): Promise<AppFetchResult<T>> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });
  return parseJson<T>(res);
}
