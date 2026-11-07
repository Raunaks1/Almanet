/** Shared internal helpers for the ui kit. Not part of its public API. */

/** Classname joiner. */
export const cx = (...names: Array<string | false | null | undefined>) =>
  names.filter(Boolean).join(' ');

/** Consistent size vocabulary across controls. */
export const SIZES = ['sm', 'md', 'lg'] as const;
export type UiSize = (typeof SIZES)[number];
