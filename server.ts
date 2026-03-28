import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { rateLimit } from "express-rate-limit";
import fs from "fs";
import { processTemplate } from "./src/lib/templateUtils";

dotenv.config();

const app = express();
const PORT = 3000;

// Trust the proxy (Cloud Run/Nginx) to get the correct client IP for rate limiting
app.set('trust proxy', 1);

// Rate limiting: 1000 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  validate: { 
    xForwardedForHeader: false,
    forwardedHeader: false 
  }
});

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use("/api/", limiter);

const getOAuth2Client = (req: express.Request) => {
  const redirectUri = process.env.APP_URL 
    ? `${process.env.APP_URL}/auth/google/callback`
    : "http://localhost:3000/auth/google/callback";

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

// --- Scheduling System ---
const SCHEDULE_FILE = path.join(process.cwd(), 'scheduled_campaigns.json');

interface ScheduledCampaign {
  id: string;
  scheduledTime: number; // timestamp
  contacts: any[];
  template: any;
  config: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  tokens?: any; // To authenticate with Gmail if needed
}

let scheduledCampaigns: ScheduledCampaign[] = [];

// Load existing campaigns
if (fs.existsSync(SCHEDULE_FILE)) {
  try {
    scheduledCampaigns = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf-8'));
  } catch (e) {
    console.error('Failed to load scheduled campaigns', e);
  }
}

const saveCampaigns = () => {
  fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(scheduledCampaigns, null, 2));
};

const processCampaigns = async () => {
  const now = Date.now();
  const dueCampaigns = scheduledCampaigns.filter(c => c.status === 'pending' && c.scheduledTime <= now);

  for (const campaign of dueCampaigns) {
    campaign.status = 'processing';
    saveCampaigns();

    console.log(`Processing scheduled campaign ${campaign.id}`);
    
    try {
      let client: any = null;
      let gmail: any = null;
      let transporter: any = null;

      if (campaign.config.method === 'gmail' && campaign.tokens) {
        client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        client.setCredentials(campaign.tokens);
        gmail = google.gmail({ version: "v1", auth: client });
      } else if (campaign.config.method === 'smtp' && !campaign.config.mock) {
        transporter = nodemailer.createTransport({
          host: campaign.config.host,
          port: campaign.config.port,
          secure: campaign.config.port === 465,
          auth: {
            user: campaign.config.user,
            pass: campaign.config.pass,
          },
        });
      }

      for (const contact of campaign.contacts) {
        const to = contact[campaign.template.emailColumn];
        if (!to) continue;

        const subject = processTemplate(campaign.template.subject, contact);
        const html = processTemplate(campaign.template.body, contact).replace(/\n/g, '<br/>');

        if (campaign.config.mock) {
          console.log(`[MOCK] Sent to ${to}`);
        } else if (campaign.config.method === 'gmail' && gmail) {
          const mailOptions: any = {
            to,
            subject,
            html,
            textEncoding: 'base64'
          };

          if (campaign.template.attachments && campaign.template.attachments.length > 0) {
            mailOptions.attachments = campaign.template.attachments.map((a: any) => ({
              filename: a.name,
              content: a.content.split('base64,')[1],
              encoding: 'base64'
            }));
          }

          const mail = new MailComposer(mailOptions);
          const messageBuffer = await mail.compile().build();
          
          const encodedMessage = messageBuffer
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

          await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encodedMessage },
          });
        } else if (campaign.config.method === 'smtp' && transporter) {
          const mailOptions: any = {
            from: `"${campaign.config.fromName}" <${campaign.config.fromEmail}>`,
            to,
            subject,
            html,
          };

          if (campaign.template.attachments && campaign.template.attachments.length > 0) {
            mailOptions.attachments = campaign.template.attachments.map((a: any) => ({
              filename: a.name,
              content: a.content.split('base64,')[1],
              encoding: 'base64'
            }));
          }

          await transporter.sendMail(mailOptions);
        }

        if (campaign.config.delay > 0) {
          await new Promise(r => setTimeout(r, campaign.config.delay * 1000));
        }
      }

      campaign.status = 'completed';
    } catch (error) {
      console.error(`Error processing campaign ${campaign.id}:`, error);
      campaign.status = 'failed';
    }

    saveCampaigns();
  }
};

// Check every minute
setInterval(processCampaigns, 60 * 1000);

// API Routes
app.post("/api/schedule-campaign", (req, res) => {
  const { scheduledTime, contacts, template, config } = req.body;
  const tokensCookie = req.cookies.google_tokens;

  if (!scheduledTime || !contacts || !template || !config) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const campaign: ScheduledCampaign = {
    id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    scheduledTime,
    contacts,
    template,
    config,
    status: 'pending'
  };

  if (config.method === 'gmail') {
    if (!tokensCookie) {
      return res.status(401).json({ error: "Not authenticated with Google" });
    }
    try {
      campaign.tokens = JSON.parse(tokensCookie);
    } catch (e) {
      return res.status(401).json({ error: "Invalid Google tokens" });
    }
  }

  scheduledCampaigns.push(campaign);
  saveCampaigns();

  res.json({ success: true, campaignId: campaign.id });
});

