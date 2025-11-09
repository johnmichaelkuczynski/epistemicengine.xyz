import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// Initialize AI clients
// Use Replit AI Integrations for Anthropic (no personal API key needed)
const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// DeepSeek client (OpenAI-compatible API)
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

export type AIProvider = "anthropic" | "openai" | "deepseek";

interface AICompletionOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

// Utility to clean AI responses that might have markdown code fences
function cleanJSONResponse(response: string): string {
  // Remove markdown code fences if present
  let cleaned = response.trim();
  
  // Match ```json...``` or ```...```
  const codeBlockMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }
  
  return cleaned;
}

export async function getAICompletion(
  options: AICompletionOptions,
  preferredProvider: AIProvider = "anthropic"
): Promise<string> {
  const { systemPrompt, userPrompt, temperature = 0.7, maxTokens = 4096 } = options;

  // Define provider chain: Anthropic → OpenAI → DeepSeek
  const providerChain: AIProvider[] = ["anthropic", "openai", "deepseek"];
  
  // Start with preferred provider, then try others in order
  const sortedProviders = [
    preferredProvider,
    ...providerChain.filter(p => p !== preferredProvider)
  ];

  let lastError: Error | null = null;

  for (const provider of sortedProviders) {
    try {
      console.log(`Attempting AI completion with provider: ${provider}`);
      
      switch (provider) {
        case "anthropic":
          return await getAnthropicCompletion(systemPrompt, userPrompt, temperature, maxTokens);
        case "openai":
          return await getOpenAICompletion(systemPrompt, userPrompt, temperature, maxTokens);
        case "deepseek":
          return await getDeepSeekCompletion(systemPrompt, userPrompt, temperature, maxTokens);
      }
    } catch (error) {
      console.error(`Provider ${provider} failed:`, error);
      lastError = error as Error;
      // Continue to next provider
    }
  }

  // All providers failed
  console.error("All AI providers failed");
  throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
}

async function getAnthropicCompletion(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    // Clean any markdown code fences
    return cleanJSONResponse(content.text);
  }
  
  throw new Error("Unexpected response format from Anthropic");
}

async function getOpenAICompletion(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  // Clean any markdown code fences
  return cleanJSONResponse(content);
}

async function getDeepSeekCompletion(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const completion = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from DeepSeek");
  }

  // Clean any markdown code fences
  return cleanJSONResponse(content);
}
