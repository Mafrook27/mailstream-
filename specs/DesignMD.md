# Design Specification (DesignMD)

## Visual Identity: Neubrutalism
The application follows a **Neubrutalist** design aesthetic, characterized by:
- **High Contrast**: Stark black borders (`border-2` or `border-4`) and pure white/zinc backgrounds.
- **Hard Shadows**: Non-blurred, offset shadows (`shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`).
- **Bold Typography**: Heavy use of uppercase, black-weight headings and monospaced fonts for data.
- **Vibrant Accents**: Primary colors (Purple/Indigo) and functional colors (Green for success, Red for errors) used sparingly but boldly.

## Typography
- **Headings**: `font-heading` (Inter/Geist) with `font-black` and `uppercase`.
- **UI/Body**: `font-sans` (Inter) for readability.
- **Data/Code**: `font-mono` (JetBrains Mono) for CSV data, variables, and technical details.

## Layout Patterns
- **Bento Grids**: Information is organized into distinct, bordered cards.
- **Sticky Headers/Footers**: Navigation and branding remain accessible.
- **Responsive Design**: Mobile-first approach with stacked layouts on small screens and split-panes on desktop.
