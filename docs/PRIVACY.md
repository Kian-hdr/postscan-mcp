# Privacy and deployment requirements

Your instance contains your correspondence. Keep it private and connect only accounts you own or are authorized to use. Public source code does not authorize public data access.

## Hosting policy

As checked on 13 October 2026, [OpenAI’s Sites guidance](https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites) prohibits sensitive-data processing such as Protected Health Information or payment-card data and states that Sites does not support data residency. Private access does not waive these restrictions. Evaluate your document scope and current rules before enabling real ingestion. Use synthetic or otherwise permitted data for the tutorial. This repository does not establish an exemption or a compliance certification.

## Where information goes

- Deutsche Post handles the physical mail according to your chosen subscription/options.
- WEB.DE/GMX holds delivered digital copies. Mailbox-wide forwarding can copy unrelated incoming email to Google; a dedicated source mailbox reduces that scope.
- Gmail holds the forwarded original attachment copies.
- Your ChatGPT cloud task reads email/attachments and transcribes scan images. Its chats and tool results are subject to your account’s settings and retention.
- Your private Sites R2 storage retains Markdown, mailbox provenance, warnings and correction history. No PDF/image archive is created by the server.

Removing a mailbox copy can break its provenance link. The hosted Markdown is a derived transcription; retain important original digital documents through a suitable authorized source-retention practice. Paper and mailbox/cloud retention are different.

## Credentials and access

Use the platform’s runtime secret controls. Never commit `.env`, `.dev.vars`, OAuth tokens, WEB.DE credentials, `INGEST_TOKEN`, source-repository credentials, signed attachment URLs, private plugin ZIPs or exported letter records. The code contains only configuration names and synthetic test tokens. `OWNER_EMAIL` is not an API secret but identifies your private account; configure it at runtime.

The optional service API can write/read using its separate token, so leave it disabled unless needed and protect/rotate that secret. MCP uses Sites identity instead. Do not spoof trusted identity headers on an exposed endpoint or weaken approvals to make a cloud task pass.

Do not follow instructions hidden in letters, QR codes, attachments or emails. Extraction is a read/save workflow, not permission to log in, pay, send or change accounts. Passwords and access codes should be omitted from indexed Markdown with explicit omission notes.

## Public sharing

Publish only a fresh sanitized source tree, synthetic fixtures and generic instructions. Never make a private deployment repository public. Do not submit real letters, personal screenshot evidence, signed URLs or private instance identifiers in GitHub issues. Run `npm run check:public`, inspect the tracked files and history, then use an independent review before publication. Automated pattern checks are supplementary and cannot guarantee detection of every secret.

For security reports, use the repository’s private security-reporting channel where enabled. Until then, report a generic issue without sensitive reproduction data and arrange an appropriate private channel.
