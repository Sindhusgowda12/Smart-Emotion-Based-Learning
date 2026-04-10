import { GoogleGenAI, Type } from "@google/genai";
import { Emotion } from "../types";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in the environment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function detectEmotionFromImage(base64Image: string): Promise<Emotion> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Analyze the student's facial expression in this image and return their primary emotion. Choose from: happy, sad, angry, surprised, neutral, confused, bored, focused. Return ONLY the emotion word." },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(",")[1] || base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "text/plain",
      },
    });

    const emotion = response.text?.trim().toLowerCase() as Emotion;
    const validEmotions: Emotion[] = ['happy', 'sad', 'angry', 'surprised', 'neutral', 'confused', 'bored', 'focused'];
    
    if (validEmotions.includes(emotion)) {
      return emotion;
    }
    return 'neutral';
  } catch (error) {
    console.error("Error detecting emotion:", error);
    return 'neutral';
  }
}

export async function getAdaptiveContentSuggestion(emotion: Emotion, currentTopic: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The student is currently learning about "${currentTopic}" and is feeling "${emotion}". 
      Provide a short, encouraging message and a suggestion on how to proceed. 
      If they are bored, suggest a challenge. 
      If they are confused, suggest a simpler explanation. 
      If they are focused, suggest moving to the next level.
      Keep it brief and supportive.`,
    });

    return response.text || "Keep going! You're doing great.";
  } catch (error) {
    console.error("Error getting adaptive suggestion:", error);
    return "Keep going! You're doing great.";
  }
}

export async function getTopicRecommendation(emotions: Emotion[], completedTopics: string[]): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the student's recent emotional states: ${emotions.join(', ')}.
      And their completed topics: ${completedTopics.join(', ')}.
      Suggest one specific topic they should learn next to stay engaged and challenged.
      Return ONLY the topic name (e.g., "Advanced Algebra", "Creative Writing", "World History").`,
    });

    return response.text?.trim() || "General Science";
  } catch (error) {
    console.error("Error getting recommendation:", error);
    return "General Science";
  }
}

export async function getAdaptiveLessonTweak(emotion: Emotion, topic: string, currentContent: string): Promise<{ type: 'explanation' | 'challenge' | 'encouragement'; content: string }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The student is learning about "${topic}". 
      Current lesson content: "${currentContent.substring(0, 500)}..."
      The student is feeling "${emotion}".
      
      Based on this emotion, generate a small supplementary content block:
      - If 'confused': Provide a "Simplified Breakdown" of a key concept.
      - If 'bored': Provide a "Quick Challenge" or "Fun Fact" to re-engage them.
      - If 'focused': Provide a "Pro Tip" or "Deep Dive" into a related advanced concept.
      - Otherwise: Provide a "Motivation Boost".
      
      Return the response in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['explanation', 'challenge', 'encouragement'] },
            content: { type: Type.STRING, description: "The markdown content for the adaptive block." },
          },
          required: ["type", "content"],
        },
      },
    });

    return JSON.parse(response.text || '{"type": "encouragement", "content": "Keep going!"}');
  } catch (error) {
    console.error("Error getting adaptive tweak:", error);
    return { type: 'encouragement', content: "You're doing great! Take a deep breath and keep exploring." };
  }
}

export async function generateLearningContent(topic: string): Promise<{ title: string; body: string }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short learning module about "${topic}". 
      Include a title and a body in Markdown format. 
      The content should be educational and engaging.
      IMPORTANT: Use actual newline characters (\n) for formatting, not literal "\\n" strings. 
      Ensure proper markdown structure with headings, paragraphs, and lists.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            body: { type: Type.STRING },
          },
          required: ["title", "body"],
        },
      },
    });

    return JSON.parse(response.text || '{"title": "Error", "body": "Could not generate content."}');
  } catch (error) {
    console.error("Error generating content:", error);
    const errorMessage = error instanceof Error && error.message.includes('quota') 
      ? "The AI is currently busy (quota exceeded). Please try again in a few minutes or try a different topic."
      : "Could not generate content. Please check your connection and try again.";
    return { title: "Error", body: errorMessage };
  }
}
