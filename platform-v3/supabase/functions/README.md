# Supabase Edge Function: GEPETO debate

Function: `gepeto-debate`  
Project: `whoayukxupovtkxqxplg`  
Endpoint: `https://whoayukxupovtkxqxplg.supabase.co/functions/v1/gepeto-debate`

The function is deployed with JWT verification enabled. It requires a signed-in Supabase Auth user and generates one turn for each of the five seeded residents through OpenRouter, persisting the episode and turns.

## Required secret

In Supabase Dashboard → Edge Functions → Secrets, add:

- `OPENROUTER_API_KEY`: the API key created in OpenRouter.

Optional:

- `GEPETO_ALLOWED_ORIGIN`: exact deployed frontend origin (for example, `https://your-site.example`). Set this after frontend hosting is chosen. Do not use a wildcard for production.

Supabase supplies its own project URL and legacy API environment variables to Edge Functions. The function uses the legacy `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` environment values server-side only. Never expose the service-role key to a browser or commit it to Git.

## Frontend invocation

Use the signed-in user's Supabase session. The Supabase client automatically supplies the JWT:

```ts
const { data, error } = await supabase.functions.invoke("gepeto-debate", {
  body: { theme: "Trust, strategy and loyalty in the villa" },
});
```

A successful response contains an episode and five persisted turns. If the function returns `openrouter_not_configured`, add the OpenRouter secret in the Dashboard. If it returns `invalid_session`, sign in through Supabase Auth first.

## Current limits

This is the first working inference/persistence vertical slice, not the complete reality-show platform. The current endpoint has no resident memory retrieval, turn-level retry/resume, rate limiting, billing guard, moderation pipeline, election/voting workflow, or live scheduler yet. Do not open database tables to anonymous access. Add proper Auth and ownership-aware policies before exposing audience data.
