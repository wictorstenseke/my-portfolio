/** Query parameter name for shared portfolio audience links. */
export const AUDIENCE_QUERY_PARAM = "audience" as const;
export const DEFAULT_AUDIENCE = "general" as const;

export const SUPPORTED_AUDIENCES = [
  DEFAULT_AUDIENCE,
  "product-manager",
  "frontend-engineer",
] as const;

export type Audience = (typeof SUPPORTED_AUDIENCES)[number];

const audienceSet = new Set<string>(SUPPORTED_AUDIENCES);

/**
 * Normalizes a raw `audience` query value. Missing or unsupported values
 * resolve to the default audience.
 */
export function resolveAudience(raw: string | null | undefined): Audience {
  if (raw == null || raw === "") {
    return DEFAULT_AUDIENCE;
  }
  const key = raw.trim().toLowerCase();
  return audienceSet.has(key) ? (key as Audience) : DEFAULT_AUDIENCE;
}

export function audienceFromSearch(search: string): Audience {
  const q = search.startsWith("?") ? search.slice(1) : search;
  return resolveAudience(new URLSearchParams(q).get(AUDIENCE_QUERY_PARAM));
}
