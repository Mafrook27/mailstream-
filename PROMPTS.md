# UI Developer & Marketplace Prompts

This document contains a collection of high-converting email prompts and UI development guidelines for future reference.

## Marketplace Email Prompts (For AI Generation)

### 1. The "PAS" (Problem-Agitate-Solution) Cold Email
**Prompt:** Write a cold email using the Problem-Agitate-Solution framework. Identify a common pain point for [Target Audience], agitate the problem by explaining the cost of not fixing it, and present our [Product/Service] as the solution. Include a low-friction Call to Action. Tone: Professional and empathetic.

### 2. The "AIDA" (Attention-Interest-Desire-Action) Promo
**Prompt:** Write a promotional email using the AIDA framework. Grab attention with a bold subject line. Build interest with a surprising statistic. Create desire by highlighting 3 key benefits of [Product]. End with a strong, urgent Call to Action.

### 3. The B2B Meeting Inviter
**Prompt:** Write a short, highly personalized B2B email asking for a 10-minute introductory call. Mention a recent company milestone of theirs (use a placeholder). Focus entirely on the value we can provide them, not on our own features. Tone: Direct, respectful of their time.

### 4. The Webinar Reminder
**Prompt:** Write a reminder email for an upcoming webinar happening tomorrow. Build excitement, remind them of the top 2 things they will learn, and include a clear, prominent link to join the room. Tone: Energetic and helpful.

## UI/UX Developer Guidelines

When extending this application, adhere to the following UI/UX principles:

1. **Consistent Spacing:** Use Tailwind's spacing scale (e.g., `space-y-4`, `gap-6`) consistently. Avoid arbitrary values.
2. **Progressive Disclosure:** Hide complex settings (like advanced SMTP configs) behind "Advanced" toggles or accordions to keep the primary UI clean.
3. **Feedback & States:** Always provide visual feedback for user actions. Use loading spinners (`Loader2` from Lucide) for async operations, and toast notifications for success/error states.
4. **Accessibility:** Ensure all interactive elements have appropriate `aria-labels` and keyboard navigation support. Use semantic HTML.
5. **Color Palette:** Stick to the established `zinc` (neutral) and `purple` (accent/AI) color palette. Use `destructive` (red) only for irreversible actions like deletion.
