import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON bodies with higher limit for code transport
app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey : "AQ.Ab8RN6Lk14Vb86HQDi4XrWpNvY3rZJq13MiiPoO6i0mALVbqrw",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper to call generateContent with retry on transient errors (429/503) and fallback models
async function generateContentWithRetry(params: {
  model?: string;
  contents: any;
  config?: any;
}, retriesLeft = 3, delayMs = 1200): Promise<any> {
  const modelsToTry = [
    params.model || "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ];
  
  let lastError: any = null;

  for (const modelToTry of modelsToTry) {
    let attempts = 0;
    const maxAttemptsForModel = modelToTry === params.model ? retriesLeft : 1;
    
    while (attempts < maxAttemptsForModel) {
      try {
        console.log(`[Gemini client] Querying model: ${modelToTry} (Attempt ${attempts + 1}/${maxAttemptsForModel})`);
        const response = await ai.models.generateContent({
          model: modelToTry,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const statusCode = err.status || (err.message && err.message.includes("503") ? 503 : null);
        console.warn(`[Gemini client] Error with model ${modelToTry}:`, err.message || err);
        
        const isTransient = statusCode === 503 || statusCode === 429 || 
          (err.message && (err.message.includes("503") || err.message.includes("429") || err.message.includes("high demand") || err.message.includes("UNAVAILABLE")));
          
        if (isTransient) {
          attempts++;
          if (attempts < maxAttemptsForModel) {
            const backoffDelay = delayMs * Math.pow(2, attempts - 1);
            console.log(`[Gemini client] Transient error on ${modelToTry}. Waiting ${backoffDelay}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          }
        } else {
          break;
        }
      }
    }
  }
  
  throw lastError || new Error("All Gemini models and retry configurations failed.");
}

// API Helper to get Gemini Key and respond gracefully if missing
function checkApiKey(res: express.Response): boolean {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || process.env.GEMINI_API_KEY === "") {
    res.status(500).json({
      error: "Gemini API key is not configured. Please open Secrets under Settings to add GEMINI_API_KEY."
    });
    return false;
  }
  return true;
}

// 1. Suggest Wizard Config based on a simple prompt string
app.post("/api/suggest-wizard", async (req, res) => {
  if (!checkApiKey(res)) return;

  const { idea } = req.body;
  if (!idea) {
    return res.status(400).json({ error: "Idea prompt is required." });
  }

  try {
    const systemPrompt = `You are an expert SaaS solution architect. Translate the user's SaaS business idea into structural wizard options. Choose options that best fit the customer description.
You must output valid, schema-conforming JSON containing the ideal tech stack, feature checklist, monetization strategy with customized tiers, and dynamic user security roles.`;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: `Propose wizard options for the SaaS idea: "${idea}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            appType: {
              type: Type.STRING,
              description: "Must be one of: 'Marketplace', 'Social Network', 'Analytics Dashboard', 'CRM', or 'Custom'"
            },
            features: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 4-6 specific feature names to add to the boilerplate checklist, based on the idea."
            },
            techStack: {
              type: Type.OBJECT,
              properties: {
                frontend: { type: Type.STRING, description: "Typically 'React/Next.js'" },
                backend: { type: Type.STRING, description: "Must be: 'Next.js API Routes', 'Express.js', or 'FastAPI'" },
                database: { type: Type.STRING, description: "Must be: 'PostgreSQL (with Prisma)' or 'MongoDB (with Mongoose)'" },
                auth: { type: Type.STRING, description: "Must be: 'NextAuth.js', 'Clerk', or 'Supabase Auth'" },
                payments: { type: Type.STRING, description: "Must be: 'Stripe', 'Paddle', or 'None'" }
              },
              required: ["frontend", "backend", "database", "auth", "payments"]
            },
            monetization: {
              type: Type.STRING,
              description: "Must be one of: 'Subscription', 'One-Time Purchase', or 'Freemium'"
            },
            subscriptionTiers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "e.g., Basic, Pro, Enterprise" },
                  price: { type: Type.STRING, description: "Price tag e.g., '$19/mo' or '$0/mo'" },
                  features: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["name", "price", "features"]
              },
              description: "List pricing tiers customizable for this idea if Subscription is pre-selected."
            },
            userRoles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "e.g., Administrator, Vendor, Customer, Auditor" },
                  permissions: {
                    type: Type.OBJECT,
                    properties: {
                      create: { type: Type.BOOLEAN },
                      read: { type: Type.BOOLEAN },
                      update: { type: Type.BOOLEAN },
                      delete: { type: Type.BOOLEAN }
                    },
                    required: ["create", "read", "update", "delete"]
                  }
                },
                required: ["name", "permissions"]
              },
              description: "Define 2-3 custom roles that make sense for this precise SaaS application."
            }
          },
          required: ["appType", "features", "techStack", "monetization", "subscriptionTiers", "userRoles"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Suggest Wizard Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate wizard options" });
  }
});

