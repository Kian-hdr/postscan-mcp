# Set up your own private Postscan MCP

This tutorial creates your own deployment. It does not connect to the author’s instance, reuse a shared plugin or require the author’s credentials. Start with synthetic data and review [PRIVACY.md](PRIVACY.md) before real mail.

## 1. Prepare the postal service and mailbox

1. Read the [POSTSCAN product page](https://www.deutschepost.de/de/p/postscan.html) and [official FAQ](https://www.deutschepost.de/de/p/postscan/haeufige-fragen.html), including scanning exclusions, paper disposal and paid retention options.
2. Order through the [official shop](https://shop.deutschepost.de/postscan). Verify your German address with the mailed AdressTAN and choose the start date.
3. Configure optional delivery to your own WEB.DE or GMX address and confirm the provider’s activation link. This tutorial’s tested relay path uses WEB.DE.
4. Prefer a dedicated mailbox because WEB.DE’s permanent forwarding applies to the mailbox, not only POSTSCAN.

If using WEB.DE: initials → **E-Mail-Einstellungen** → **E-Mail empfangen** → **Weiterleitung** → **Dauerhaft weiterleiten**. Enter your own Gmail destination, enable **Kopie im Postfach behalten**, save, then confirm the activation link in the destination mailbox. Follow [WEB.DE’s current instructions](https://hilfe.web.de/email/einstellungen/weiterleitung-einrichten.html). This shares copies of all forwarded incoming mail with Google; decide whether that fits your needs before activation.

Forwarding covers future mail. For history, search all relevant WEB.DE folders, identify original POSTSCAN scan messages and [forward those existing messages](https://hilfe.web.de/email/schreiben-und-senden/email-weiterleiten.html) with their original attachments. Verify Gmail receives them. Keep originals, attachment filenames and original receipt dates. Exclude service activation/security notices that do not contain a letter. A sent copy and an original represent the same letter.

## 2. Obtain the source and check it

Clone this repository or download its source ZIP. Use a fresh folder, not a copy of someone’s private deployment history.

```bash
git clone https://github.com/Kian-hdr/postscan-mcp.git
cd postscan-mcp
npm ci
npm run build
npm test
npm run check:public
```

All test inputs are synthetic. The pinned PDF decoder is deliberate; see [ARCHITECTURE.md](ARCHITECTURE.md) before upgrading it. No mailbox password or Google token belongs in the code, Git history or a chat prompt.

## 3. Create and publish a private ChatGPT Site

Sites and its generated-plugin workflow are account-dependent. Read the [official plugin-hosting guide](https://help.openai.com/en/articles/20001547-hosting-a-plugin-with-chatgpt-sites). If the feature is unavailable, stop rather than improvising a local tunnel and calling it cloud hosting.

For the complete agent-led workflow, copy [SETUP_PROMPT.md](SETUP_PROMPT.md) into your task. It covers deployment, mailbox relay, historical backfill, cloud scheduling and verification.

Open the cloned folder in Codex with the Sites plugin available. For deployment alone, give it this shorter instruction:

> Deploy the source in this folder as my own owner-private ChatGPT Site called Postscan. Use the Sites supported source and publication workflow. Do not reuse an existing project ID from another account. Preserve the R2 BUCKET binding and MCP capability. Configure OWNER_EMAIL using the exact authenticated account email that Sites sends. Keep runtime secrets outside source and Git. Build and run the synthetic tests, publish privately, install/connect the generated plugin, then test its native tools. Do not configure mail forwarding or schedules until I choose my source account.

The included manifest intentionally omits `project_id`. Create the Site once and persist the **exact returned project ID** in `.openai/hosting.json`; use the supported Sites helper or:

```bash
node scripts/configure-site.mjs YOUR_RETURNED_PROJECT_ID
```

Never invent an ID. Reuse your own saved ID for later updates. The deployed manifest uses `r2: "BUCKET"` and `capabilities: ["mcp"]`. The included build emits `worker/index.js` and `dist/server/index.js`.

Configure these runtime values through the Site’s environment/secrets controls:

| Name | Required? | Value |
| --- | --- | --- |
| `OWNER_EMAIL` | Yes | The exact email associated with your trusted Sites identity |
| `INGEST_TOKEN` | Only for optional `/v1/*` service API | A fresh random secret of at least 32 characters; use a secret-input flow |

Native MCP ingestion and import-check tools use your Sites identity and **do not require `INGEST_TOKEN`**. Leaving it unset disables service-token API access. Do not set a synthetic test token on a live Site. Connected Gmail credentials are managed by ChatGPT, not stored in Sites.

Use Sites’ supported source helper to commit/push the checked source to the Site-bound repository, package build output, then save/deploy the matching commit and archive through its private publishing tool. A ZIP of the repository alone is not a deployed Worker. The platform owns its provisioning credentials: pass them through its hidden secret/stdin flow and never paste them into files or shell arguments. These tools are provided by the installed Sites plugin, not a stand-alone CLI included here.

After publication, keep access **owner-private**. Publishing the source repository does not mean making your deployed Site public. Install or connect the generated plugin under **Plugins → Personal → Created by you**. Each reader must create their own Site and plugin; the author’s plugin is not a shared service.

## 4. Test the server before mail import

Use native Postscan tools:

1. `postscan_health`: an empty instance should report unknown/stale source access, not “no new mail.”
2. `postscan_save_transcription`: save the fake record from `examples/synthetic-letter.json` after inspecting its known synthetic content. Fetch it and verify exact text, page count and source reference.
3. Repeat the identical write: it must be idempotent. A conflicting retry must not overwrite a ready record.
4. Search/fetch/passage: follow every returned cursor/offset until completion.
5. Check anonymous and wrong-account access fails. Do not spoof identity headers on the live deployment.
6. Check `/icon.png` and MCP initialization advertise the icon. The platform may cache it. Some managed Sites app listings retain their platform default despite accepted icon metadata; verify actual rendering. See step 7 below for the supported package fields.

The synthetic record remains synthetic. Do not misrepresent it as a postal delivery or a real source-access check. Test review correction using the fetched expected Markdown hash; complete ready records are not editable through ingestion retries.

## 5. Connect Gmail and backfill permitted letters

Connect your own intended Gmail account to ChatGPT. Confirm the task can read that specific account. Never assume the Site borrows a visitor’s app connection.

In an interactive cloud run, give ChatGPT the [import prompt](IMPORT_PROMPT.md), replacing `YOUR_GMAIL_ADDRESS` with your own destination. Ensure it lists all history, matches attachment filenames, reads all pages and saves full Markdown rather than only summaries. Use an authorized permitted or synthetic image-only PDF to test scan reading; a selectable-text PDF alone does not establish OCR success.

Fetch the resulting record and check every page against the source. Check dates, amounts and tables carefully. A page count alone is not proof the text is complete. An unreadable page, codec limit or uncertain layout belongs in a review record with a reason. An inline preview often contains only the first page. For a generic standalone image, pass a stable effective `original_filename` such as `gmail-MESSAGE_ID--image.jpg` to both lookup and save. Record the actual attachment filename `image.jpg` and its source message ID in the Markdown. The server deduplicates this effective filename, not the source-message ID by itself. Keep original POSTSCAN PDF filenames unchanged. Do not merge different letters just because both are named `image.jpg`.

## 6. Add one cloud import schedule

From your Site’s **Automations → Create schedule**, use the [import prompt](IMPORT_PROMPT.md), your account and timezone. A daily import is a reasonable starting cadence. Review and confirm the schedule. Use a separate import role alongside existing email briefings; preserve their prompts, timing and enabled state.

Verify separately:

- **Run now**: confirm Gmail search, deduplication, any complete write/readback and a fresh counts-only `postscan_health` receipt.
- **Timer-driven run**: inspect the receipt after the scheduled time. A saved/enabled schedule does not prove it executed.
- **A genuinely new letter**: confirm the source is received, all pages saved exactly once and source/ref/warnings retrievable.
- **Mail state**: compare labels, read/archive state and the existing daily-email schedule configuration before and after. The importer must not mutate these or produce another general digest.

Check again from your phone while the deployment computer is off. Source access, hosting, phone retrieval, manual cloud execution and timer dispatch are distinct checks. A missing/stale receipt means unknown source status, never proof of no letters. Approval controls, disconnected apps or account limits may pause a run; inspect its conversation and remedy the specific cause without creating duplicate schedules.

## 7. Optional generated-plugin icon package

The server advertises the SVG/PNG icon through standard MCP initialization. If your plugin UI still uses a default image, open its detail page, download its own plugin ZIP, then use the provided packager:

```bash
node scripts/brand-plugin.mjs /path/to/your-plugin.zip /path/to/postscan-branded.zip
```

It preserves your `.app.json` app identity, adds the included PNG and updates `interface.logo`, `composerIcon` and brand color in `.codex-plugin/plugin.json`. Upload the output using **Upload new version** on that same plugin and verify the icon and native connection. An accepted ZIP is not proof the managed app listing adopted the image; this platform display can remain a limitation. Do not upload it as a second plugin. Do not publish the private package: it contains your instance’s identifiers and URL. Browser file upload may need the ChatGPT extension’s local-file permission or a manual upload.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `sign_in_required` / `owner_only` | Plugin connection, trusted Sites identity and `OWNER_EMAIL` |
| `storage_not_configured` | R2 `BUCKET` binding and matching deployment manifest |
| PDF page read fails | Refresh Gmail’s short-lived original URL; check 8 MiB, page, codec/pixel/output limits |
| Health stale but retrieval works | Source task access, run result, approvals and import-check receipt |
| History missing | Forward old WEB.DE originals and follow Gmail/archive pagination without date cutoff |
| Tools unchanged | Publish the changed server, refresh tools/reconnect only if needed |
| Icon unchanged | Cache or generated-plugin package; preserve its app identity |
| No new letters | Verify source access and an explicit zero-new check; do not infer from silence |

Keep troubleshooting logs content-free. Never post attachment download URLs, source PDFs, mailbox identifiers or credentials in public issues.
