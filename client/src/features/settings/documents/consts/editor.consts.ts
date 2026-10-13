export const LAYOUT_MIN_PT = -2000;
export const LAYOUT_MAX_PT = 2000;
export const MIN_FONT_PT = 4;
export const MAX_FONT_PT = 72;
export const DEFAULT_FONT_PT = 11;
export const MAX_LINE_RULES = 50;
export const MAX_EDITOR_IMAGE_BYTES = 1_000_000;
export const PAGE_SHEET_GAP_PX = 32;
export const ORDERED_LIST_START_MIN = 1;
export const ORDERED_LIST_START_MAX = 9999;
export const FIELD_DRAG_TYPE = 'application/x-bsb-field';
export const DEFAULT_EDITOR_ZOOM = 100;
export const DEFAULT_PARAGRAPH_MARGIN_PT = 8;
export const MIN_PARAGRAPH_MARGIN_PT = 0;
export const MAX_PARAGRAPH_MARGIN_PT = 100;
export const DEFAULT_LINE_HEIGHT = 1.2;
export const MIN_LINE_HEIGHT = 1;
export const MAX_LINE_HEIGHT = 3;
export const LINE_HEIGHT_STEP = 0.1;
export const MAX_BLANK_UNDERLINE_PT = 200;
export const BLANK_UNDERLINE_BORDER_PT = 0.5;
export const MAX_TABLE_MARGIN_PT = 200;
export const CSS_PX_PER_INCH = 96;
export const MM_PER_INCH = 25.4;
export const PAGE_BREAK_SLOP_PX = 1;
export const DEFAULT_TABLE_ROWS = 3;
export const DEFAULT_TABLE_COLUMNS = 2;
export const LONG_PARAGRAPH_LENGTH = 100;
export const EDITOR_ZOOM_LEVELS = [75, 100, 125, 150, 175, 200] as const;
export const EDITOR_FONT_FAMILIES = [
  'Calibri',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Symbol',
  'Apple Symbols',
  'Wingdings',
] as const;
export const LINE_LABEL_FONT_FAMILIES = [
  'Arial',
  'Calibri',
  'Times New Roman',
] as const;
