import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { google } from "googleapis";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";

dotenv.config();

const TOKEN_FILE = './.user-tokens.json';

async function startServer() {
  const app = express();
  app.set('trust proxy', 1); // Trust the first proxy
  const PORT = 3000;

  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for Vite dev server to work properly
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes"
  });
  app.use("/api/", limiter);

  // In-memory store for tokens (for demo purposes)
  let userTokens: any = null;
  if (fs.existsSync(TOKEN_FILE)) {
    try { userTokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')); } catch {}
  }

  const getOAuth2Client = (redirectUri?: string) => {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri || `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`
    );
  };

  const getAuthenticatedClient = () => {
    const client = getOAuth2Client();
    if (userTokens) {
      client.setCredentials(userTokens);
    }
    return client;
  };

  app.get("/api/url/content", async (req, res) => {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: "url is required" });
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      
      const contentType = response.headers.get("content-type") || "";
      
      if (contentType.includes("application/pdf") || contentType.includes("image/")) {
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        res.json({ content: base64, isBase64: true, mimeType: contentType });
      } else {
        const text = await response.text();
        res.json({ content: text, isBase64: false, mimeType: "text/plain" });
      }
    } catch (error: any) {
      console.error("Error fetching URL content:", error);
      res.status(500).json({ error: error.message || "Failed to fetch URL content" });
    }
  });

  app.get("/api/auth/status", (req, res) => {
    res.json({ connected: !!userTokens });
  });

  app.get("/api/calendar/events", async (req, res) => {
    // ... (keep this, it might be used elsewhere)
    res.json({ events: [] });
  });

  app.post("/api/events/extract", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API key not configured. Please add GEMINI_API_KEY to your environment variables or .env file.");
      }
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ 
        apiKey: apiKey,
      });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Extract structured data from the following event invitation text. Return a JSON object with these 19 fields: title, date, location, organizer, priority (High, Medium, Low), representative, theme, description, targetAudience, objectives, cost, deadline, format (In-person, Online, Hybrid), language, contactPerson, contactEmail, website, requiredPreparation, notes. \n\n" + text,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              date: { type: Type.STRING },
              location: { type: Type.STRING },
              organizer: { type: Type.STRING },
              priority: { type: Type.STRING },
              representative: { type: Type.STRING },
              theme: { type: Type.STRING },
              description: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              objectives: { type: Type.STRING },
              cost: { type: Type.STRING },
              deadline: { type: Type.STRING },
              format: { type: Type.STRING },
              language: { type: Type.STRING },
              contactPerson: { type: Type.STRING },
              contactEmail: { type: Type.STRING },
              website: { type: Type.STRING },
              requiredPreparation: { type: Type.STRING },
              notes: { type: Type.STRING }
            },
            required: ["title", "date", "location", "organizer", "priority", "representative"]
          }
        }
      });
      
      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/events/extract-batch", async (req, res) => {
    const { text, inlineData } = req.body;
    if (!text && !inlineData) return res.status(400).json({ error: "Text or document is required" });
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API key not configured. Please add GEMINI_API_KEY to your environment variables or .env file.");
      }
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const prompt = `Extract structured data for multiple events from the provided document or text. 
If it's a spreadsheet/table, the first row usually contains detailed information/headers and then each subsequent row represents an event and its respective details.
Extract an array of event objects. Each object should have these 19 fields: title, date, location, organizer, priority (High, Medium, Low), representative, theme, description, targetAudience, objectives, cost, deadline, format (In-person, Online, Hybrid), language, contactPerson, contactEmail, website, requiredPreparation, notes.
Please do not exceed 30 events to avoid truncation.
\n\n${text || ""}`;

      const contents: any[] = [prompt];
      if (inlineData) {
        contents.push({
          inlineData: {
            data: inlineData.data,
            mimeType: inlineData.mimeType
          }
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                date: { type: Type.STRING },
                location: { type: Type.STRING },
                organizer: { type: Type.STRING },
                priority: { type: Type.STRING },
                representative: { type: Type.STRING },
                theme: { type: Type.STRING },
                description: { type: Type.STRING },
                targetAudience: { type: Type.STRING },
                objectives: { type: Type.STRING },
                cost: { type: Type.STRING },
                deadline: { type: Type.STRING },
                format: { type: Type.STRING },
                language: { type: Type.STRING },
                contactPerson: { type: Type.STRING },
                contactEmail: { type: Type.STRING },
                website: { type: Type.STRING },
                requiredPreparation: { type: Type.STRING },
                notes: { type: Type.STRING }
              },
              required: ["title", "date", "location", "organizer", "priority", "representative"]
            }
          }
        }
      });
      
      let data;
      const responseText = response.text || "[]";
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.warn("Batch extraction JSON parse failed, attempting to salvage truncated JSON");
        try {
          // Extract valid JSON objects using regex (since schema is a flat object array)
          const objectRegex = /{[^{}]*}/g;
          const matches = responseText.match(objectRegex);
          if (matches && matches.length > 0) {
            const validObjects = matches.map(m => {
              try {
                return JSON.parse(m);
              } catch (err) {
                return null;
              }
            }).filter(Boolean);
            if (validObjects.length > 0) {
              data = validObjects;
            } else {
              throw new Error("Could not parse any complete events from the truncated output.");
            }
          } else {
            throw new Error("The document is too large and the analysis was truncated. Please try a smaller document or fewer events.");
          }
        } catch (recoveryErr: any) {
          throw new Error("The document is too large and the analysis was truncated. Please try a smaller document or fewer events.");
        }
      }
      
      res.json(data);
    } catch (error: any) {
      console.error("Batch extraction error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
