/** Resolves categories shown by the estimate editor. */
export function resolveEstimateCategories(
  defaultCategories: string[],
  itemCategories: string[],
  modelCategories?: string[],
): string[] {
  // Keep item categories so a category created in the estimate remains reusable.
  const categories = modelCategories
    ? [...modelCategories, ...itemCategories]
    : [...defaultCategories, ...itemCategories];
  return [...new Set(categories)].filter(Boolean);
}
