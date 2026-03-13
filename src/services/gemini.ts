import { GoogleGenAI, Modality, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiModel = "gemini-3-flash-preview";
export const ttsModel = "gemini-2.5-flash-preview-tts";

export async function generateText(prompt: string, systemInstruction?: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: prompt,
    config: {
      systemInstruction,
    },
  });
  return response.text;
}

export async function searchWithImage(base64Image: string, mimeType: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: "IDENTIFICATION_PROTOCOL: Analyze this biometric input. Perform a multi-spectral facial analysis and cross-reference with global digital footprints. Locate all publicly accessible social media profiles (LinkedIn, X/Twitter, Instagram, Facebook, etc.), professional directories, and official government records. Provide direct URLs to identified profiles and a summary of the subject's digital presence.",
        },
      ],
    },
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are a Federal Intelligence Analyst. Your reports must be concise, technical, and objective. Use professional terminology.",
    },
  });
  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
  };
}

export async function osintSearch(query: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `DIGITAL_TRACE_PROTOCOL: Execute a comprehensive Open Source Intelligence (OSINT) sweep for the target: ${query}. 
    
    REQUIRED_VECTORS:
    1. SOCIAL_GRAPH: Identify all linked social media accounts and forum activity.
    2. BREACH_ANALYSIS: Check for presence in known data breaches or leaked credentials.
    3. PUBLIC_RECORDS: Locate mentions in news archives, official gazettes, and public legal documents.
    4. GEOSPATIAL_CONTEXT: If applicable, identify regional links (especially in Nepal/South Asia).
    
    FORMAT: Provide a structured intelligence report with 'SUMMARY', 'IDENTIFIED_NODES', and 'RISK_ASSESSMENT'.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are an OSINT specialist at a high-level intelligence agency. Your output is a formal intelligence brief.",
    },
  });
  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
  };
}

export async function translateAndSpeak(text: string, targetLang: "English" | "Nepali") {
  // First translate
  const translationPrompt = `Translate the following text to ${targetLang}. Only return the translated text: "${text}"`;
  const translatedText = await generateText(translationPrompt, "You are a professional translator.");

  if (!translatedText) throw new Error("Translation failed");

  // Then speak (if Nepali)
  if (targetLang === "Nepali") {
    const response = await ai.models.generateContent({
      model: ttsModel,
      contents: [{ parts: [{ text: translatedText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" }, // Kore is a good neutral voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return { text: translatedText, audio: base64Audio };
  }

  return { text: translatedText };
}

export async function compareFaces(image1: string, image2: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: {
      parts: [
        { inlineData: { data: image1, mimeType: "image/jpeg" } },
        { inlineData: { data: image2, mimeType: "image/jpeg" } },
        { text: "FORENSIC_COMPARISON_PROTOCOL: Execute a side-by-side biometric comparison of these two subjects. Analyze nodal points, facial geometry, and unique identifiers (scars, marks, etc.). Determine the probability of identity match. Provide a 'CONFIDENCE_SCORE' (0-100%) and a detailed 'MORPHOLOGICAL_ANALYSIS'." },
      ],
    },
    config: {
      systemInstruction: "You are a forensic facial recognition expert. Your analysis must be clinical and precise.",
    }
  });
  return response.text;
}

export async function criminalRecordSearch(name: string, details: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `FEDERAL_RECORD_QUERY: Perform a deep-dive search into global criminal databases, Interpol Red Notices, and national news archives for: ${name}. 
    CONTEXT_PARAMETERS: ${details}. 
    FOCUS: Identify any prior convictions, active warrants, or associations with known criminal organizations.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are a Federal Records Officer. Your reports are used for high-level security clearances.",
    },
  });
  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
  };
}

export async function textToSpeech(text: string) {
  const response = await ai.models.generateContent({
    model: ttsModel,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Kore" },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio;
}
