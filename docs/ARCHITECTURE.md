# Architecture and limitations

## Boundaries

The Worker hosts a stateless streamable HTTP MCP at `/mcp`. ChatGPT Sites manages connection authentication. Data-bearing tool calls require the trusted `oai-authenticated-user-email` header to match `OWNER_EMAIL`. Deployment must remain behind Sites; the header must not be accepted as trusted on an exposed generic host. Discovery carries no letter data. Optional `/v1/*` routes use an independent service token; a service token cannot impersonate a user on MCP.

There is one `personal` namespace per deployment. This is a single-owner design, not a multi-tenant service. R2 stores JSON containing Markdown, source references, hashes, status, review reasons, warnings and import timestamps. Correction history remains in a separate namespace. PDF and PNG buffers are temporary and never written to R2.

Sites cannot speak raw IMAP, so this implementation uses ChatGPT’s authorized cloud Gmail tools plus a mailbox-copy route. The server does not hold a WEB.DE password or Google OAuth refresh token, poll a mailbox by itself, or contain a local daemon. The scheduled agent performs discovery, visual transcription and save/readback using tools. Gmail and Postscan must be available to that cloud task.

## Tools

| Tool | Behavior |
| --- | --- |
| `postscan_health` | Last source check, counts, errors and staleness; 26-hour daily threshold |
| `postscan_list_documents` | Ready/review records; follow `next_cursor` |
| `postscan_lookup_letter` | Filename-based canonical v2 identity check |
| `search` | Search title/full Markdown/filename one archive page per call; follow cursor even for no matches |
| `fetch` | Markdown, provenance and hash; follow `next_offset` for full text |
| `postscan_read_passage` | Numbered lines; supports continuation inside a long line |
| `postscan_read_pdf_page` | One page’s native text and scan objects; follow all pages |
| `postscan_save_transcription` | Complete Markdown or explicit review record; no binary storage |
| `postscan_record_import_check` | Counts-only source/import receipt, independent of the letters |

The SDK advertises read/write hints, but hints are not authorization. Owner checks and the caller’s approval controls enforce access.

## PDF handling

Pinned `unpdf 1.7.0` embeds PDF.js `5.6.205` with a working JavaScript JBIG2/CCITT path for the tested scan formats. UPNG encodes decoded pixels into PNG. Transparent scan text layers are composited on white so dark text remains readable. Embedded images are **not a fully reconstructed page**: PDF positioning, clipping, vector content, rotations and overlays can affect what they mean. The manifest retains warnings; the agent must not silently claim complete visual coverage.

Bounds: 8 MiB source, at most 100 pages, 5.5 million pixels per image, eight returned images per page and 4 MiB image-output budget. Only the known short-lived Gmail original-file hosts matching the reader’s allowlist are accepted. User info, arbitrary ports/hosts and redirects are rejected. Expired URLs need a fresh Gmail attachment read. Unsupported sources become review records.

No OCR/model API key is required. Native text plus image reading is performed within ChatGPT’s available tools/plan, not by an autonomous OCR engine in the Worker. Accuracy depends on the actual scan and the agent. Never interpret a page count, successful PNG decoder or synthetic test as proof that every real letter was understood.

## Identity, retry and correction

v2 records derive the ID from the namespace and canonical attachment filename. They retain source message provenance but do not pretend the filename identity is a PDF-byte hash. For generic image filenames the importer supplies a stable effective `original_filename`, for example `gmail-MESSAGE_ID--image.jpg`, while preserving the actual attachment name in Markdown. The source message field alone does not change the ID; a bare `image.jpg` can collide. The server rejects conflicting retries rather than silently merging content.

Identical saves are idempotent. Ready records are immutable through the ingestion tool. Review corrections require the previous Markdown hash and an R2 conditional ETag write. Prior versions are preserved. This protects against stale replacements; it does not prove the corrected text is factual.

## Validation

`npm test` runs real local Worker/R2 operations with synthetic identities and a generated image-only PDF. It checks access separation, no original-binary persistence, retry conflicts, pagination, scan decoding, transparent layers, review history, source counts and intact date search. These checks are separate from live hosting, connection, forwarding, phone access and task dispatch.

A cloud run with only existing letters proves source access/deduplication and a receipt write. It does not prove the newly arrived letter transcription path. Verify that with a new permitted or synthetic scanned letter, then separately verify timer dispatch.
