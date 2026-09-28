import i18n from "../i18n";

// The backend stores activity actions as English phrases ("Supplier FAQ Created"),
// so they are mapped to translation keys here. Unknown actions fall back to the raw text.
function toKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function translateActivityAction(action: string): string {
  return i18n.t(`activity_history.action_labels.${toKey(action)}`, { defaultValue: action });
}

export function translateEntityType(entityType: string): string {
  return i18n.t(`activity_history.entity_labels.${toKey(entityType)}`, { defaultValue: entityType });
}
