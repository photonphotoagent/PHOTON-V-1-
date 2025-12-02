import { GoogleGenAI, Modality, Chat, Type } from "@google/genai";
import { AnalysisResult, Workflow, ShotConcept } from "../types";

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

// StoryBrand Guide Persona: A trusted mentor, clear, encouraging but honest.
const AI_CURATOR_INSTRUCTIONS = `You are a world-class Creative Director and Mentor acting as a trusted guide for a photographer. Your goal is to help them succeed commercially and artistically. Your tone should be professional, encouraging, but brutally honest about what needs to improve to sell this work. You are not just a critic; you are a partner in their success.

Your output MUST be a single JSON object that strictly adheres to the provided schema. No other text.

Scoring System (0-99):
- monetization: How likely is this to sell on stock/print sites?
- social: How shareable/viral is this?
- portfolio: Is this artistic, portfolio-grade work?
- technical_quality: Sharpness, lighting, noise.

Social Strategy:
- hashtag_groups: Separate tags into 'niche' (specific subject), 'viral' (trending now), and 'broad' (general photography).

Creative Remixes (The Transformation):
- Generate 4 distinct creative concepts to transform this image, covering different goals.
- Category 'Social': Viral aesthetics (e.g. "Y2K", "Glitch", "Vaporwave", "Cinematic").
- Category 'Commercial': Clean, stock-photo ready styles (e.g. "Bright & Airy", "Corporate Minimal", "Studio Lighting").
- Category 'Artistic': Fine art styles for print (e.g. "Charcoal Sketch", "Impressionist", "Double Exposure").
- Category 'Fantasy': Bold transformations (e.g. "Cyberpunk", "Post-Apocalyptic", "Ethereal").

Market Comparison (The Reality Check):
- Explain why similar images sell. Be specific about the "Why".`;


export const analyzeImage = async (imageBase64: string, mimeType: string): Promise<AnalysisResult> => {
    const imagePart = fileToGenerativePart(imageBase64, mimeType);
    const textPart = { text: "Analyze this image. Guide me on how to improve and sell it." };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
        config: {
          systemInstruction: AI_CURATOR_INSTRUCTIONS,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scores: {
                type: Type.OBJECT,
                properties: {
                  monetization: { type: Type.NUMBER },
                  social: { type: Type.NUMBER },
                  portfolio: { type: Type.NUMBER },
                  technical_quality: { type: Type.NUMBER },
                },
                required: ['monetization', 'social', 'portfolio', 'technical_quality'],
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
                  hashtag_groups: {
                      type: Type.OBJECT,
                      properties: {
                          niche: { type: Type.ARRAY, items: { type: Type.STRING } },
                          viral: { type: Type.ARRAY, items: { type: Type.STRING } },
                          broad: { type: Type.ARRAY, items: { type: Type.STRING } }
                      },
                      required: ['niche', 'viral', 'broad']
                  }
                },
                required: ['suggested_edits', 'social_media_appeal', 'sample_posts', 'hashtag_groups'],
              },
              creative_remixes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        prompt: { type: Type.STRING },
                        vibe: { type: Type.STRING },
                        category: { type: Type.STRING, enum: ['Social', 'Commercial', 'Artistic', 'Fantasy'] }
                    },
                    required: ['title', 'description', 'prompt', 'vibe', 'category']
                }
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
            required: ['scores', 'monetization_strategy', 'curation_insights', 'social_media_strategy', 'market_comparison', 'creative_remixes'],
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

export const generateWorkflowFromPrompt = async (userPrompt: string): Promise<Workflow> => {
    const prompt = `You are a Route Architect helping a creator build a business.
    The user wants to save time on this task: "${userPrompt}".
    
    Create a pragmatic, step-by-step "Route" (workflow) to achieve this.
    Crucially, you must distinguish between steps the SYSTEM (AI/API) can do automatically, and steps the HUMAN (User) must perform physically or creatively.
    
    - 'system': Upscaling, tagging, posting to API, sending email, generating text.
    - 'human': Taking the photo, shipping a physical product, signing a contract, meeting a client.
    
    Return a JSON object strictly adhering to the schema.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING, description: "A short, catchy title for the Route" },
                    description: { type: Type.STRING, description: "A brief summary of what this Route does" },
                    steps: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                name: { type: Type.STRING, description: "Name of the step" },
                                description: { type: Type.STRING, description: "Details about this step" },
                                actor: { type: Type.STRING, enum: ['system', 'human'] },
                                status: { type: Type.STRING, enum: ['pending'] }, // Always start as pending
                                icon: { type: Type.STRING, description: "One of: 'upload', 'ai', 'edit', 'market', 'social', 'mail', 'check'" }
                            },
                            required: ['id', 'name', 'description', 'actor', 'status', 'icon']
                        }
                    },
                    isActive: { type: Type.BOOLEAN },
                    progress: { type: Type.NUMBER }
                },
                required: ['id', 'title', 'description', 'steps', 'isActive', 'progress']
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        const workflow = JSON.parse(jsonText) as Workflow;
        // Initialize logs
        workflow.logs = [];
        return workflow;
    } catch (e) {
        console.error("Failed to parse workflow JSON:", e);
        throw new Error("Failed to generate workflow.");
    }
};

/**
 * Simulates the execution of a step by asking the AI to generate a realistic log message/result.
 */
export const executeWorkflowStep = async (stepName: string, stepDescription: string, actor: 'human' | 'system'): Promise<string> => {
    const prompt = `You are the system kernel for an AI photography agent.
    You are currently processing the step: "${stepName}" (${stepDescription}).
    The actor for this step is: ${actor.toUpperCase()}.
    
    If actor is SYSTEM: Generate a realistic, technical, and brief system log output (e.g., "API Response: 200 OK").
    If actor is HUMAN: Generate a log indicating the system is waiting for or verifying the user's action (e.g., "Waiting for user input...", "Verified user upload.").
    
    Do not use markdown. Just the plain log text.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text.trim();
};

export const generateShotConcepts = async (
    inputs: { subject: string; location: string; mood: string; lighting: string }
): Promise<ShotConcept[]> => {
    const prompt = `You are a high-concept Creative Director for photography. 
    The photographer wants to shoot a "${inputs.subject}" in a "${inputs.location}" with "${inputs.mood}" vibes and "${inputs.lighting}" lighting.
    
    Based on these "mad libs" style inputs, generate 3 distinct, high-quality photography concepts.
    They should be practical but creative.
    
    Return a JSON object with a list of concepts strictly adhering to the schema.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    concepts: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                visual_description: { type: Type.STRING, description: "A vivid description of the shot." },
                                technical_specs: { type: Type.STRING, description: "Recommended lens, aperture, shutter, ISO, etc." },
                                art_direction: { type: Type.STRING, description: "Posing, props, color palette advice." },
                                difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] }
                            },
                            required: ['title', 'visual_description', 'technical_specs', 'art_direction', 'difficulty']
                        }
                    }
                },
                required: ['concepts']
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as { concepts: ShotConcept[] };
        return result.concepts;
    } catch (e) {
        console.error("Failed to parse shot concepts JSON:", e);
        throw new Error("Failed to generate shot concepts.");
    }
};