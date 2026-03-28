# Skill Specification (SkillMD)

## Core Capabilities
The application is an **AI-Powered Email Outreach Engine** with the following key skills:

### 1. Data Management
- **CSV Import**: Parse and validate recipient data from CSV files.
- **Google Sheets Integration**: Fetch data directly from Google Sheets using OAuth2.
- **Dynamic Variable Mapping**: Automatically identify and map spreadsheet columns to email variables.

### 2. AI Content Generation
- **Personalized Templates**: Use Gemini AI to generate high-converting email subjects and bodies.
- **Context-Aware Prompting**: Inject recipient data (FirstName, Company, etc.) into AI prompts for hyper-personalization.
- **Tone & Goal Control**: Fine-tune AI output based on audience, goal, and tone.

### 3. Multi-Channel Delivery
- **Gmail API**: Send emails directly from the user's Google account via OAuth2.
- **SMTP Support**: Configure custom SMTP servers (Host, Port, User, Pass) for bulk sending.
- **Mock Mode**: Test the entire outreach flow without sending real emails.

### 4. Security & Compliance
- **OAuth2 Flow**: Securely manage Google permissions without storing user passwords.
- **Rate Limiting**: Backend protection against API abuse and cost control.
- **Environment Isolation**: Secure management of API keys and secrets.
