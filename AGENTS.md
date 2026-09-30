# ChatGPT project context

This is the real working project for the ChatGPT project “给孩子读书”. New-book work must be performed in this project directory, not in a separate task scratch directory:

`C:\Users\JASI\.codex\.chatgpt-projects\g-p-6a9ef01af6788191bfa2df5c2f3c13b4`

Files under `sources/` are read-only reference material. Do not edit, rename, move, or delete them.

## Standard new-book publishing workflow

When the user provides a PDF or page photos, process and publish the book in this order:

1. Identify the Dutch title, Chinese title, author, and page count from the source. Render and visually inspect every page. Preserve pure illustration pages with an empty `paragraphs` array.
2. Create the book under `public/private-books/<slug>/`. This directory is the local family library and is intentionally ignored by Git.
3. Use the reader schema below. Do not invent a different schema and do not use the similarly named `public/private-books` directory in another workspace.
4. Add one entry to `public/private-books/index.json`:

   `{ "slug": "<slug>", "cover": "cover.jpg", "private": true }`

5. Validate that every `pages[].image` exists, every page has a `paragraphs` array, JSON parses, and the index entry points to the intended slug. Check that page count and image count agree.
6. Start or restart the local reader with the project’s `开始阅读器.cmd` (or `npm run local`) when the user expects the LAN reader to be available. The reader URL is:

   `http://<computer-or-Tailscale-IP>:5173/Child_book_reading/`

7. Verify the live shelf shows the new book, open it, verify the first text page, image, Dutch text, Chinese translation, speech button, and page navigation. Also check the management page when index visibility matters.
8. Keep old test books unless the user explicitly asks to delete them. A folder that is absent from `index.json` is not visible to the shelf or management page; deletion must remove both the folder and its index entry.
9. Send the standard Codex completion phone notification after the book is visible and verified.

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

## Local versus GitHub Pages publishing

- `public/private-books/` is for the local LAN reader and must remain ignored; it is not automatically published to GitHub.
- `public/books/` is for public/demo books that are intentionally committed and deployed by GitHub Pages.
- Do not copy family scans, private book images, or private translations into `public/books/` or a public Git commit.
- GitHub Pages deployment is separate from local private-library publishing. If the user wants a book on the LAN reader, update `public/private-books/index.json` and verify the LAN URL. If the user wants a public/demo book, use `public/books/index.json` instead and explicitly confirm that the content is suitable for publication.
