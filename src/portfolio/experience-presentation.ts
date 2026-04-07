import type {
  ExperienceEntry,
  ExperiencePresentationRules,
  ResolvedExperiencePresentation,
} from "./types";

function listIds<T extends { readonly id: string }>(items: readonly T[]): readonly string[] {
  return items.map((item) => item.id);
}

function assertPermutation(label: string, order: readonly string[], expected: readonly string[]): void {
  if (order.length !== expected.length) {
    throw new Error(`${label}: expected ${expected.length} ids, got ${order.length}`);
  }
  const sortedOrder = [...order].sort();
  const sortedExpected = [...expected].sort();
  for (let i = 0; i < sortedExpected.length; i++) {
    if (sortedOrder[i] !== sortedExpected[i]) {
      throw new Error(`${label}: ids do not match canonical set`);
    }
  }
}

function reorderByIdList<T extends { readonly id: string }>(
  items: readonly T[],
  order: readonly string[],
  label: string,
): readonly T[] {
  const byId = new Map(items.map((item) => [item.id, item] as const));
  assertPermutation(
    label,
    order,
    items.map((i) => i.id),
  );
  return order.map((id) => {
    const row = byId.get(id);
    if (!row) {
      throw new Error(`${label}: unknown id ${id}`);
    }
    return row;
  });
}

function assertKnownIds(
  label: string,
  ids: readonly string[] | undefined,
  knownIds: ReadonlySet<string>,
): void {
  if (!ids) {
    return;
  }
  for (const id of ids) {
    if (!knownIds.has(id)) {
      throw new Error(`${label}: unknown id ${id}`);
    }
  }
}

function validateExperiencePresentationRules(
  entries: readonly ExperienceEntry[],
  rules: ExperiencePresentationRules | undefined,
): void {
  if (!rules) {
    return;
  }

  const knownJobIds = new Set(listIds(entries));
  const knownConsultingIds = new Set(
    entries.flatMap((entry) => listIds(entry.consulting ?? [])),
  );

  if (rules.jobOrder) {
    assertPermutation("experience.jobOrder", rules.jobOrder, listIds(entries));
  }

  if (rules.consultingOrderByJobId) {
    for (const [jobId, order] of Object.entries(rules.consultingOrderByJobId)) {
      if (!order) {
        throw new Error(`experience.consultingOrderByJobId[${jobId}]: missing order`);
      }
      const entry = entries.find((candidate) => candidate.id === jobId);
      if (!entry) {
        throw new Error(`experience.consultingOrderByJobId: unknown job id ${jobId}`);
      }
      if (!entry.consulting) {
        throw new Error(`experience.consultingOrderByJobId: no consulting block for job id ${jobId}`);
      }
      assertPermutation(
        `experience.consultingOrderByJobId[${jobId}]`,
        order,
        listIds(entry.consulting),
      );
    }
  }

  assertKnownIds("experience.emphasizedJobIds", rules.emphasizedJobIds, knownJobIds);
  assertKnownIds(
    "experience.emphasizedConsultingIds",
    rules.emphasizedConsultingIds,
    knownConsultingIds,
  );
}

/**
 * Applies optional ordering rules to cloned experience rows. Canonical facts are unchanged.
 */
export function applyExperiencePresentationRules(
  entries: readonly ExperienceEntry[],
  rules: ExperiencePresentationRules | undefined,
): readonly ExperienceEntry[] {
  validateExperiencePresentationRules(entries, rules);

  if (!rules?.jobOrder && !rules?.consultingOrderByJobId) {
    return entries;
  }

  let working: ExperienceEntry[];

  if (rules.jobOrder) {
    working = reorderByIdList([...entries], rules.jobOrder, "experience.jobOrder").map((entry) => ({
      ...entry,
      consulting: entry.consulting ? [...entry.consulting] : undefined,
    }));
  } else {
    working = entries.map((entry) => ({
      ...entry,
      consulting: entry.consulting ? [...entry.consulting] : undefined,
    }));
  }

  if (rules.consultingOrderByJobId) {
    working = working.map((entry) => {
      const order = rules.consultingOrderByJobId![entry.id];
      if (!order || !entry.consulting) {
        return entry;
      }
      return {
        ...entry,
        consulting: reorderByIdList(
          entry.consulting,
          order,
          `experience.consultingOrderByJobId[${entry.id}]`,
        ),
      };
    });
  }

  return working;
}

export function resolveExperiencePresentation(
  rules: ExperiencePresentationRules | undefined,
): ResolvedExperiencePresentation {
  return {
    emphasizedJobIds: [...(rules?.emphasizedJobIds ?? [])],
    emphasizedConsultingIds: [...(rules?.emphasizedConsultingIds ?? [])],
  };
}
