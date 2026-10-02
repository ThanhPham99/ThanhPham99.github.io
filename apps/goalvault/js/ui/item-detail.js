// Temporary stub — Task 8 replaces this file with the full detail sheet.
import { openItemForm } from './forms.js';

export function openItemDetail(ctx, itemId) {
  const item = ctx.state.items.find((i) => i.id === itemId);
  if (item) openItemForm(ctx, { categoryId: item.categoryId, item });
}
