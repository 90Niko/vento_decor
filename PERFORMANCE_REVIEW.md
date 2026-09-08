# Performance review — 2026-09-08

Focus: the uploaded-photo gallery becoming unstable on mobile with approximately 60 photos.

## Findings and changes

| Finding in the code | Change |
| --- | --- |
| Gallery images bypassed optimization and downloaded original files, including phone camera formats. | Cloudinary loader serves width-specific, automatically compressed images in a browser-compatible format. Original download links remain available. |
| Every video tile loaded video metadata. | Gallery tiles now request still-image posters; video playback starts in the viewer. |
| Guest gallery returned and rendered up to 500 records on its first request, with no way to request older records. | New authenticated endpoint returns 24 records per page, with an ID cursor and a “Покажи още снимки” button. The query reads at most 25 records to detect another page. |
| Gallery network failures had no visible retry flow. | Errors are displayed with retry; superseded and unmounted requests are cancelled. |
| Gallery fetched every guest's quiz answers to display just the current guest's percentage. | Dedicated summary endpoint reads only the current guest's score and the quiz scoring flag. |
| Selected image previews copied full files into base64 strings. | Object URLs avoid base64 copies and are released when removed, uploaded or unmounted. CSP now permits local image/video previews. |
| Event cover backgrounds requested originals. | Public entry and gallery covers request a width-limited, compressed version. |
| Manager quiz statistics parsed each attempt repeatedly for every question and option. | Answers are counted in one pass per attempt. |
| Event creation reset countdown state inside an effect. | Reset moved to the successful creation handler, removing an extra effect-triggered render. |

For the reported 60-photo case, the guest gallery initially mounts 24 photo cards instead of 60 (60% fewer). This is a code-level reduction, **not a measured speed or memory improvement**. Image byte savings depend on the actual originals and requesting device.

## Verification and limits

- Production frontend build and backend compilation checked; unit tests cover pagination beyond 500 records, inserts/deletes between pages, empty galleries, invalid cursors and authentication.
- Quiz summary tests verify the personal score and that no all-guest answer query is issued.
- The initial pagination test uses a mocked repository with 550 records. It does not measure database throughput or mobile browser behavior.
- No live URL, authenticated mobile session or device crash trace was supplied. Actual load time, memory usage, LCP and INP have not been measured. The exact crash cause remains unconfirmed.
- The admin gallery still returns up to 500 records at once, although its images and video previews are now optimized. The new pagination applies to the guest gallery.
- Uploads still send originals through the backend in batches of two; slow upload throughput and server memory under concurrent uploads require a separate load measurement.
- Frontend and backend changes are local. Deploy the backend with the new endpoints before deploying the frontend. No database schema change is required.
