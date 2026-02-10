import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TemplateGenerationRequest } from '@linkedin-outreach-pro/shared';

// Lazy initialization to ensure env vars are loaded
let genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

function getModelName() {
  return process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash';
}

export async function generateTemplates(request: TemplateGenerationRequest): Promise<string[]> {
  const { goal, targetAudience, tone, keyPoints, existingTemplates, feedback } = request;

  const systemPrompt = `You are an expert at crafting personalized LinkedIn connection request messages.
Your goal is to help users connect with their target audience in an authentic, professional way.

Guidelines:
- Maximum 300 characters per message
- Use placeholders: {firstName}, {lastName}, {company}, {role}
- Be genuine and personal, not spammy
- Include clear value proposition
- End with subtle call-to-action
- Avoid generic phrases like "I'd love to connect" or "Looking forward to connecting"`;

  let userPrompt = `Generate 3 distinct LinkedIn connection request message templates.

Campaign Context:
- Goal: ${goal}
- Target Audience: ${targetAudience}
- Tone: ${tone}`;

  if (keyPoints) {
    userPrompt += `\n- Key Points to Include: ${keyPoints}`;
  }

  if (existingTemplates && existingTemplates.length > 0) {
    userPrompt += `\n\nExisting templates (for reference, create different variations):\n${existingTemplates.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
  }

  if (feedback) {
    userPrompt += `\n\nUser Feedback: ${feedback}\n\nPlease regenerate the templates based on this feedback.`;
  }

  userPrompt += `\n\nIMPORTANT: Return ONLY a JSON array of strings. No explanations, no markdown. Just the array.
Example format:
["Template 1 text here with {firstName} variable", "Template 2 text here with {company} variable", "Template 3 text here"]`;

  try {
    const model = getGenAI().getGenerativeModel({ model: getModelName() });

    const result = await model.generateContent([
      systemPrompt,
      userPrompt,
    ]);

    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error('No response from Google Gemini');
    }

    // Try to extract JSON array from the response
    let jsonMatch = content.match(/\[[\s\S]*\]/);
    
    // If no match, try removing markdown code blocks
    if (!jsonMatch) {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    }

    if (!jsonMatch) {
      throw new Error('Invalid response format from Google Gemini');
    }

    const templates = JSON.parse(jsonMatch[0]) as string[];
    
    // Validate templates
    if (!Array.isArray(templates) || templates.length === 0) {
      throw new Error('Invalid templates format');
    }

    // Ensure each template is under 300 characters
    return templates.map(t => t.substring(0, 300));
  } catch (error) {
    console.error('Google Gemini error:', error);
    throw new Error('Failed to generate templates: ' + (error as Error).message);
  }
}

export async function refineTemplate(
  template: string,
  feedback: string,
  context: Partial<TemplateGenerationRequest>
): Promise<string> {
  const systemPrompt = `You are refining a LinkedIn connection request message based on user feedback.
Keep the message under 300 characters and maintain the tone and purpose.`;

  const userPrompt = `Original template:
"${template}"

User feedback: ${feedback}

Context:
- Goal: ${context.goal}
- Target Audience: ${context.targetAudience}
- Tone: ${context.tone}

Please provide ONLY the refined template text, nothing else. No explanations, no quotes, just the template.`;

  try {
    const model = getGenAI().getGenerativeModel({ model: getModelName() });

    const result = await model.generateContent([
      systemPrompt,
      userPrompt,
    ]);

    const response = await result.response;
    const content = response.text().trim();

    if (!content) {
      throw new Error('No response from Google Gemini');
    }

    // Remove quotes if present
    let refined = content.replace(/^["']|["']$/g, '');
    
    // Ensure under 300 characters
    return refined.substring(0, 300);
  } catch (error) {
    console.error('Google Gemini error:', error);
    throw new Error('Failed to refine template: ' + (error as Error).message);
  }
}
