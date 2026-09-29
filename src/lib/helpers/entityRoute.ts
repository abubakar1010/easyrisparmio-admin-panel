/**
 * Where a record referenced by an activity-log entry or a dashboard alert
 * lives in the dashboard. Returns null for entity types with no detail page.
 */
export function getEntityRoute(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
): string | null {
  if (!entityType || !entityId) return null;
  const routes: Record<string, string> = {
    user: `/client-list`,
    bill: `/case-management/${entityId}`,
    case: `/case-management/case/${entityId}`,
    offer: `/offers-market/${entityId}`,
    supplier: `/suppliers/${entityId}`,
  };
  return routes[entityType] ?? null;
}
