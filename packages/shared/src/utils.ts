/**
 * Parse template variables from a template string
 * @param template - Template string with variables like {firstName}, {company}
 * @returns Array of variable names
 */
export function parseTemplateVariables(template: string): string[] {
  const regex = /\{([^}]+)\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

/**
 * Replace template variables with actual values
 * @param template - Template string with variables
 * @param data - Object with variable values
 * @returns Personalized string
 */
export function fillTemplate(template: string, data: Record<string, string>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value || '');
  }
  
  return result;
}

/**
 * Validate LinkedIn profile URL
 */
export function isValidLinkedInUrl(url: string): boolean {
  const pattern = /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9-]+\/?$/;
  return pattern.test(url);
}

/**
 * Generate random delay between min and max milliseconds
 */
export function randomDelay(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

/**
 * Format date to YYYY-MM-DD HH:mm:ss
 */
export function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Calculate acceptance rate
 */
export function calculateAcceptanceRate(accepted: number, sent: number): number {
  if (sent === 0) return 0;
  return Math.round((accepted / sent) * 100 * 10) / 10;
}
