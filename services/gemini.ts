import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (ai) return ai;
  
  // Safe access to process.env to prevent runtime crashes in browser
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || '';
  
  if (!apiKey) {
    console.warn("API Key is missing. AI generation will fail.");
  }
  
  ai = new GoogleGenAI({ apiKey });
  return ai;
};

const SYSTEM_INSTRUCTION = `
You are SiteWeaver, an expert Frontend React & Tailwind CSS engineer.
Your goal is to generate COMPLETE, STANDALONE HTML files based on user requests.

Rules:
1. Return a FULL HTML5 document (<!DOCTYPE html>...</html>).
2. You MUST include the Tailwind CSS CDN in the <head>: <script src="https://cdn.tailwindcss.com"></script>
3. Use Google Fonts (Inter, Space Grotesk) if it makes the design look better.
4. The design must be modern, responsive, and production-ready.
5. Use "https://picsum.photos/800/600" or similar for placeholder images.
6. Return ONLY the HTML code. No markdown formatting (\`\`\`).
7. If the user asks for a change, return the COMPLETE updated HTML file, not just the snippet.
8. Ensure high contrast and accessibility best practices.

Example of expected output format:
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Generated Site</title>
</head>
<body class="bg-white">
    <!-- Content -->
</body>
</html>
`;

export const generateWebsiteDesign = async (
  prompt: string,
  currentCode?: string,
  history: ChatMessage[] = []
): Promise<string> => {
  try {
    const client = getAiClient();
    const model = 'gemini-2.5-flash';
    
    // Construct a context-aware prompt
    let fullPrompt = prompt;
    if (currentCode && currentCode.length > 50) {
      fullPrompt = `
      This is the current code of the website:
      ${currentCode}
      
      User Request for updates:
      ${prompt}
      
      Please regenerate the FULL HTML code incorporating these changes.
      `;
    } else {
        fullPrompt = `Create a website based on this description: ${prompt}`;
    }

    const response = await client.models.generateContent({
      model: model,
      contents: [
        ...history.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
        })),
        {
          role: 'user',
          parts: [{ text: fullPrompt }]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, 
      }
    });

    const text = response.text || '';
    
    // Clean up markdown if present
    const cleanedText = text
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .trim();

    return cleanedText;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate design. Please ensure API Key is configured and try again.");
  }
};