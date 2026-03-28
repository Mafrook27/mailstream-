export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface Contact {
  [key: string]: string;
}

export interface SmtpConfig {
  method: 'smtp' | 'gmail';
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  mock: boolean;
  delay: number;
}

export interface Attachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64
}

export interface EmailTemplate {
  subject: string;
  body: string;
  emailColumn: string;
  attachments?: Attachment[];
}

export interface SendLog {
  id: string;
  email: string;
  status: 'success' | 'error' | 'pending';
  error?: string;
  timestamp: number;
}

export interface GlobalContext {
  name: string;
  role: string;
  company: string;
  skills: string;
  portfolioUrl: string;
  additionalInfo: string;
}
