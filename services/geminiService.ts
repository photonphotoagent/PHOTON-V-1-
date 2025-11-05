import { GoogleGenAI, Modality, Chat, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

const AI_CURATOR_INSTRUCTIONS = `You are a world-renowned photo critic and editor for a prestigious art magazine, known for your sharp, insightful, and brutally honest critiques. Your analysis goes beyond the surface, dissecting every element of an image with professional terminology and a deep understanding of photographic art and commerce. Your output MUST be a single JSON object that strictly adheres to the provided schema. No other text, commentary, or explanation should be provided outside of this JSON block.

Scoring System: Scale of 1-99. All four sub-scores and the final overall score must be integers between 1 and 99.

Curation Insights (Detailed Critique):
This is the most critical section. Provide a detailed, expert critique broken into three specific areas. Be specific and use professional terminology.
- composition_and_framing: Analyze the rule of thirds, leading lines, framing, balance, and overall compositional harmony or intentional disharmony. Discuss how the crop impacts the image's narrative and flow. Mention negative space and subject placement.
- lighting_and_color: Critique the quality and direction of light (e.g., soft, hard, diffused, Rembrandt). Analyze the color palette, harmony, and temperature (e.g., 'The analogous color scheme of blues and greens creates a serene mood'). Mention technical issues like blown highlights, crushed shadows, chromatic aberration, or color casts.
- subject_and_narrative: Evaluate the power of the subject matter. Does it tell a story? Does it evoke an emotional response? Discuss the focus, the moment captured, its narrative weight, and its potential for interpretation.

Social Media & Edit Strategy:
Generate a 'social_media_strategy' object containing:
- suggested_edits: An array of 2-3 unique and professional editing suggestions tailored specifically to the image provided. Avoid generic advice. Suggestions should cover a range of techniques (e.g., 'Apply a cinematic teal and orange color grade', 'Use a tone curve to create a soft, matte finish', 'Dodge and burn to add dimension').
- social_media_appeal: A single sentence summarizing the image's appeal for social platforms.
- sample_posts: An array of 2 sample posts for relevant platforms (e.g., Instagram, Pinterest).

Market Comparison:
Provide a 'market_comparison' object. This must be an array of 2-3 descriptions of similar, top-performing images in the target market (e.g., stock photography, print-on-demand). For each, provide a 'description' of the competing image's subject and style, and a 'reasoning' for its commercial success.`;


export const analyzeImage = async (imageBase64: string, mimeType: string): Promise<AnalysisResult> => {
    const imagePart = fileToGenerativePart(imageBase64, mimeType);
    const textPart = { text: "Analyze the provided image based on your system instructions." };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
        config: {
          systemInstruction: AI_CURATOR_INSTRUCTIONS,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              monetization_score: {
                type: Type.OBJECT,
                properties: {
                  overall: { type: Type.NUMBER },
                  technical_quality_score: { type: Type.NUMBER },
                  commercial_appeal_score: { type: Type.NUMBER },
                  market_rarity_score: { type: Type.NUMBER },
                  emotional_resonance_score: { type: Type.NUMBER },
                },
                required: ['overall', 'technical_quality_score', 'commercial_appeal_score', 'market_rarity_score', 'emotional_resonance_score'],
              },
              monetization_strategy: {
                type: Type.OBJECT,
                properties: {
                  best_use_case: { type: Type.STRING },
                  suggested_keywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  art_director_caption: { type: Type.STRING }
                },
                required: ['best_use_case', 'suggested_keywords', 'art_director_caption'],
              },
              curation_insights: {
                type: Type.OBJECT,
                properties: {
                  composition_and_framing: { type: Type.STRING },
                  lighting_and_color: { type: Type.STRING },
                  subject_and_narrative: { type: Type.STRING },
                  actionable_fix: { type: Type.STRING }
                },
                required: ['composition_and_framing', 'lighting_and_color', 'subject_and_narrative', 'actionable_fix'],
              },
              social_media_strategy: {
                type: Type.OBJECT,
                properties: {
                  suggested_edits: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        suggestion: { type: Type.STRING },
                        impact: { type: Type.STRING },
                      },
                      required: ['suggestion', 'impact'],
                    }
                  },
                  social_media_appeal: { type: Type.STRING },
                  sample_posts: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        platform: { type: Type.STRING },
                        post_text: { type: Type.STRING },
                      },
                      required: ['platform', 'post_text'],
                    }
                  },
                },
                required: ['suggested_edits', 'social_media_appeal', 'sample_posts'],
              },
              market_comparison: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    reasoning: { type: Type.STRING },
                  },
                  required: ['description', 'reasoning'],
                }
              }
            },
            required: ['monetization_score', 'monetization_strategy', 'curation_insights', 'social_media_strategy', 'market_comparison'],
          }
        }
    });
  
    try {
      const jsonText = response.text.trim();
      return JSON.parse(jsonText) as AnalysisResult;
    } catch (e) {
      console.error("Failed to parse analysis JSON:", e);
      console.error("Raw response text:", response.text);
      throw new Error("The analysis result was not in the expected format.");
    }
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const imagePart = fileToGenerativePart(imageBase64, mimeType);
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error("No image found in the response for editing.");
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            aspectRatio: aspectRatio,
            outputMimeType: 'image/png',
        },
    });
    
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return base64ImageBytes;
};

// Simulate upscaling - in a real app, this would call a specialized model/API.
const simulateNetworkDelay = (min = 500, max = 1500) => 
    new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));

export const upscaleImage = async (imageBase64: string, mimeType: string): Promise<string> => {
    console.log("Simulating upscale to 26MP...");
    // Use a longer delay to simulate a more intensive operation
    await simulateNetworkDelay(3000, 5000); 
    // For this simulation, we'll just return the original image data.
    // A real implementation would return new, higher-resolution image data.
    console.log("Upscale simulation complete.");
    return imageBase64;
};


export const createChat = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
    });
};

export const getDeepThoughtResponse = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gem-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        },
    });
    return response.text;
};