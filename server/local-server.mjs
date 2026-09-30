import express from 'express'
import multer from 'multer'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer as createViteServer } from 'vite'
import { PDFDocument } from 'pdf-lib'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const privateRoot = path.join(root, 'public', 'private-books')
const imageProcessor = path.join(root, 'scripts', 'deskew-image.py')
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 40, fileSize: 200 * 1024 * 1024 } })
const app = express()
app.use(express.json())

async function pdfPageCount(buffer) {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'child-reading-pdf-'))
  const inputPath = path.join(tempDir, 'book.pdf')
  await writeFile(inputPath, buffer)
  try {
    try {
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true })
      return pdf.getPageCount()
    } catch {}
    const commands = [
      process.env.PDFINFO,
      'C:\\Users\\JASI\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\native\\poppler\\Library\\bin\\pdfinfo.exe',
      'pdfinfo',
    ].filter(Boolean)
    for (const command of commands) {
      try {
        const output = await new Promise((resolve, reject) => {
          const child = spawn(command, [inputPath], { windowsHide: true })
          let stdout = ''; let stderr = ''
          child.stdout.on('data', (chunk) => { stdout += chunk.toString() })
          child.stderr.on('data', (chunk) => { stderr += chunk.toString() })
          child.on('error', reject)
          child.on('close', (code) => code === 0 ? resolve(stdout) : reject(new Error(stderr)))
        })
        const match = String(output).match(/^Pages:\s*(\d+)/mi)
        if (match) return Number(match[1])
      } catch {}
    }
    return 1
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

async function saveProcessedImage(file, outputPath) {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'child-reading-'))
  const inputPath = path.join(tempDir, 'input')
  await writeFile(inputPath, file.buffer)
  try {
    await new Promise((resolve, reject) => {
      const childProcess = spawn(process.env.PYTHON || 'python', [imageProcessor, inputPath, outputPath], { windowsHide: true })
      let error = ''
      childProcess.stderr.on('data', (chunk) => { error += chunk.toString() })
      childProcess.on('error', reject)
      childProcess.on('close', (code) => code === 0 ? resolve() : reject(new Error(error || `图片处理失败（代码 ${code}）`)))
    })
  } catch (error) {
    console.warn(`自动裁剪不可用，保留原图：${error.message}`)
    await writeFile(outputPath, file.buffer)
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

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
      const pageCount = await pdfPageCount(files[0].buffer)
      pages = Array.from({ length: pageCount }, (_, i) => ({ pdfPage: i + 1, paragraphs: [] }))
      book = { titleZh, titleNl, type: 'pdf', file: 'book.pdf', pages }
    } else {
      await saveProcessedImage(files[0], path.join(dir, 'cover.jpg'))
      for (let i = 1; i < files.length; i += 1) {
        const image = `page-${String(i).padStart(3, '0')}.jpg`
        await saveProcessedImage(files[i], path.join(dir, image))
        pages.push({ image, paragraphs: [] })
      }
      book = { titleZh, titleNl, cover: 'cover.jpg', pages }
    }
    await writeFile(path.join(dir, 'book.json'), JSON.stringify(book, null, 2), 'utf8')
    const indexPath = path.join(privateRoot, 'index.json')
    let index = []
    try { index = JSON.parse(await readFile(indexPath, 'utf8')) } catch {}
    index = index.filter((item) => item.slug !== slug)
    index.push({ slug, cover: pdfUpload ? 'pdf' : 'cover.jpg', private: true })
    await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8')
    res.json({ ok: true, titleNl, pages: pages.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.patch(['/api/books/:slug', '/Child_book_reading/api/books/:slug'], async (req, res) => {
  try {
    const { slug } = req.params
    if (!/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ error: '书籍标识无效。' })
    const bookPath = path.join(privateRoot, slug, 'book.json')
    const book = JSON.parse(await readFile(bookPath, 'utf8'))
    const titleZh = String(req.body.titleZh || '').trim()
    const titleNl = String(req.body.titleNl || '').trim()
    if (!titleZh || !titleNl) return res.status(400).json({ error: '中荷书名都不能为空。' })
    book.titleZh = titleZh
    book.titleNl = titleNl
    await writeFile(bookPath, JSON.stringify(book, null, 2), 'utf8')
    res.json({ ok: true, titleZh, titleNl })
  } catch (error) {
    res.status(error.code === 'ENOENT' ? 404 : 500).json({ error: error.code === 'ENOENT' ? '找不到这本书。' : error.message })
  }
})

app.delete(['/api/books/:slug', '/Child_book_reading/api/books/:slug'], async (req, res) => {
  try {
    const { slug } = req.params
    if (!/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ error: '书籍标识无效。' })
    await rm(path.join(privateRoot, slug), { recursive: true, force: false })
    const indexPath = path.join(privateRoot, 'index.json')
    const index = JSON.parse(await readFile(indexPath, 'utf8')).filter((item) => item.slug !== slug)
    await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8')
    res.json({ ok: true })
  } catch (error) {
    res.status(error.code === 'ENOENT' ? 404 : 500).json({ error: error.code === 'ENOENT' ? '找不到这本书。' : error.message })
  }
})

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? '文件太大，请将单个文件控制在 200MB 以内。' : `上传失败：${error.message}`
    return res.status(400).json({ error: message })
  }
  return next(error)
})

const vite = await createViteServer({ root, server: { middlewareMode: true }, appType: 'spa' })
app.use(vite.middlewares)
app.listen(5173, '0.0.0.0', () => console.log('Local reader listening on port 5173'))
