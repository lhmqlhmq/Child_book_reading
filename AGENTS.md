# ChatGPT project context

This is the real working project for the ChatGPT project “给孩子读书”. New-book work must be performed in this project directory, not in a separate task scratch directory:

`C:\Users\JASI\.codex\.chatgpt-projects\g-p-6a9ef01af6788191bfa2df5c2f3c13b4`

Files under `sources/` are read-only reference material. Do not edit, rename, move, or delete them.

## Standard new-book publishing workflow

When the user provides a PDF or page photos, process and publish the book in this order:

1. Confirm the authoritative project directory, upload order, page count, and duplicate/missing pages before creating files.
2. Render or inspect every page first and record the visual text-block count for each page. Preserve pure illustration pages with an empty `paragraphs` array.
3. Extract text by visual block, not by ordinary line breaks or individual sentences. A heading belongs with the following body when they form one visual block; a clearly separate heading remains separate.
4. Translate each Dutch block one-to-one into Chinese, preserving page order. Do not merge unrelated blocks or split one block merely because it wraps onto several lines.
5. Create the book under `public/private-books/<slug>/`. This directory is the local family library and is intentionally ignored by Git. Do not create final book files in a scratch directory.
6. Use the reader schema below. Do not invent a different schema and do not use the similarly named `public/private-books` directory in another workspace.
7. Add one entry to `public/private-books/index.json`:

   `{ "slug": "<slug>", "cover": "cover.jpg", "private": true }`

8. Validate JSON, page order, page/image counts, image existence, paragraph arrays, non-empty `nl`/`zh` pairs, and index-to-folder consistency before opening the reader.
9. Start or restart the local reader with the project’s `开始阅读器.cmd` (or `npm run local`) when the user expects the LAN reader to be available. The reader URL is:

   `http://<computer-or-Tailscale-IP>:5173/Child_book_reading/`

10. Verify the live shelf, first text page, multi-paragraph display, image, Dutch text, Chinese translation, speech button, page navigation, progress, and management-page visibility. Refresh the local network index if a service-worker cache is involved.
11. Keep old test books unless the user explicitly asks to delete them. A folder that is absent from `index.json` is not visible to the shelf or management page; deletion must remove both the folder and its index entry.
12. In chat, report only a compact summary, page/paragraph counts, exceptions, and verification status; do not paste the full book text. Send the standard Codex completion phone notification after the book is visible and verified.

## Required book.json schema

```json
{
  "titleZh": "中文书名",
  "titleNl": "Nederlandse titel",
  "cover": "cover.jpg",
  "pages": [
    {
      "image": "page-001.jpg",
      "paragraphs": [
        { "nl": "Nederlandse tekst", "zh": "中文翻译" }
      ]
    }
  ]
}
```

Use zero-padded page filenames (`page-001.jpg`, `page-002.jpg`, ...). The cover is also the first reader page unless the source workflow clearly requires otherwise. Do not put long book text in React source code.

## Local-only publishing

- `public/private-books/` is for the local LAN reader and must remain ignored; it is not automatically published to GitHub.
- Do not copy family scans, private book images, or private translations into a Git commit.
- GitHub is only a code backup for this project. Do not enable or restore GitHub Pages unless the user explicitly asks to publish a separate public demo.
