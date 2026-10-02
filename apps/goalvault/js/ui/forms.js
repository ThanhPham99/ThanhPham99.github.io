// Modal forms. Each keeps its values in a plain object and re-renders itself on validation errors.
import {
  formatNumber, isDateStr, normalizeTag, parseNumber, tagsOf, todayStr, validateItemInput,
} from '../domain.js';
import { getLang, t } from '../i18n.js';
import { COLORS, ICONS, colorHex } from '../presets.js';
import { h, icon, modalHeader, openModal, showError } from './dom.js';

export function field(label, input, { hint, error } = {}) {
  return h('label', { class: 'block space-y-1.5' },
    h('span', { class: 'label' }, label),
    input,
    error ? h('span', { class: 'block text-xs text-rose-500' }, error)
      : hint ? h('span', { class: 'block text-xs text-slate-500 dark:text-slate-400' }, hint) : null);
}

// Text input that accepts either separator style and previews the parsed value.
export function numberField(label, values, key, { error } = {}) {
  const preview = h('span', { class: 'block text-xs text-slate-500 dark:text-slate-400 tabular-nums' });
  const update = () => {
    const raw = values[key];
    const n = parseNumber(raw);
    preview.textContent = !raw ? '' : Number.isNaN(n) ? t('error.number') : `= ${formatNumber(n, getLang())}`;
  };
  const input = h('input', {
    class: 'input tabular-nums', inputmode: 'decimal', autocomplete: 'off', value: values[key] ?? '',
    oninput: (e) => { values[key] = e.target.value; update(); },
  });
  update();
  return h('label', { class: 'block space-y-1.5' },
    h('span', { class: 'label' }, label),
    input,
    error ? h('span', { class: 'block text-xs text-rose-500' }, error) : preview);
}

const footer = (api) => h('div', { class: 'flex justify-end gap-2 pt-2' },
  h('button', { type: 'button', class: 'btn btn-ghost', onclick: api.close }, t('common.cancel')),
  h('button', { type: 'submit', class: 'btn btn-primary' }, t('common.save')));

export function openCategoryForm(ctx, category = null) {
  const values = { name: category?.name ?? '', color: category?.color ?? COLORS[0].key, icon: category?.icon ?? ICONS[0] };
  let error = null;
  openModal((api) => {
    const render = () => h('form', {
      class: 'space-y-5', novalidate: true,
      onsubmit: async (e) => {
        e.preventDefault();
        if (!values.name.trim()) {
          error = t('error.required');
          api.setContent(render());
          return;
        }
        try {
          if (category) await ctx.store.updateCategory(category.id, values);
          else await ctx.store.addCategory(values);
          api.close();
        } catch (err) {
          showError(err);
        }
      },
    },
    modalHeader(t(category ? 'category.edit' : 'category.new'), api),
    field(t('category.name'), h('input', {
      class: 'input', value: values.name, maxlength: 60, 'data-autofocus': true,
      oninput: (e) => { values.name = e.target.value; },
    }), { error }),
    h('div', { class: 'space-y-1.5' },
      h('span', { class: 'label' }, t('category.color')),
      h('div', { class: 'flex flex-wrap gap-2' }, COLORS.map((c) => h('button', {
        type: 'button', 'aria-label': c.key,
        class: `w-9 h-9 rounded-full ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ${values.color === c.key ? 'ring-2 ring-slate-900 dark:ring-white' : ''}`,
        style: { background: c.hex },
        onclick: () => { values.color = c.key; api.setContent(render()); },
      })))),
    h('div', { class: 'space-y-1.5' },
      h('span', { class: 'label' }, t('category.icon')),
      h('div', { class: 'grid grid-cols-8 gap-2' }, ICONS.map((name) => h('button', {
        type: 'button', 'aria-label': name,
        class: `aspect-square rounded-xl flex items-center justify-center transition ${values.icon === name ? 'text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`,
        style: values.icon === name ? { background: colorHex(values.color) } : null,
        onclick: () => { values.icon = name; api.setContent(render()); },
      }, icon(name))))),
    footer(api));
    return render();
  });
}

export function openItemForm(ctx, { categoryId, item = null }) {
  const lang = getLang();
  const initialCurrent = item ? formatNumber(item.current, lang) : '';
  const values = {
    name: item?.name ?? '',
    target: item ? formatNumber(item.target, lang) : '',
    current: initialCurrent,
    tag: item?.tag ?? '',
    deadline: item?.deadline ?? '',
    note: item?.note ?? '',
  };
  const tags = tagsOf(ctx.state.items.filter((i) => i.categoryId === categoryId && !i.archived));
  let errors = {};
  const err = (key) => (errors[key] ? t(`error.${errors[key]}`) : null);

  openModal((api) => {
    const render = () => h('form', {
      class: 'space-y-4', novalidate: true,
      onsubmit: async (e) => {
        e.preventDefault();
        const parsed = {
          name: values.name.trim(),
          target: parseNumber(values.target),
          current: values.current.trim() === '' ? 0 : parseNumber(values.current),
          tag: normalizeTag(values.tag),
          deadline: values.deadline || null,
          note: values.note.trim(),
        };
        errors = validateItemInput(parsed);
        if (Object.keys(errors).length) {
          api.setContent(render());
          return;
        }
        try {
          if (item) {
            const { current, ...patch } = parsed;
            await ctx.store.updateItem(item.id, patch);
            if (values.current !== initialCurrent) await ctx.store.setCurrent(item.id, current);
          } else {
            await ctx.store.addItem({ categoryId, ...parsed });
          }
          api.close();
        } catch (error) {
          showError(error);
        }
      },
    },
    modalHeader(t(item ? 'item.edit' : 'item.new'), api),
    field(t('item.name'), h('input', {
      class: 'input', value: values.name, maxlength: 120, 'data-autofocus': true,
      oninput: (e) => { values.name = e.target.value; },
    }), { error: err('name') }),
    h('div', { class: 'grid grid-cols-2 gap-3' },
      numberField(t('item.target'), values, 'target', { error: err('target') }),
      numberField(t('item.current'), values, 'current', { error: err('current') })),
    field(t('item.tag'), h('input', {
      class: 'input', list: 'goalvault-tags', value: values.tag, maxlength: 40, placeholder: t('common.optional'),
      oninput: (e) => { values.tag = e.target.value; },
    }), { hint: t('item.tagHint') }),
    h('datalist', { id: 'goalvault-tags' }, tags.map((tag) => h('option', { value: tag }))),
    field(t('item.deadline'), h('input', {
      type: 'date', class: 'input', value: values.deadline,
      onchange: (e) => { values.deadline = e.target.value; },
    }), { error: err('deadline'), hint: t('common.optional') }),
    field(t('item.note'), h('textarea', {
      class: 'input min-h-20', maxlength: 500, rows: 3,
      oninput: (e) => { values.note = e.target.value; },
    }, values.note)),
    footer(api));
    return render();
  });
}

export function promptText({ title, label, value = '', maxlength = 40 }) {
  return new Promise((resolve) => {
    let done = false;
    const values = { text: value };
    openModal((api) => {
      api.onClose(() => { if (!done) resolve(null); });
      return h('form', {
        class: 'space-y-4',
        onsubmit: (e) => {
          e.preventDefault();
          done = true;
          resolve(values.text);
          api.close();
        },
      },
      modalHeader(title, api),
      field(label, h('input', {
        class: 'input', value: values.text, maxlength, 'data-autofocus': true,
        oninput: (e) => { values.text = e.target.value; },
      })),
      footer(api));
    });
  });
}
