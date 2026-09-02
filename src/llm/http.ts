export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Preferences are inconsistent (wrong provider for the key, missing Base URL…). */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/** Turns a non-2xx response into an ApiError carrying the API's own message when it has one. */
export async function assertOk(res: Response): Promise<void> {
  if (res.ok) return;
  let detail = "";
  try {
    const body = (await res.json()) as { error?: { message?: string } | string };
    detail = typeof body.error === "string" ? body.error : (body.error?.message ?? "");
  } catch {
    // body was not JSON; the status line is all we have
  }
  throw new ApiError(res.status, `${res.status} ${res.statusText}${detail ? `: ${detail}` : ""}`);
}

/** True when the fix is in the extension preferences, not in the text: bad config, or a 401/403 from the API. */
export function needsPreferences(error: unknown): boolean {
  if (error instanceof ConfigError) return true;
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export function byName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name);
}
