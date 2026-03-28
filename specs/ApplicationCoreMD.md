# Application Core Specification (ApplicationCoreMD)

## Core Logic & State Management
The application is a **Single-Page Application (SPA)** with a centralized React state in `App.tsx`.

### 1. Global State
- **`step`**: Tracks the current phase of the outreach flow (0-4).
- **`contacts`**: Stores the list of recipients (Email, FirstName, etc.).
- **`template`**: Stores the email subject, body, and mapped columns.
- **`config`**: Stores the sending method (SMTP/Gmail) and credentials.
- **`userProfile`**: Stores the authenticated user's details (Name, Email, Picture).

### 2. Data Flow
1. **Input**: User uploads CSV or connects Google Sheets.
2. **Processing**: Data is parsed into a standardized `Contact[]` array.
3. **Drafting**: User writes or generates (via AI) an email template with `{{variable}}` placeholders.
4. **Configuration**: User selects the sending method and provides credentials.
5. **Execution**: The app iterates through `contacts`, replaces placeholders, and calls the backend API to send each email.

### 3. Key Services
- **`geminiService`**: Frontend service to interact with the Gemini API (called from the client).
- **`authService`**: Handles Google OAuth2 flow and session management.
- **`emailService`**: Backend logic for sending via SMTP or Gmail API.
