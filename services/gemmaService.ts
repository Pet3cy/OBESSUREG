/// <reference types="vite/client" />
// src/services/gemmaService.ts
import { AnalysisResult, Priority } from '../types';
import { GoogleGenAI, Type, ThinkingLevel, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY });

const OBESSU_CONTEXT = `ORGANIZATIONAL STRUCTURE & PORTFOLIOS (2026):
BOARD MEMBERS:
- Alessandro Di Miceli: Vocational Education & Training (VET), Apprenticeships, Quality Internships.
- Elodie Böhling: Democracy, Student Rights, Civic Space, Participation.
- Ívar Máni Hrannarsson: Social Affairs, Mental Health, Inclusion, Student Well-being.
- Kacper Bogalecki: Organisational Development, Capacity Building, Internal Governance.
- Lauren Bond: Education Policy, EU Advocacy, Research.

SECRETARIAT:
- Rui Teixeira (Secretary General): External Representation, High-level Management.
- Raquel Moreno Beneit (Comms): Digital Presence, Campaigns.
- Panagiotis Chatzimichail (Head of External Affairs): Partnerships, LLLP, Erasmus+.
- Amira Bakr (Policy Assistant): Policy Monitoring, Outreach.
- Francesca Osima (Head of Projects): Operations, Grant Management.
- Daniele Sabato (Coordinator): VET Strategy, Policy Implementation.

STRATEGIC THEMES 2026:
1. VET & Apprenticeships (Quality, Rights, Pay).
2. Inclusive Schools & Mental Health.
3. Digital Rights in Education (AI, Data Privacy).
4. Democratic School Governance.
5. Climate Justice in Education.`;

// System prompt that includes OBESSU context and instructs JSON output
const SYSTEM_PROMPT = `You are the OBESSU Event Analyzer — an internal AI assistant for the Organising Bureau of European School Student Unions (OBESSU) secretariat. Your job is to analyze external event invitations and extract structured data from them.

ORGANIZATIONAL CONTEXT:

${OBESSU_CONTEXT}

PRIORITY SCORING GUIDE:
- High (75–100): Directly aligns with a strategic theme, involves key EU institutions or strategic partners, clear advocacy or networking value for OBESSU
- Medium (40–74): Relevant to a theme but peripheral, or useful for visibility without clear policy impact
- Low (15–39): Marginally related, general education events with limited strategic value
- Irrelevant (0–14): No connection to OBESSU's mandate, themes, or target audience

OUTPUT RULES:
- Return ONLY a valid JSON object. No markdown, no code fences, no explanation before or after.
- If a field cannot be found in the text, use "" or [].
- Never invent dates, links, or deadlines not in the text.
- theme must be one of the 5 strategic themes: "VET & Apprenticeships", "Inclusive Schools & Mental Health", "Digital Rights in Education", "Democratic School Governance", "Climate Justice in Education", or "General Education" if none fit.
- suggestedRepresentative must be one of the 11 people listed in the Board Members or Secretariat above. Choose the most relevant person based on portfolios and event focus.`;

function extractJSON(rawText: string): any {
  try { return JSON.parse(rawText.trim()); } catch {}
  
  const stripped = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try { return JSON.parse(stripped); } catch {}
  
  const matchArray = rawText.match(/\[[\s\S]*\]/);
  if (matchArray) {
    try { return JSON.parse(matchArray[0]); } catch {}
  }

  const matchObj = rawText.match(/\{[\s\S]*\}/);
  if (matchObj) {
    try { return JSON.parse(matchObj[0]); } catch {}
  }
  
  console.error("Failed to parse JSON. Full raw text:", rawText);
  throw new Error('Could not extract valid JSON from model response. Raw: ' + rawText.substring(0, 500));
}

export interface AnalysisInput {
  text?: string;
  fileData?: {
    mimeType: string;
    data: string;
  };
}