// 2. Main Full-Stack Blueprint Generator Route
app.post("/api/generate", async (req, res) => {
  if (!checkApiKey(res)) return;

  const { config } = req.body;
  if (!config) {
    return res.status(400).json({ error: "Configuration object is required." });
  }

  try {
    const systemPrompt = `You are a world-class SaaS architect and senior full-stack engineer. Generate a complete, production-ready SaaS application package with realistic code. You MUST output a clean JSON object. 

CRITICAL RULES:
1. Generate EVERY file needed for a fully working application stack. Avoid empty placeholder comments. Provide realistic logic.
2. If Next.js / React, generate file router architecture, app shell pages, interactive layouts, mock credentials or signup views.
3. For databases, write concrete database config files and complete schemas:
   - If PostgreSQL 'schema.prisma', write comprehensive models (e.g., User, Session, Team, Role, Subscription, Transaction).
   - If MongoDB 'monogoose.ts', write detailed schemas.
4. For Auth, generate authentication webhooks or configuration endpoints (e.g., session handling, auth check, token verify).
5. For payment checkouts, write payment processors (e.g., stripe handlers, subscription webhook verification, plan routers).
6. Always include:
   - A fully detailed README.md explaining local setup steps, environment variable config, dev server start scripts, database migrations, and Docker builds.
   - A Dockerfile and docker-compose.yml configuration to launch database and backend containers.
   - An env file template (.env.example) including all secret options with appropriate keys.
7. Return clean JSON containing projectName, setupInstructions, and the detailed list of files. Do NOT prefix or suffix this output with any markdown block tags like \`\`\`json.`;

    const requestPrompt = `Generate a full-stack SaaS application setup with the following custom configuration:
${JSON.stringify(config, null, 2)}`;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: requestPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectName: { type: Type.STRING },
            setupInstructions: { type: Type.STRING, description: "A detailed markdown content for README.md summarizing setup, start, and features." },
            files: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  path: { type: Type.STRING, description: "The destination file path, e.g., 'src/lib/db.ts' or 'package.json'" },
                  content: { type: Type.STRING, description: "The full code content of the file. No short-hands or comments like '// implement here'." },
                  type: { type: Type.STRING, description: "Category of file: 'config', 'schema', 'route', 'component', 'middleware', 'util', 'test', 'doc'" }
                },
                required: ["path", "content", "type"]
              }
            }
          },
          required: ["projectName", "setupInstructions", "files"]
        }
      }
    });

    const parsedJson = JSON.parse(response.text || "{}");
    res.json(parsedJson);
  } catch (err: any) {
    console.error("Project Generation Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate structured SaaS codebase" });
  }
});

// 3. Integrated AI Chat Endpoint proxying Gemini LLM securely
app.post("/api/gemini/chat", async (req, res) => {
  if (!checkApiKey(res)) return;

  const { messages, activeFile, activeFileContent } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  try {
    const recentMessages = messages.slice(-10);

    const systemPrompt = `You are VS Copilot, an absolute world-class VS Code Embedded AI Pair Programmer Companion and agent.
You help write elegant code, suggest refactions, and perform file manipulations.

IMPORTANT CONTEXT:
The user's virtual VS Code workspace starts completely clean with zero files.
You are fully empowered to create, edit, or delete files inside their virtual file system! 

When requested to "build the app", "bootstrap files", "write code", or specifically "build a full stack flutter app", you MUST generate a complete, high-fidelity, professional multi-file full-stack Flutter architecture.
To build a premium "full stack flutter app", output multiple mock files in separate folders representing the complete stack:
1. "pubspec.yaml" containing appropriate metadata and dependencies.
2. "lib/main.dart" representing the frontend application, showing multiple interactive views in real Dart/Flutter style: a beautiful dashboard, a mock REST API logs console, and a Database Records viewer.
3. "lib/server/api_server.dart" representing a simulated full backend server stack in Dart, with endpoints like GET /api/todos, POST /api/todos, simulated port listener logs, and JSON response mock servers.
4. "lib/services/db_service.dart" representing an object/document database store with simulated persistent storage, CRUD methods, and database statistics.
5. "lib/models/todo.dart" representing clean data model structures.
6. "README.md" explaining this dual-tier frontend-backend architecture.

RULES:
- When a user asks you to create/edit files or write code, populate the 'operations' array with the appropriate operations.
- Always write 100% complete, robust, realistic code content. NEVER write short-hands, ellipses, or placeholder comments like "// TODO: implementation here". Everything must look like production-ready Flutter and Dart code.
- If the user asks general questions or chat statements, leave the 'operations' array empty.
- Keep your conversational 'reply' helpful, objective, and supportive. Highlight precisely what files were created or modified.`;

    const contents = recentMessages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: msg.content }]
    }));

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: "Conversational text reply explaining your suggestions, code choices, and confirming files created or modified."
            },
            operations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "Must be one of: 'create', 'edit', or 'delete'"
                  },
                  path: {
                    type: Type.STRING,
                    description: "Virtual path, like 'lib/main.dart', 'pubspec.yaml', 'lib/server/api_server.dart', or 'README.md'."
                  },
                  content: {
                    type: Type.STRING,
                    description: "Raw contents of the file when creating or editing. Must contain 100% complete, authentic-looking Dart code or text."
                  }
                },
                required: ["type", "path"]
              },
              description: "A list of virtual files to create, edit, or delete as requested by the user."
            }
          },
          required: ["reply"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json({
      reply: data.reply || "I have processed your query.",
      operations: data.operations || []
    });
  } catch (err: any) {
    console.error("Gemini Chat Endpoint error:", err);
    res.status(500).json({ error: err.message || "Gemini chat request failure." });
  }
});

// Configure Vite middleware or serve static SPA
async function setupVite() {
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
    console.log(`[SaaS Forge Backend] Listening on http://0.0.0.0:${PORT}`);
  });
}

setupVite();
