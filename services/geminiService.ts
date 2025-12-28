import { GoogleGenAI, Type } from "@google/genai";
import { ThoughtNode, Persona, GroupSummary } from "../types";
import { getRandomMindfulColor } from "../constants";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

/**
 * 1. Analyzes the "Vibe" (Optional, now mostly just returns a mindful color)
 */
export const analyzeSemantics = async (thought: string): Promise<Partial<ThoughtNode>> => {
    // We strictly use the Mindfulness palette now.
    // We don't ask AI for color anymore to maintain aesthetic consistency.
    const color = getRandomMindfulColor();
    return {
        color,
        gradient: `linear-gradient(135deg, ${color}, ${color})`
    };
}

/**
 * Finds semantic connections between a new thought and existing nodes.
 * This is the "Rhizome" logic - finding links where none explicitly exist.
 */
export const findConnections = async (
  newThought: string,
  existingThoughts: ThoughtNode[]
): Promise<{ [id: string]: number }> => {
    if (existingThoughts.length === 0) return {};

    const model = "gemini-2.5-flash";
    // Send a simplified list to save tokens
    const context = existingThoughts.map(t => ({ id: t.id, content: t.content }));

    const prompt = `
      I am adding a new thought to a mind map.
      New Thought: "${newThought}"

      Existing Thoughts: ${JSON.stringify(context)}

      Identify up to 3 existing thoughts that are semantically related, thematically linked, or share a "vibe" with the new thought.
      For each connection, assign a strength score:
      - 0.9-1.0: Very strong semantic connection
      - 0.7-0.8: Strong thematic link
      - 0.5-0.6: Moderate connection
      - 0.3-0.4: Weak but meaningful link

      If nothing is related, return an empty object.

      Return JSON: { "connections": { "id1": 0.8, "id2": 0.5, ... } }
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        connections: {
                            type: Type.OBJECT,
                            additionalProperties: { type: Type.NUMBER }
                        }
                    }
                }
            }
        });
        const res = JSON.parse(response.text || "{}");
        return res.connections || {};
    } catch (e) {
        console.error("Connection search failed", e);
        return {};
    }
};

export const generateSpark = async (thought: string, persona: Persona): Promise<string> => {
  const model = "gemini-2.5-flash"; 
  const prompt = `
    Roleplay as ${persona.name} (${persona.role}). ${persona.description}.
    React to: "${thought}".
    Keep it concise (max 80 words), profound, and strictly in character.
  `;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.9 }
    });
    return response.text || "Thinking...";
  } catch (e) {
    return "The stars are silent.";
  }
};

export const summarizeGroup = async (nodes: ThoughtNode[]): Promise<GroupSummary> => {
    if (nodes.length === 0) return { theme: "Void", description: "Empty space." };

    // Simple keyword-based theme detection
    const contentList = nodes.map(n => n.content.toLowerCase()).join(" ");

    const themePatterns = [
        { keywords: ['ai', 'code', 'tech', 'programming', 'software', 'quantum', 'digital'], theme: 'Technology & Innovation', desc: 'Digital frontiers and technical exploration' },
        { keywords: ['meaning', 'life', 'exist', 'conscious', 'universe', 'think', 'philosophy'], theme: 'Philosophy & Existence', desc: 'Deep questions about reality and consciousness' },
        { keywords: ['art', 'music', 'creat', 'paint', 'write', 'photo', 'dance'], theme: 'Creative Expression', desc: 'Artistic pursuits and creative flow' },
        { keywords: ['nature', 'tree', 'ocean', 'water', 'star', 'mountain', 'climate', 'earth'], theme: 'Nature & Environment', desc: 'Connection with the natural world' },
        { keywords: ['friend', 'love', 'family', 'social', 'relationship', 'empathy', 'lonely'], theme: 'Relationships & Connection', desc: 'Human bonds and social experiences' },
        { keywords: ['health', 'sleep', 'mental', 'exercise', 'meditat', 'wellness', 'therapy'], theme: 'Health & Wellness', desc: 'Mind and body care practices' },
        { keywords: ['work', 'job', 'career', 'skill', 'mentor', 'hustle', 'remote'], theme: 'Career & Growth', desc: 'Professional development and work life' },
        { keywords: ['travel', 'japan', 'hike', 'adventure', 'country', 'explore', 'journey'], theme: 'Travel & Adventure', desc: 'Exploration and wanderlust' },
        { keywords: ['food', 'cook', 'coffee', 'meal', 'pasta', 'bread', 'spice', 'chocolate'], theme: 'Food & Cooking', desc: 'Culinary experiences and gastronomy' },
        { keywords: ['science', 'universe', 'brain', 'learn', 'crispr', 'evolution', 'math', 'space'], theme: 'Science & Learning', desc: 'Scientific discovery and knowledge' },
    ];

    // Count keyword matches for each theme
    let bestMatch = { theme: 'Miscellaneous', desc: 'Diverse unconnected thoughts', score: 0 };

    for (const pattern of themePatterns) {
        let score = 0;
        for (const keyword of pattern.keywords) {
            const regex = new RegExp(keyword, 'gi');
            const matches = contentList.match(regex);
            if (matches) score += matches.length;
        }
        if (score > bestMatch.score) {
            bestMatch = { theme: pattern.theme, desc: pattern.desc, score };
        }
    }

    return { theme: bestMatch.theme, description: bestMatch.desc };
}

export const findRelatedThoughts = async (query: string, thoughts: ThoughtNode[]): Promise<string[]> => {
    const model = "gemini-2.5-flash";
    const thoughtList = thoughts.map(t => ({ id: t.id, content: t.content }));
    const prompt = `
      Query: "${query}"
      Thoughts: ${JSON.stringify(thoughtList)}
      Identify top 5 semantically related thoughts.
      Return JSON: { "relatedIds": string[] }
    `;
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { relatedIds: { type: Type.ARRAY, items: { type: Type.STRING } } }
                }
            }
        });
        const res = JSON.parse(response.text || "{}");
        return res.relatedIds || [];
    } catch (e) {
        return [];
    }
}