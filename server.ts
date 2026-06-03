import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Copilot API
  app.post("/api/copilot", async (req, res) => {
    try {
      const { prompt, history } = req.body;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are Smart AI Copilot, an intelligent assistant for MEAT PRO manufacturing system.",
          tools: [{ googleSearch: {} }] // Add Google Search capability
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Failed to generate content" });
    }
  });

  // OEE Analyzer API
  app.post("/api/oee-analyze", async (req, res) => {
    try {
      const { machines, plantMetrics, trendData } = req.body;

      if (!machines || !plantMetrics) {
        return res.status(400).json({ error: "Missing required OEE metrics data" });
      }

      // Format a concise prompt for Gemini to digest
      const prompt = `
Please analyze the following manufacturing OEE (Overall Equipment Effectiveness) data for "MEAT PRO", our meat processing factory:

1. Plant-Wide Averages:
- Overall OEE: \${plantMetrics.oee?.toFixed(1) || 'N/A'}% (Target: 85.0%)
- Availability (A): \${plantMetrics.availability?.toFixed(1) || 'N/A'}%
- Performance (P): \${plantMetrics.performance?.toFixed(1) || 'N/A'}%
- Quality (Q): \${plantMetrics.quality?.toFixed(1) || 'N/A'}%

2. Equipment Performance Details:
\${machines.map((m: any) => \`
- Machine ID: \${m.id} (\${m.name}) on line \${m.line}
  * Status: \${m.status}
  * Planned Time: \${m.plannedMins} mins, Operating Time: \${m.operatingMins} mins
  * Actual Output: \${m.actualOutput} kg/packs, Defect Output: \${m.defectOutput} kg/packs (Defect Rate: \${(m.defectOutput / m.actualOutput * 100).toFixed(2)}%)
  * Calculated Availability: \${m.availability?.toFixed(1) || 'N/A'}%
  * Calculated Performance: \${m.performance?.toFixed(1) || 'N/A'}%
  * Calculated Quality: \${m.quality?.toFixed(1) || 'N/A'}%
  * Calculated OEE: \${m.oee?.toFixed(1) || 'N/A'}%
\`).join('\\n')}

3. Last 7 Days OEE Trend Data:
\${trendData ? trendData.map((t: any) => \`- \${t.name}: OEE \${t.oee}%, A \${t.availability}%, P \${t.performance}%, Q \${t.quality}%\`).join('\\n') : 'No trend data available'}

Using this data, provide EXACTLY 3 highly actionable, factory-floor realistic recommendations to improve our efficiency, reduce material waste, or decrease machinery downtime.
Write recommendations in high-quality professional Thai language suitable for Thai line supervisor or plant managers, utilizing correct English industrial terms where appropriate (e.g., OEE, Preventative Maintenance, Setup Time, Quality Defect).

Each recommendation must contain:
1. A descriptive, short, powerful title.
2. The target metric affected (e.g., Availability, Performance, Quality, or General).
3. A concise diagnostic description of what is failing or underperforming based directly on the actual machine numbers provided.
4. Concrete, step-by-step action items for the floor workers.
5. Priority tier (High, Medium, Low).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the Head Of Smart Manufacturing AI at MEAT PRO, specialized in Lean Manufacturing, OEE optimization, and root-cause machine downtime analysis.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                description: "List of exactly 3 highly specific, data-driven recommendations.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: "Descriptive recommendation title (in Thai, with English terms if suitable)."
                    },
                    metric: {
                      type: Type.STRING,
                      description: "The pillar targeted: 'Availability', 'Performance', 'Quality', or 'General'."
                    },
                    description: {
                      type: Type.STRING,
                      description: "A professional diagnostic explanation of why this is occurring based on the inputs."
                    },
                    actionSteps: {
                      type: Type.STRING,
                      description: "Bullet-by-bullet list of concrete, practical steps for physical intervention."
                    },
                    priority: {
                      type: Type.STRING,
                      description: "Priority tier: 'High', 'Medium', or 'Low'."
                    }
                  },
                  required: ["title", "metric", "description", "actionSteps", "priority"]
                }
              }
            },
            required: ["recommendations"]
          }
        }
      });

      const responseText = response.text || "{}";
      const resultObj = JSON.parse(responseText);
      res.json(resultObj);
    } catch (err: any) {
      console.error("Gemini OEE Analyzer Error:", err);
      res.status(500).json({ error: err.message || "Failed to analyze OEE data" });
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
