import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import type { AnalysisResult, ChatMessage } from '../types';

// Per coding guidelines, the API key must be sourced from process.env.API_KEY.
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        originalText: { type: Type.STRING },
        vocalizedText: { type: Type.STRING },
        translation: { type: Type.STRING },
        grammaticalAnalysis: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING, description: "Kata Arab yang dianalisis." },
                    i_rab: { type: Type.STRING, description: "Istilah I'rab dalam bahasa Arab." },
                    i_rab_translation: { type: Type.STRING, description: "Penjelasan I'rab dalam bahasa Indonesia." },
                    translation: { type: Type.STRING, description: "Terjemahan kata dalam bahasa Indonesia." },
                },
                required: ['word', 'i_rab', 'i_rab_translation', 'translation'],
            },
        },
    },
    required: ['originalText', 'vocalizedText', 'translation', 'grammaticalAnalysis'],
};

export async function analyzeText(text: string): Promise<AnalysisResult> {
    const model = 'gemini-2.5-flash';
    const prompt = `Lakukan analisis gramatikal (I'rab) yang mendalam pada teks Arab berikut. Untuk setiap kata:
1. Sediakan istilah I'rab dalam bahasa Arab (misalnya, مبتدأ مرفوع).
2. Sediakan penjelasan I'rab dalam bahasa Indonesia (misalnya, Subjek dalam kasus nominatif).
3. Sediakan terjemahan kata itu sendiri dalam bahasa Indonesia.

Selain itu, berikan juga teks lengkap yang sudah divokalisasi (harakat lengkap) dan terjemahan bahasa Indonesia untuk keseluruhan teks.

Teks: "${text}"`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
                temperature: 0.2,
            },
        });

        const jsonString = response.text.trim();
        // The model might wrap the JSON in markdown, so we clean it.
        const cleanedJson = jsonString.replace(/^```json\n?/, '').replace(/```$/, '');
        const result = JSON.parse(cleanedJson);
        return result as AnalysisResult;
    } catch (error) {
        console.error("Error analyzing text:", error);
        throw new Error("Gagal menganalisis teks. Silakan coba lagi.");
    }
}

export async function askChatbot(prompt: string, history: ChatMessage[]): Promise<{ text: string, chunks?: any[] }> {
    const model = 'gemini-2.5-flash';
    
    // The Gemini API expects { role, parts: [{ text }] }.
    // Exclude the current user prompt from the history passed to create the chat.
    const geminiHistory = history.slice(0, -1).map(msg => ({ 
        role: msg.role,
        parts: [{ text: msg.text }]
    }));
    
    try {
        const chat = ai.chats.create({
          model,
          history: geminiHistory,
          config: {
            systemInstruction: "Anda adalah asisten AI yang berpengetahuan luas yang berspesialisasi dalam bahasa Arab klasik, studi Islam, dan topik terkait. Gunakan Google Search untuk menjawab pertanyaan tentang peristiwa terkini atau informasi yang tidak ada dalam data pelatihan Anda. Jawab dalam bahasa Indonesia kecuali diminta sebaliknya.",
          },
        });
        
        const response: GenerateContentResponse = await chat.sendMessage({ 
            message: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        const text = response.text;
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

        return { text, chunks };
    } catch (error) {
        console.error("Error with chatbot:", error);
        throw new Error("Maaf, terjadi kesalahan saat berkomunikasi dengan asisten AI.");
    }
}

export async function getQuickResponse(prompt: string): Promise<string> {
    const model = 'gemini-2.5-flash';
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                temperature: 0,
                maxOutputTokens: 100,
            },
        });

        return response.text;
    } catch (error) {
        console.error("Error getting quick response:", error);
        throw new Error("Gagal mendapatkan respons cepat.");
    }
}

export async function generateSampleText(topic: string): Promise<string> {
    const model = 'gemini-2.5-flash';
    const prompt = `Berikan satu contoh teks Arab singkat dan autentik (bisa berupa ayat Al-Quran, kutipan hadis, atau peribahasa Arab) tentang topik "${topic}". Pastikan teksnya tidak terlalu panjang, ideal untuk dianalisis. Kembalikan HANYA teks Arabnya saja, tanpa terjemahan atau penjelasan apa pun.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                temperature: 0.5,
                maxOutputTokens: 150,
            },
        });

        // Clean the response to ensure only the Arabic text is returned
        return response.text.trim().replace(/"/g, '');
    } catch (error) {
        console.error("Error generating sample text:", error);
        throw new Error("Gagal membuat contoh teks. Silakan coba lagi.");
    }
}

export async function generateSpeech(text: string): Promise<string> {
  const model = "gemini-2.5-flash-preview-tts";
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // A suitable voice for Arabic
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data returned from API.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("Gagal menghasilkan audio. Silakan coba lagi.");
  }
}