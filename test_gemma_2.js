import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const res = await ai.models.generateContent({
      model: 'gemma-2-27b-it',
      contents: "Hello",
    });
    console.log(res.text);
  } catch (e) {
    console.error(e.message);
  }
}
run();
