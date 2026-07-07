model call failed (exit 1): Error: unexpected response from the server: 413 Request Entity Too Large
{"error":{"code":"tokens_limit_reached","message":"Request body too large for gpt-5 model. Max size: 4000 tokens.","details":"Request body too large for gpt-5 model. Max size: 4000 tokens."}}

Usage:
  gh models run [model] [prompt] [flags]

Examples:
gh models run openai/gpt-4o-mini "how many types of hyena are there?"
gh mo