import { supabase } from "@/db/supabase";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqOptions {
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
}

export interface GroqResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

/**
 * Calls the `groq` Edge Function with a chat completion request.
 * Throws when Supabase is not configured or the function reports an error,
 * so callers can fall back to locally generated content.
 */
export async function callGroq(
  messages: ChatMessage[],
  options: GroqOptions = {},
): Promise<GroqResponse> {
  if (!supabase) {
    throw new Error("Supabase is not configured (see .env.example)");
  }

  const { data, error } = await supabase.functions.invoke("groq", {
    body: { messages, ...options },
  });

  if (error) {
    // The response body, when available, explains why the function failed.
    const body: string | undefined = await Promise.resolve(error.context?.text?.()).catch(
      () => undefined,
    );
    throw new Error(`Groq edge function error: ${body ?? error.message}`);
  }

  return data as GroqResponse;
}

/** Extracts the generated text from a completion response. */
export function extractGroqContent(response: GroqResponse): string {
  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned empty content");
  }
  return content;
}
