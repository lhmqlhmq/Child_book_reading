import express from 'express'
import multer from 'multer'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer as createViteServer } from 'vite'
import { PDFDocument } from 'pdf-lib'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const privateRoot = path.join(root, 'public', 'private-books')
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 40, fileSize: 15 * 1024 * 1024 } })
const app = express()

app.post(['/api/upload-book', '/Child_book_reading/api/upload-book'], upload.array('photos', 40), async (req, res) => {
  try {
    const titleZh = String(req.body.titleZh || '').trim()
    const titleNl = String(req.body.titleNl || '').trim()
    const files = req.files || []
    const extension = (file) => path.extname(file.originalname).toLowerCase() || '.jpg'
    const pdfUpload = files.length === 1 && (files[0].mimetype === 'application/pdf' || extension(files[0]) === '.pdf')
    if (!titleZh || !titleNl || files.length < 1) return res.status(400).json({ error: '请填写中荷书名，并上传照片或 PDF。' })
    if (!pdfUpload && files.length < 2) return res.status(400).json({ error: '照片模式请至少上传封面和一张内页；PDF 模式请一次只上传一个 PDF。' })
    if (files.some((file) => file.mimetype === 'application/pdf' || extension(file) === '.pdf') && !pdfUpload) return res.status(400).json({ error: 'PDF 请一次只上传一个，不能与照片混合上传。' })
    const slug = `${titleNl.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'new-book'}-${Date.now().toString(36)}`
    const dir = path.join(privateRoot, slug)
    await mkdir(dir, { recursive: true })
    let pages = []
    let book
    if (pdfUpload) {
      await writeFile(path.join(dir, 'book.pdf'), files[0].buffer)
      const pdf = await PDFDocument.load(files[0].buffer)
      pages = Array.from({ length: pdf.getPageCount() }, (_, i) => ({ pdfPage: i + 1, paragraphs: [] }))
      book = { titleZh, titleNl, type: 'pdf', file: 'book.pdf', pages }
    } else {
      await writeFile(path.join(dir, `cover${extension(files[0])}`), files[0].buffer)
      for (let i = 1; i < files.length; i += 1) {
        const image = `page-${String(i).padStart(3, '0')}${extension(files[i])}`
        await writeFile(path.join(dir, image), files[i].buffer)
        pages.push({ image, paragraphs: [] })
      }
      book = { titleZh, titleNl, cover: `cover${extension(files[0])}`, pages }
    }
    await writeFile(path.join(dir, 'book.json'), JSON.stringify(book, null, 2), 'utf8')
    const indexPath = path.join(privateRoot, 'index.json')
    let index = []
    try { index = JSON.parse(await readFile(indexPath, 'utf8')) } catch {}
    index = index.filter((item) => item.slug !== slug)
    index.push({ slug, cover: pdfUpload ? 'pdf' : `cover${extension(files[0])}`, private: true })
    await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8')
    res.json({ ok: true, titleNl, pages: pages.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

const vite = await createViteServer({ root, server: { middlewareMode: true }, appType: 'spa' })
app.use(vite.middlewares)
app.listen(5173, '0.0.0.0', () => console.log('Local reader listening on port 5173'))
