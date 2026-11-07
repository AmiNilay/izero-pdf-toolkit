# Swiss Minimalist Design System Implementation

## Overview
This document specifies the implementation of the **Swiss Minimalist** design system across iZeroPDF. The visual language emphasizes clarity, structure, contrast, continuous typographic grids, exposed rules, and immediate visual feedback.

---

## Authoritative Tokens

| CSS Variable | Value | Purpose |
| :--- | :--- | :--- |
| `--dp-color-ground` | `#ffffff` (Light) / `#0a0a0a` (Dark) | Primary canvas ground |
| `--dp-color-ink` | `#000000` (Light) / `#ffffff` (Dark) | Typography, rules, and contrast fills |
| `--dp-color-surface` | `#f0f0f0` (Light) / `#141414` (Dark) | Supporting backgrounds and input zones |
| `--dp-color-accent` | `#c90000` (Light) / `#e50000` (Dark) | Compact signals, active dots, featured flags |
| `--dp-typography-face` | `"SwissMinimalistHost", "Host Grotesk", Arial, sans-serif` | Single unified grotesque typeface |
| `--dp-typography-body` | `16px` | Sustained reading font size |
| `--dp-typography-label` | `12px` | Small index labels and button text |
| `--dp-typography-metadata`| `14px` | Supporting descriptions |
| `--dp-typography-lead` | `17px` | Subtitles and prominent intros |
| `--dp-typography-item-title` | `24px` | Tool card headlines |
| `--dp-typography-regular` | `400` | Paragraph and body weight |
| `--dp-typography-strong` | `700` | Headings and bold metadata |
| `--dp-typography-display` | `750` | Heavy display opening headlines |
| `--dp-typography-label-tracking` | `0.12em` | Uppercase tracking for index & badges |
| `--dp-typography-body-leading` | `1.5` | Body line height |
| `--dp-spacing-gutter` | `clamp(20px, 3.3333cqw, 64px)` | Adaptive grid gutter |
| `--dp-radius-control` | `0` | Square corners (`border-radius: 0 !important`) |
| `--dp-border-rule` | `2px` | Continuous visible exposed dividing rules |
| `--dp-motion-feedback` | `0s` | Immediate tactile feedback |

---

## Layout Architecture

### 1. Twelve-Column Desktop Grid
- **Hero Statement**: Broad 9-column opening headline (`grid-column: 1 / span 9`) with close-set line height (`0.92`), accompanied by a 3-column supporting visual frame (`grid-column: 10 / span 3`).
- **Index Rail (Columns 1–3)**: The persistent sticky rail carries section indexes (`01 / FEATURED`, `02 / PDF`, `03 / IMAGE`), heavy section titles, and concise descriptions.
- **Content Matrix (Columns 4–12)**: Tool cards form an exposed ruled matrix beginning on the 4th column line.

### 2. Ruled Matrix Component Structure
- Cards connect directly through edges and visible `2px` dividing rules (`gap: var(--dp-border-rule); background: var(--dp-color-ink)`).
- Hover states provide immediate contrast inversion (`background: var(--dp-color-ink); color: var(--dp-color-ground)`).
- Priority cues use compact red flags (`--dp-color-accent`).

### 3. Divided Footer
- Aligned to the continuous 12-column grid (`border-top: 2px solid var(--dp-color-ink)`).
- Clear division between Brand / Version (4 columns), Navigation Links (5 columns), and Privacy Disclaimers (3 columns).

---

## Responsive Breakpoints

- **Desktop (> 1050px)**: Full 12-column grid with 3-column index rail and 9-column 3-up matrix.
- **Tablet (701px – 1050px)**: 4-column index rail and 8-column 2-up card matrix.
- **Mobile (≤ 700px)**: Index rail stacks above content, tool cards stack in 2-up or 1-up sequence, gutters scale to 20px, and footer links form 2-column groups.
- **Narrow Mobile (≤ 480px)**: Single column tool list, stacked full-width button actions, and two-column coordinate inputs.

---

## Accessibility & Reduced Motion

- **Focus Visibility**: Universal `:focus-visible` state enforced with `2px solid var(--dp-color-accent)` and `2px` offset.
- **Contrast**: Strict monochrome contrast ratios exceeding WCAG AAA standards.
- **Reduced Motion**: Full support for `prefers-reduced-motion: reduce`, paired with default `0s` feedback tokens.