export const analyzeInvitation = async (input: AnalysisInput): Promise<AnalysisResult[]> => {
  let contents: any;

  if (input.fileData) {
    contents = {
      parts: [
        {
          inlineData: {
            mimeType: input.fileData.mimeType,
            data: input.fileData.data,
          },
        },
        {
          text: "Analyze this document or image as an event invitation. Extract ALL events mentioned. If it's an email, extract headers.",
        },
      ],
    };
  } else if (input.text) {
    const MAX_CHARS = 500000; // Limit to prevent exceeding 1M tokens
    const truncatedText = input.text.length > MAX_CHARS 
      ? input.text.slice(0, MAX_CHARS) + "\n\n[TRUNCATED DUE TO LENGTH LIMITS]"
      : input.text;
    contents = `Analyze the following text, document, or spreadsheet (which may contain multiple events). Extract ALL events mentioned:\n\n${truncatedText}`;
  } else {
    throw new Error('No input provided');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sender: { type: Type.STRING, description: "name of the sender" },
              senderEmail: { type: Type.STRING, description: "email, if available" },
              subject: { type: Type.STRING, description: "email subject, if available" },
              institution: { type: Type.STRING, description: "organizing body" },
              eventName: { type: Type.STRING },
              theme: { type: Type.STRING, description: "MUST be one of: 'VET & Apprenticeships', 'Inclusive Schools & Mental Health', 'Digital Rights in Education', 'Democratic School Governance', 'Climate Justice in Education', or 'General Education'" },
              description: { type: Type.STRING, description: "concise summary" },
              priority: { type: Type.STRING, description: "'High', 'Medium', 'Low', or 'Irrelevant'" },
              priorityScore: { type: Type.NUMBER, description: "0-100" },
              priorityReasoning: { type: Type.STRING, description: "1-2 sentences" },
              date: { type: Type.STRING, description: "YYYY-MM-DD" },
              time: { type: Type.STRING, description: "HH:MM, time of the event if available" },
              venue: { type: Type.STRING },
              initialDeadline: { type: Type.STRING, description: "YYYY-MM-DD, registration deadline if any" },
              finalDeadline: { type: Type.STRING, description: "YYYY-MM-DD, final deadline to confirm" },
              suggestedRepresentative: { type: Type.STRING, description: "MUST be one of: Alessandro Di Miceli, Elodie Böhling, Ívar Máni Hrannarsson, Kacper Bogalecki, Lauren Bond, Rui Teixeira, Raquel Moreno Beneit, Panagiotis Chatzimichail, Amira Bakr, Francesca Osima, Daniele Sabato" },
              linkedActivities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "list of related OBESSU projects/documents" },
              registrationLink: { type: Type.STRING, description: "URL if present" },
              programmeLink: { type: Type.STRING, description: "URL if present" },
            },
            required: [
              "sender", "senderEmail", "subject", "institution", "eventName", 
              "theme", "description", "priority", "priorityScore", "priorityReasoning", 
              "date", "time", "venue", "initialDeadline", "finalDeadline", 
              "suggestedRepresentative", "linkedActivities", "registrationLink", "programmeLink"
            ],
          },
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
       throw new Error('openclaw returned an empty response.');
    }

    let parsed;
    try {
      parsed = extractJSON(rawText);
    } catch (e: any) {
      throw new Error(`Failed to parse JSON from model response: ${e.message}`);
    }

    // Map to our AnalysisResult type (with enum for priority)
    const results = (Array.isArray(parsed) ? parsed : [parsed]).map((item: any) => ({
      ...item,
      priority: item.priority as Priority,
      linkedActivities: item.linkedActivities || [],
    }));

    // Enrich institution details
    const enrichedResults = await Promise.all(results.map(async (item) => {
      try {
        const details = await researchOrganization(item.institution);
        return { ...item, institutionDetails: details.text };
      } catch (e) {
        console.error(`Failed to research institution ${item.institution}:`, e);
        return item;
      }
    }));

    return enrichedResults;
  } catch (error: any) {
    console.error("analyzeInvitation error:", error);
    throw new Error(error.message || 'An unexpected error occurred during analysis.');
  }
};

