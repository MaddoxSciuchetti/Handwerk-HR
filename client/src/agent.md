# Agent Instructions (src)

This file provides local guidance for coding agents working in `src/`.

## Scope

- Applies to files under `src/`.
- Prefer small, focused edits.
- Do not change unrelated code.

## Styling Rules

- Use semantic theme classes and CSS variables from `App.css`.
- Use the custom css classes that are being implemented like this "bg-(--destructive) only this works "
- For explicit variable usage, use forms like `bg-(--dropdown-surface)` and `hover:bg-(--hover-bg)`.
- Avoid hardcoded color utilities such as `bg-gray-*`, `text-white`, or `border-blue-*` unless explicitly requested.

## Components and Patterns

- Reuse existing UI primitives from `src/components/ui`.
- Keep button variants consistent with `src/components/ui/button.tsx`.
- In forms, keep each field and its error message in the same container so grid layouts do not break.

## React and TypeScript

- Use strict, explicit types.
- Use stable keys for mapped lists (avoid index keys when possible).

- Keep state values and comparisons consistent (including casing).

## Validation

- After edits, check for TypeScript/lint errors.
- Preserve existing behavior unless the task explicitly changes it.
