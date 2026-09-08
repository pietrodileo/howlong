/** Resolves categories shown by the estimate editor. */
export function resolveEstimateCategories(
  defaultCategories: string[],
  itemCategories: string[],
  modelCategories?: string[],
): string[] {
  const categories = modelCategories ?? [...defaultCategories, ...itemCategories];
  return [...new Set(categories)].filter(Boolean);
}
