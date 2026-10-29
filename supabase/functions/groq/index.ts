const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getEnv(name: string): string | undefined {
  const deno = globalThis as unknown as {
    Deno?: { env?: { get: (key: string) => string | undefined } };
  };
  if (deno.Deno?.env) {
    return deno.Deno.env.get(name);
  }
  const processEnv = globalThis as unknown as {
    process?: { env?: Record<string, string | undefined> };
  };
  if (processEnv.process?.env) {
    return processEnv.process.env[name];
  }
  return undefined;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}) as Record<string, unknown>);
    const messages = body.messages as unknown[];
    const temperature = (body.temperature as number) ?? 0.7;
    const max_tokens = (body.max_tokens as number) ?? 1024;
    const response_format = body.response_format as Record<string, unknown> | undefined;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = getEnv("GROQ_API_KEY") ?? undefined;

    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const groqBody: Record<string, unknown> = {
      model: "llama-3.1-8b-instant",
      messages,
      temperature,
      max_tokens,
    };

    if (response_format) {
      groqBody.response_format = response_format;
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(groqBody),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      console.error("Groq API error:", data);
      return new Response(JSON.stringify({ error: data }), {
        status: groqRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}