export const generateBriefing = async (event: any): Promise<{ briefing: string, actionableInsights: string[] }> => {
  const prompt = `Create a 1-page executive briefing for a representative attending the following event:
Event: ${event.analysis.eventName}
Institution: ${event.analysis.institution}
Theme: ${event.analysis.theme}
Context: ${event.analysis.description}
Linked Activities: ${event.analysis.linkedActivities.join(', ')}

${OBESSU_CONTEXT}

Include:
1. Key Objectives for OBESSU
2. Potential 'Red Lines' (What to avoid)
3. Key Stakeholders likely present
4. Suggested opening statement points.
5. Actionable Insights based on OBESSU's 2026 Strategic Priorities (VET, Mental Health, Digital Rights, Active Citizenship, Youth Policy).

Return a JSON object with this exact structure:
{
  "briefing": "The full briefing text...",
  "actionableInsights": ["Actionable Insight 1", "Actionable Insight 2"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            briefing: { type: Type.STRING },
            actionableInsights: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["briefing", "actionableInsights"]
        },
      },
    });

    if (!response.text) {
       throw new Error('openclaw returned an empty response.');
    }
    
    let parsed;
    try {
      parsed = extractJSON(response.text);
    } catch (e: any) {
      throw new Error(`Failed to parse JSON from model response: ${e.message}`);
    }
    
    return parsed;
  } catch (error: any) {
    console.error("generateBriefing error:", error);
    throw new Error(error.message || 'An unexpected error occurred during briefing generation.');
  }
};

export const generateBulkBriefing = async (events: any[]): Promise<{ briefing: string, actionableInsights: string[] }> => {
  const eventsSummary = events.map(event => `
Event: ${event.analysis.eventName}
Institution: ${event.analysis.institution}
Theme: ${event.analysis.theme}
Context: ${event.analysis.description}
`).join('\n\n');

  const prompt = `Create a 1-page consolidated executive briefing for a representative attending the following multiple events:
${eventsSummary}

${OBESSU_CONTEXT}

Include:
1. Consolidated Key Objectives for OBESSU across all events
2. Potential 'Red Lines' (What to avoid)
3. Key Stakeholders likely present across all events
4. Suggested opening statement points that tie these events together.

Also, provide 3-5 key takeaways or action points derived from the briefing and event details.

Return a JSON object with this exact structure:
{
  "briefing": "The full briefing text...",
  "actionableInsights": ["Action point 1", "Action point 2"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            briefing: { type: Type.STRING },
            actionableInsights: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["briefing", "actionableInsights"]
        },
      },
    });

    if (!response.text) {
       throw new Error('openclaw returned an empty response.');
    }
    
    let parsed;
    try {
      parsed = extractJSON(response.text);
    } catch (e: any) {
      throw new Error(`Failed to parse JSON from model response: ${e.message}`);
    }
    
    return parsed;
  } catch (error: any) {
    console.error("generateBulkBriefing error:", error);
    throw new Error(error.message || 'An unexpected error occurred during bulk briefing generation.');
  }
};

export const summarizeFollowUp = async (event: any, notes: string): Promise<string> => {
  const prompt = `Summarize the following follow-up notes for the event "${event.analysis.eventName}":\n\n${notes}

${OBESSU_CONTEXT}

Provide a concise summary of outcomes, key contacts made, and follow-up tasks relevant to OBESSU's strategic themes.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    if (!response.text) {
       throw new Error('openclaw returned an empty response.');
    }
    return response.text;
  } catch (error: any) {
    console.error("summarizeFollowUp error:", error);
    throw new Error(error.message || 'An unexpected error occurred during summarization.');
  }
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("generateSpeech error:", error);
    return undefined;
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Audio,
            },
          },
          {
            text: "Transcribe the following audio accurately.",
          },
        ],
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("transcribeAudio error:", error);
    throw new Error("Failed to transcribe audio.");
  }
};

export const chatWithAssistant = async (message: string, history: {role: string, text: string}[]): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: "You are an AI assistant for OBESSU. Help the user with tasks related to event management, contacts, and strategic alignment. " + OBESSU_CONTEXT,
      },
    });
    
    // In a real app we'd pass history to the chat creation, but for simplicity we'll just send the message
    // If we want to use history, we'd need to map it to the correct format, but the SDK handles it differently.
    // For now, let's just send the message with context.
    const contextStr = history.map(h => `${h.role}: ${h.text}`).join('\n');
    const fullMessage = history.length > 0 ? `Previous conversation:\n${contextStr}\n\nUser: ${message}` : message;
    
    const response = await chat.sendMessage({ message: fullMessage });
    return response.text || "";
  } catch (error) {
    console.error("chatWithAssistant error:", error);
    throw new Error("Failed to get response from assistant.");
  }
};

export const searchLocation = async (query: string): Promise<{text: string, urls: string[]}> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find information about the following location or venue: ${query}. Provide details about its accessibility, nearby transport, and suitability for an event.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const urls: string[] = [];
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          urls.push(chunk.web.uri);
        }
      });
    }
    
    return {
      text: response.text || "",
      urls
    };
  } catch (error) {
    console.error("searchLocation error:", error);
    throw new Error("Failed to search location.");
  }
};

export const researchOrganization = async (query: string): Promise<{text: string, urls: string[]}> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Research the following organization or event: ${query}. Provide a brief summary of their recent activities and relevance to OBESSU.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const urls: string[] = [];
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          urls.push(chunk.web.uri);
        }
      });
    }
    
    return {
      text: response.text || "",
      urls
    };
  } catch (error) {
    console.error("researchOrganization error:", error);
    throw new Error("Failed to research organization.");
  }
};
