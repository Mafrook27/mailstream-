# Cloud Specification (CloudMD)

## Deployment Environment
- **Platform**: Google Cloud Run.
- **Runtime**: Node.js 18+ (Standard Environment).
- **Port**: 3000 (Hardcoded by the platform).
- **Region**: Managed by the AI Studio Build environment.

## Environment Variables
- `GEMINI_API_KEY`: Required for AI template generation.
- `GOOGLE_CLIENT_ID`: Required for Google OAuth2 flow.
- `GOOGLE_CLIENT_SECRET`: Required for Google OAuth2 flow.
- `APP_URL`: The dynamic URL of the deployed application (used for OAuth callbacks).

## Infrastructure Configuration
- **Nginx Proxy**: Handles SSL termination and routes traffic to port 3000.
- **Statelessness**: The application is stateless; all session data is stored in secure cookies or client-side React state.
- **Scalability**: Cloud Run handles automatic scaling based on request volume.