app.get("/api/auth/google/url", (req, res) => {
  const client = getOAuth2Client(req);
  const scopes = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.send"
  ];

  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent"
  });

  res.json({ url });
});

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  const client = getOAuth2Client(req);
  try {
    const { tokens } = await client.getToken(code as string);
    
    res.cookie("google_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'google' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.status(500).send("Authentication failed");
  }
});

app.get("/api/sheets/metadata", async (req, res) => {
  const { spreadsheetId } = req.query;
  const tokensCookie = req.cookies.google_tokens;

  if (!tokensCookie) {
    return res.status(401).json({ error: "Not authenticated with Google" });
  }

  try {
    const tokens = JSON.parse(tokensCookie);
    const client = getOAuth2Client(req);
    client.setCredentials(tokens);

    const sheets = google.sheets({ version: "v4", auth: client });
    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId as string,
    });

    const sheetNames = response.data.sheets?.map(s => s.properties?.title).filter(Boolean);
    res.json({ title: response.data.properties?.title, sheets: sheetNames });
  } catch (error) {
    console.error("Error fetching spreadsheet metadata:", error);
    res.status(500).json({ error: "Failed to fetch spreadsheet metadata" });
  }
});

app.get("/api/sheets/data", async (req, res) => {
  const { spreadsheetId, range } = req.query;
  const tokensCookie = req.cookies.google_tokens;

  if (!tokensCookie) {
    return res.status(401).json({ error: "Not authenticated with Google" });
  }

  try {
    const tokens = JSON.parse(tokensCookie);
    const client = getOAuth2Client(req);
    client.setCredentials(tokens);

    const sheets = google.sheets({ version: "v4", auth: client });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId as string,
      range: range as string || "Sheet1!A1:Z100",
    });

    res.json(response.data.values);
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    res.status(500).json({ error: "Failed to fetch sheet data" });
  }
});

app.post("/api/sheets/append", async (req, res) => {
  const { spreadsheetId, range, values } = req.body;
  const tokensCookie = req.cookies.google_tokens;

  if (!tokensCookie) {
    return res.status(401).json({ error: "Not authenticated with Google" });
  }

  try {
    const tokens = JSON.parse(tokensCookie);
    const client = getOAuth2Client(req);
    client.setCredentials(tokens);

    const sheets = google.sheets({ version: "v4", auth: client });
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId as string,
      range: range as string || "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values],
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error appending to sheet:", error);
    res.status(500).json({ error: "Failed to append to sheet" });
  }
});

app.post("/api/send-smtp", async (req, res) => {
  const { smtp, to, subject, html, attachments, mock } = req.body;
  if (mock) return res.json({ success: true, mock: true });

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    const mailOptions: any = {
      from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
      to,
      subject,
      html,
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map((a: any) => ({
        filename: a.name,
        content: a.content.split('base64,')[1],
        encoding: 'base64'
      }));
    }

    await transporter.sendMail(mailOptions);

    res.json({ success: true });
  } catch (error: any) {
    console.error("SMTP Error:", error);
    res.status(500).json({ error: error.message || "Failed to send email via SMTP" });
  }
});

app.post("/api/send-gmail", async (req, res) => {
  const { to, subject, html, attachments } = req.body;
  const tokensCookie = req.cookies.google_tokens;

  if (!tokensCookie) {
    return res.status(401).json({ error: "Not authenticated with Google" });
  }

  try {
    const tokens = JSON.parse(tokensCookie);
    const client = getOAuth2Client(req);
    client.setCredentials(tokens);
    const gmail = google.gmail({ version: "v1", auth: client });

    const mailOptions: any = {
      to,
      subject,
      html,
      textEncoding: 'base64'
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map((a: any) => ({
        filename: a.name,
        content: a.content.split('base64,')[1],
        encoding: 'base64'
      }));
    }

    const mail = new MailComposer(mailOptions);
    const messageBuffer = await mail.compile().build();
    
    const encodedMessage = messageBuffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Gmail API Error:", error);
    res.status(500).json({ error: error.message || "Failed to send email via Gmail" });
  }
});

app.get("/api/auth/me", async (req, res) => {
  const tokensCookie = req.cookies.google_tokens;
  if (!tokensCookie) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const tokens = JSON.parse(tokensCookie);
    const client = getOAuth2Client(req);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const userInfo = await oauth2.userinfo.get();

    res.json(userInfo.data);
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});

app.get("/api/auth/status", (req, res) => {
  const tokensCookie = req.cookies.google_tokens;
  res.json({ connected: !!tokensCookie });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("google_tokens", {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  });
  res.json({ success: true });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
