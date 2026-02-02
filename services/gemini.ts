import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { TargetMedium, AnalysisResult, VisualAsset } from '../types';

export const analyzeImage = async (
  assets: VisualAsset[],
  medium: TargetMedium,
  apiKey: string | null
): Promise<AnalysisResult> => {
  
  // Use passed key or fallback to env (if available and not strictly handled by context)
  const activeKey = apiKey || process.env.API_KEY;

  if (!activeKey) {
    throw new Error("API Key is missing. Please configure it in the settings.");
  }

  if (assets.length === 0) {
    throw new Error("No assets provided for analysis.");
  }

  const ai = new GoogleGenAI({ apiKey: activeKey });
  
  // Prepare prompt parts
  const parts: any[] = [];
  
  // Add images to parts
  for (const asset of assets) {
    try {
      if (asset.type === 'file' && asset.file) {
        const base64Data = await fileToBase64(asset.file);
        parts.push({
          inlineData: {
            mimeType: asset.file.type,
            data: base64Data
          }
        });
      } else if (asset.type === 'url' && asset.url) {
        try {
           const base64Data = await urlToBase64(asset.url);
           parts.push({
            inlineData: {
              mimeType: 'image/jpeg', 
              data: base64Data
            }
          });
        } catch (e) {
           console.warn(`Could not fetch URL ${asset.url} due to CORS. Skipping image bytes.`);
           parts.push({
             text: `[Image URL Source]: ${asset.url}`
           });
        }
      }
    } catch (e) {
      console.error("Error processing asset", asset, e);
    }
  }

  const promptText = `
    Analyze the attached visual assets (Moodboard).
    Target Medium: ${medium}
    
    Output valid JSON containing the summary, the image_generation_prompt, and the YAML specification.
  `;
  
  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4,
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text;
    if (!responseText) {
       throw new Error("Empty response from AI");
    }

    try {
      const cleanedText = cleanJsonString(responseText);
      const parsedData = JSON.parse(cleanedText);
      
      return {
        yaml: parsedData.yaml_spec || "# Error: YAML field missing in response",
        summary: parsedData.summary || {
          mood_keywords: [],
          primary_colors: [],
          style_description: "No summary available."
        },
        image_generation_prompt: parsedData.image_generation_prompt || "Abstract geometric composition, high contrast, retro style."
      };
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, responseText);
      throw new Error("Failed to parse AI response. The model output was not valid JSON.");
    }

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze image. Please try again or check your API Key.");
  }
};

export const generateVisualPreview = async (
  prompt: string,
  medium: TargetMedium,
  apiKey: string | null
): Promise<string> => {
  
  // Priority: 1. Passed Key (Custom/Env), 2. AI Studio Window Key (Legacy/Extension)
  let activeKey = apiKey || process.env.API_KEY;

  // 1. Mandatory API Key Selection logic for Veo/Pro models if no key provided
  // Note: Since we implemented BYOK, we prefer the explicit key, but keep this check for completeness.
  if (!activeKey && (window as any).aistudio) {
    try {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
      // If user selects key via window flow, we might need to rely on the side-effect or internal state,
      // but standard usage requires passing the key. 
      // Assuming user has set key via our new UI for stability.
    } catch (err) {
      console.error("API Key selection failed", err);
    }
  }

  if (!activeKey) {
     throw new Error("API Key is missing. Please set it in the settings.");
  }

  const ai = new GoogleGenAI({ apiKey: activeKey });
  
  const aspectRatio = medium === TargetMedium.SLIDES ? "16:9" : "3:4";

  // Helper to extract image from response
  const extractImage = (response: any) => {
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  };

  // Strategy: Try Pro model first (High Quality), then fallback to Flash (Standard)
  
  // Attempt 1: Gemini 3 Pro Image Preview
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: "1K"
        }
      },
    });
    
    const img = extractImage(response);
    if (img) return img;
    throw new Error("Gemini 3 Pro returned no image data.");

  } catch (error: any) {
    console.warn("Gemini 3 Pro Image Generation failed. Attempting fallback to Gemini 2.5 Flash.", error);

    // Attempt 2: Gemini 2.5 Flash Image (Fallback)
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio
            // Note: imageSize is NOT supported in Flash models
          }
        },
      });

      const img = extractImage(response);
      if (img) return img;
      throw new Error("Gemini 2.5 Flash returned no image data.");

    } catch (fallbackError: any) {
      console.error("Fallback generation failed:", fallbackError);
      
      // Construct a helpful error message
      let msg = "Image generation failed.";
      if (error.message.includes("403") || error.message.includes("PERMISSION")) {
         msg += " (Permission Denied: Please check if your API Key supports the selected model).";
      } else {
         msg += ` Pro Error: ${error.message}. Fallback Error: ${fallbackError.message}`;
      }
      throw new Error(msg);
    }
  }
};

function cleanJsonString(text: string): string {
  // 1. Remove Markdown code blocks (```json ... ```)
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
  
  // 2. Trim whitespace
  cleaned = cleaned.trim();
  
  // 3. Extract JSON object if there's extra text outside braces
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function urlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}