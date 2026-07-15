import { GoogleGenAI, Type } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const res = await ai.models.generateContent({
      model: 'gemma-4-31b-it',
      contents: [{ parts: [{ text: "Hello" }] }],
    });
    console.log(res.text);
  } catch (e) {
    console.error(e.message);
  }
}
run();
