import { GoogleGenAI, Type } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const res = await ai.models.generateContent({
      model: 'gemma-4-31b-it',
      contents: "Hello",
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.OBJECT, properties: { message: { type: Type.STRING } } }
      }
    });
    console.log(res.text);
  } catch (e) {
    console.error(e);
  }
}
run();
