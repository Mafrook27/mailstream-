# Design System: "Neo-Code" (Codecademy-Inspired)

## 1. Visual Philosophy
**The Vibe:** Educational, structured, and technical but approachable.

**Aesthetic:** "Softened Neo-Brutalism." High contrast, clear boundaries, and modular components.

**Grid:** Strict 4px or 8px baseline grid. Everything should feel like it belongs in a card or a container.

## 2. Color Palette
**Backgrounds:**
* Primary: `#FFFFFF` (White)
* Secondary: `#F0F0F0` (Light Gray)
* Dark Mode/Editor: `#0A0E14` (Deep Navy)

**Accents:**
* Action/Primary: `#3A10E5` (Vibrant Purple)
* Success: `#008A00` (Mint Green)
* Warning: `#F5C000` (Yellow)

**Borders:** `#000000` (Black) with a width of 1px or 2px.

## 3. Typography
* **Headings:** Sans-serif (DIN Next or Inter), Bold weight, tight letter spacing.
* **Body:** Sans-serif (Inter or System UI), Regular weight.
* **Code/Technical:** Monospace (Fira Code or JetBrains Mono).
* **Rule:** Use monospace for buttons, tags, and small labels to give a "dev" feel.

## 4. Component Specs
**Cards:**
* Background: White.
* Border: 2px solid black.
* Shadow: `4px 4px 0px 0px #000000` (Hard drop shadow, no blur).
* Border Radius: 0px.

**Buttons:**
* Style: Solid background with black border.
* Hover State: Shift shadow to `2px 2px` or change background color to an accent.
* Font: Monospace, All-Caps.

**Inputs:**
* Flat styling, 2px full black outline. No glows or soft gradients.

## 5. UI Layout Rules
* **Header:** Simple, white background, thick bottom border (2px solid black).
* **Progress Indicators:** Use thick, blocky bars. Avoid rounded "pills."
* **Sidebars:** High contrast (e.g., Light Gray sidebar against White main content).

## Recommended Prompt for your AI IDE:
"Build a [insert page name, e.g., User Dashboard] using React and Tailwind CSS. Follow the Neo-Code Design System provided above. Focus on high-contrast borders, hard 4px shadows (using `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`), and a mix of Inter and Monospace fonts. Ensure the layout is modular and card-based."
