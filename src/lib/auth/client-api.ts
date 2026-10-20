type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = {
  success: false;
  error: { code: string; message: string };
};

export async function postAuthJson<T>(
  path: string,
  body: Record<string, unknown>
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });

  let json: ApiSuccess<T> | ApiFailure;
  try {
    json = (await res.json()) as ApiSuccess<T> | ApiFailure;
  } catch {
    return { ok: false, message: "Unexpected response from server" };
  }

  if (!json.success) {
    return { ok: false, message: json.error?.message ?? "Something went wrong" };
  }

  return { ok: true, data: json.data };
}

export function authRedirectPath(data: { onboardingCompleted?: boolean }) {
  return data.onboardingCompleted ? "/app" : "/app/onboarding";
}
