/** Query parameter name for shared portfolio audience links. */
export const AUDIENCE_QUERY_PARAM = "audience" as const;

export const SUPPORTED_AUDIENCES = [
  "general",
  "product-manager",
  "frontend-engineer",
] as const;

export type Audience = (typeof SUPPORTED_AUDIENCES)[number];

const audienceSet = new Set<string>(SUPPORTED_AUDIENCES);

/**
 * Normalizes a raw `audience` query value. Missing or unsupported values
 * resolve to `general`.
 */
export function resolveAudience(raw: string | null | undefined): Audience {
  if (raw == null || raw === "") {
    return "general";
  }
  const key = raw.trim().toLowerCase();
  return audienceSet.has(key) ? (key as Audience) : "general";
}

export function audienceFromSearch(search: string): Audience {
  const q = search.startsWith("?") ? search.slice(1) : search;
  return resolveAudience(new URLSearchParams(q).get(AUDIENCE_QUERY_PARAM));
}
