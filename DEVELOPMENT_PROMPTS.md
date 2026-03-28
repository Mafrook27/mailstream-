# Development Prompts

This document contains a collection of useful prompts for UI developers to use when building or extending the application using AI tools. These prompts are designed to generate high-quality, consistent code that adheres to the Neo-Code design system.

## UI/UX Design & Styling

### Neo-Code Component Generation
> "Create a new React component for a [Component Name, e.g., Pricing Table] that strictly adheres to the 'Neo-Code' design system. It must feature 'Softened Neo-Brutalism' with high contrast, 2px solid black borders, 0px border radius, and hard shadows (e.g., `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`). Use 'Inter' for body text and 'JetBrains Mono' for buttons, tags, and technical labels. Ensure all interactive elements have distinct hover states that shift the shadow and position."

### Layout Refactoring
> "Refactor the following layout to use a strict 4px/8px baseline grid. Ensure all sections feel like they belong in a card or container with clear boundaries. Use the Neo-Code color palette: White (#FFFFFF) or Light Gray (#F0F0F0) for backgrounds, and Vibrant Purple (#3A10E5) for primary actions."

### Dark Mode Implementation
> "Implement dark mode for the [Component Name] component. Use Deep Navy (#0A0E14) for the background. Ensure high contrast is maintained for text and borders. Update the hard shadows to use a lighter color or a distinct glow effect that fits the Neo-Brutalist aesthetic in a dark context."

## Component Logic & Interactivity

### Form Validation
> "Add form validation to the [Form Name] component using Zod and React Hook Form. Ensure error messages are displayed clearly using the Neo-Code Alert component styling (red background, black border, hard shadow). The input fields should have a 2px full black outline that turns red on error."

### Accessible Modals
> "Create an accessible modal dialog for [Purpose, e.g., Confirm Deletion]. Ensure it can be closed via the Escape key and clicking outside. The modal must follow Neo-Code styling: thick borders, hard shadows, and a clear visual hierarchy using typography (bold sans-serif for title, monospace for actions)."

## Email Template Generation (AI Prompts)

These prompts can be used within the application's AI email generator or by developers testing the system.

### B2B Cold Outreach
> "Write a B2B cold outreach email offering our new SaaS product. Keep it under 150 words, professional but conversational. Include a clear CTA to book a 15-minute demo. Focus on saving time and increasing revenue. Use the variables {{FirstName}} and {{CompanyName}}."

### Webinar Invitation
> "Create an email invitation for an upcoming webinar about 'Mastering Bulk Email'. The tone should be educational and urgent. Highlight 3 key takeaways. Include a prominent CTA button to 'Save My Spot'. Use the variable {{FirstName}}."

### Customer Success Check-in
> "Write a customer success check-in email for users who have been active for 30 days. Ask for feedback on their experience so far and offer a link to a helpful resource or tutorial. Keep the tone friendly and supportive."

## General Development

### Code Review & Refactoring
> "Review the following React code for performance and adherence to best practices. Suggest improvements for state management, component composition, and accessibility. Ensure the styling approach aligns with Tailwind CSS utility classes."

### Writing Tests
> "Write comprehensive unit tests for the [Utility Function/Component Name] using Vitest and React Testing Library. Cover edge cases, error handling, and user interactions."
