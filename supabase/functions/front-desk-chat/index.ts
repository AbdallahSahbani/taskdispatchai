import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = `You are an AI assistant embedded in a hotel Property Management System (PMS) front desk.
You have full access to live reservation, room, and folio data (provided below as JSON).
Answer the front-desk agent's natural-language questions concisely and accurately.

When the user's request implies they should view a specific tab, include a navigation hint by calling the navigate tool.
Available tabs: "arrivals", "inhouse", "departures", "rooms", "ooo", "thirdparty", "types", "all".

Rules:
- Be brief: 1-3 sentences max unless listing items.
- When answering payment questions, state the method, status and balance.
- When asked "did X pay" — find matching guest by partial name match.
- When listing rooms, format like: 412 (DLK, vacant_clean).
- Today's date is ${new Date().toISOString().slice(0, 10)}.

LIVE DATA:
${JSON.stringify(context).slice(0, 60000)}`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'navigate_to_tab',
              description: 'Switch the front-desk UI to a specific tab to show the user the relevant data.',
              parameters: {
                type: 'object',
                properties: {
                  tab: {
                    type: 'string',
                    enum: ['arrivals', 'inhouse', 'departures', 'rooms', 'ooo', 'thirdparty', 'types', 'all'],
                  },
                  reason: { type: 'string' },
                },
                required: ['tab'],
              },
            },
          },
        ],
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limited' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: 'Credits exhausted' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error('AI gateway error', resp.status, t);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const choice = data.choices?.[0]?.message;
    const reply: string = choice?.content || '';
    let navigateTo: string | undefined;
    const toolCalls = choice?.tool_calls;
    if (Array.isArray(toolCalls) && toolCalls.length > 0) {
      for (const tc of toolCalls) {
        if (tc.function?.name === 'navigate_to_tab') {
          try {
            const args = JSON.parse(tc.function.arguments || '{}');
            if (args.tab) navigateTo = args.tab;
          } catch { /* ignore */ }
        }
      }
    }

    return new Response(
      JSON.stringify({ reply: reply || 'Done.', navigateTo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('front-desk-chat error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
