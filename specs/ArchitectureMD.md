# Architecture Specification (ArchitectureMD)

## Tech Stack
- **Frontend**: React 18+, Vite, Tailwind CSS, Lucide-React, Motion (Framer Motion).
- **Backend**: Node.js, Express, Google APIs (googleapis), Nodemailer, Cookie-Parser.
- **AI Engine**: Google Gemini API (`@google/genai`).
- **Database**: Stateless (Session-based via Cookies).

## Project Structure
- `/src/features/`: Feature-oriented component folders.
- `/src/components/ui/`: Shared UI components (shadcn-inspired).
- `/src/lib/`: Utility functions and shared logic.
- `/src/services/`: API client services.
- `/server.ts`: Express server entry point.

## Security Architecture
- **OAuth2**: Use Google's secure authorization flow for Sheets and Gmail.
- **Cookies**: Secure, HttpOnly, SameSite=None cookies for session management.
- **Rate Limiting**: `express-rate-limit` on all API routes.
- **Proxy Trust**: Configured to trust Cloud Run/Nginx proxies for accurate IP tracking.
- **API Key Security**: Gemini API key is injected at runtime and used only on the client-side (as per platform guidelines).
