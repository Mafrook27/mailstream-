# Agent Specification (AgentMD)

## AI Agent Interaction Guidelines
The AI agent (me) should follow these rules when interacting with the codebase:

### 1. Code Style & Quality
- **TypeScript First**: Always use strong types and interfaces.
- **Functional Components**: Prefer React functional components with hooks.
- **Neubrutalist Styling**: Maintain the bold, high-contrast visual identity.
- **Lucide Icons**: Use `lucide-react` for all iconography.

### 2. Feature-Oriented Structure
- **Feature Folders**: Organize new components into `/src/features/{feature-name}/`.
- **Shared UI**: Put reusable, generic components in `/src/components/ui/`.
- **Services**: Keep API logic in `/src/services/`.

### 3. Security & Best Practices
- **Gemini API**: Always call Gemini from the frontend (as per platform rules).
- **OAuth2**: Use the established popup-based OAuth flow for Google services.
- **Rate Limiting**: Ensure all new API routes are properly rate-limited in `server.ts`.
- **Error Handling**: Use `handleFirestoreError` (if Firestore is used) or standardized error responses for all API calls.

### 4. Verification
- **Linting**: Run `lint_applet` after any significant code changes.
- **Compilation**: Run `compile_applet` to verify the build before finishing a task.
- **Testing**: Manually verify critical flows (Auth, AI Generation, Sending) in the preview.
