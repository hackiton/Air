import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { AppSettings, ModelType } from "../types";

// Helper to get base64 from file
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateResponse = async (
  prompt: string,
  images: File[],
  history: { role: string; parts: { text: string }[] }[],
  settings: AppSettings
): Promise<{ text: string; groundingSources: { title: string; uri: string }[]; generatedImages: string[] }> => {
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  // Construct parts
  const parts: Part[] = [];
  
  // Add images first
  for (const img of images) {
    const imgPart = await fileToGenerativePart(img);
    parts.push(imgPart);
  }
  
  // Add text prompt
  parts.push({ text: prompt });

  // Configure Tools & Thinking
  const tools: any[] = [];
  if (settings.useWebGrounding && !settings.generateImage) {
    tools.push({ googleSearch: {} });
  }

  const thinkingConfig = (settings.useDeepThinking && !settings.generateImage)
    ? { thinkingConfig: { thinkingBudget: settings.thinkingBudget } }
    : undefined;

  // Determine model based on task
  const selectedModel = settings.generateImage ? ModelType.FLASH_IMAGE : ModelType.FLASH;

  // Building contents array from history + current prompt
  // Explicitly type contents to allow 'Part[]' which is broader than '{ text: string }[]'
  const contents: { role: string; parts: Part[] }[] = history.map(h => ({
    role: h.role,
    parts: h.parts as Part[]
  }));
  
  // Add current user message
  contents.push({
    role: 'user',
    parts: parts 
  });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: selectedModel,
      contents: contents,
      config: {
        tools: tools.length > 0 ? tools : undefined,
        ...thinkingConfig,
        // System instruction
        systemInstruction: settings.generateImage
          ? "You are a creative artist. Generate images based on the user's prompt."
          : (settings.useDeepThinking 
              ? "You are Nexus, a deep reasoning AI. Break down complex problems step-by-step. If grounding is active, cite sources."
              : "You are Nexus, a helpful and intelligent AI assistant.")
      }
    });

    let text = "";
    const generatedImages: string[] = [];

    // Parse response for both text and images
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          text += part.text;
        }
        if (part.inlineData) {
          generatedImages.push(part.inlineData.data);
        }
      }
    } else {
      text = "I couldn't generate a response.";
    }
    
    // Extract grounding chunks
    const groundingSources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          groundingSources.push({
            title: chunk.web.title || "Source",
            uri: chunk.web.uri
          });
        }
      });
    }

    return { text, groundingSources, generatedImages };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "An unexpected error occurred.");
  }
};