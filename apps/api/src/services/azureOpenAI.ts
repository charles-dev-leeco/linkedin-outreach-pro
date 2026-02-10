import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import type { TemplateGenerationRequest } from '@linkedin-outreach-pro/shared';

const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
const apiKey = process.env.AZURE_OPENAI_API_KEY!;
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';

const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));

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

  userPrompt += `\n\nFormat your response as a JSON array of strings only. Example:
[
  "Template 1 text here with {firstName} variable",
  "Template 2 text here with {company} variable",
  "Template 3 text here"
]`;

  try {
    const response = await client.getChatCompletions(deploymentName, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.8,
      maxTokens: 1000,
      topP: 0.95,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Azure OpenAI');
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Azure OpenAI');
    }

    const templates = JSON.parse(jsonMatch[0]) as string[];
    
    // Validate templates
    if (!Array.isArray(templates) || templates.length === 0) {
      throw new Error('Invalid templates format');
    }

    // Ensure each template is under 300 characters
    return templates.map(t => t.substring(0, 300));
  } catch (error) {
    console.error('Azure OpenAI error:', error);
    throw new Error('Failed to generate templates');
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

Please provide ONLY the refined template text, nothing else.`;

  try {
    const response = await client.getChatCompletions(deploymentName, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.7,
      maxTokens: 300,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No response from Azure OpenAI');
    }

    return content.substring(0, 300);
  } catch (error) {
    console.error('Azure OpenAI error:', error);
    throw new Error('Failed to refine template');
  }
}
