import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const base = import.meta.env.BASE_URL
const key = (name) => `child-reading:${name}`

function useBooks() {
  const [books, setBooks] = useState([])
  useEffect(() => {
    const loadIndex = (path) => fetch(`${base}${path}`).then((r) => r.ok ? r.json() : []).catch(() => [])
    loadIndex('private-books/index.json').then(async (privateItems) => {
      const loaded = (await Promise.all(privateItems.map(async (item) => {
        try {
          const root = 'private-books'
          const response = await fetch(`${base}${root}/${encodeURIComponent(item.slug)}/book.json`)
          if (!response.ok) return null
          const raw = await response.json()
          if (!raw || !Array.isArray(raw.pages)) return null
          const data = { ...raw, pages: raw.pages.map((page) => ({ ...page, paragraphs: Array.isArray(page.paragraphs) ? page.paragraphs.filter((paragraph) => paragraph && typeof paragraph.nl === 'string' && typeof paragraph.zh === 'string') : [] })) }
          return { ...item, data, root }
        } catch {
          return null
        }
      }))).filter(Boolean)
      setBooks(loaded)
    })
  }, [])
  return books
}

function App() {
  const books = useBooks()
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState(0)
  const [speed, setSpeed] = useState(Number(localStorage.getItem(key('speed'))) || 0.8)

  useEffect(() => { localStorage.setItem(key('speed'), speed) }, [speed])
  useEffect(() => {
    if (selected) {
      const saved = Number(localStorage.getItem(key(`page:${selected.slug}`)))
      setPage(Number.isInteger(saved) && saved >= 0 ? Math.min(saved, Math.max(0, selected.data.pages.length - 1)) : 0)
    }
  }, [selected])

  if (selected) return <Reader book={selected} page={page} setPage={setPage} speed={speed} setSpeed={setSpeed} onBack={() => setSelected(null)} />
  return <Shelf books={books} onOpen={setSelected} />
}

function Shelf({ books, onOpen }) {
  return <main className="page-shell"><header className="topbar"><div><span className="eyebrow">FAMILY READING</span><h1>我的书架</h1></div><div className="book-count">{books.length} 本书</div></header>{import.meta.env.DEV && <div className="shelf-links"><a className="upload-link" href="/Child_book_reading/upload.html">＋ 用手机上传新书</a><a className="upload-link" href="/Child_book_reading/manage.html">⚙ 管理书籍</a><a className="upload-link" href="/Child_book_reading/online.html">🎧 在线故事</a></div>}<section className="shelf-grid">{books.map((book) => <BookCard key={book.slug} book={book} onClick={() => onOpen(book)} />)}</section>{!books.length && <p className="loading">正在加载书架…</p>}<footer>本地家庭阅读 · 荷兰语朗读由浏览器提供</footer></main>
}

function BookCard({ book, onClick }) {
  const totalPages = book.data.pages.length
  const savedPage = Number(localStorage.getItem(key(`page:${book.slug}`)))
  const progress = totalPages ? Math.min(100, Math.round(((Number.isInteger(savedPage) && savedPage >= 0 ? Math.min(savedPage, totalPages - 1) : 0) + 1) / totalPages * 100)) : 0
  return <button className="book-card" onClick={onClick}>{book.data.type === 'pdf' ? <div className="pdf-cover">PDF</div> : <img src={`${base}${book.root}/${book.slug}/${book.data.cover}`} alt="" />}<div className="book-info"><h2>{book.data.titleZh}</h2><p>{book.data.titleNl}</p><div className="progress"><span style={{ width: `${progress}%` }} /></div><small>读到 {progress}%</small></div></button>
}

function Reader({ book, page, setPage, speed, setSpeed, onBack }) {
  const pages = book.data.pages; const current = pages[page]
  const [touchStart, setTouchStart] = useState(null)
  const [imageOpen, setImageOpen] = useState(false)
  const speak = (text) => { if (!('speechSynthesis' in window) || !text) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'nl-NL'; u.rate = speed; speechSynthesis.speak(u) }
  const go = (next) => { const n = Math.max(0, Math.min(pages.length - 1, next)); setPage(n); localStorage.setItem(key(`page:${book.slug}`), n) }
  const touchEnd = (event) => { if (touchStart === null) return; const distance = event.changedTouches[0].clientX - touchStart; if (Math.abs(distance) > 50) go(page + (distance < 0 ? 1 : -1)); setTouchStart(null) }
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') setImageOpen(false) }
    if (imageOpen) { document.body.style.overflow = 'hidden'; window.addEventListener('keydown', closeOnEscape) }
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', closeOnEscape); if ('speechSynthesis' in window) speechSynthesis.cancel() }
  }, [imageOpen])
  if (!current) return <main className="reader"><header className="reader-top"><button className="icon-button" onClick={onBack} aria-label="返回书架">←</button><strong>这本书暂无可阅读页面</strong></header></main>
  const assetUrl = `${base}${book.root}/${book.slug}/`
  return <main className="reader"><header className="reader-top"><button className="icon-button" onClick={onBack} aria-label="返回书架">←</button><div><span className="eyebrow">{book.data.titleNl}</span><strong>{page + 1} / {pages.length}</strong></div><select aria-label="朗读速度" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}><option value="0.6">0.6×</option><option value="0.8">0.8×</option><option value="1">1×</option></select></header><div className="page-content" onTouchStart={(e) => setTouchStart(e.touches[0].clientX)} onTouchEnd={touchEnd}>{book.data.type === 'pdf' ? <iframe className="pdf-page" src={`${assetUrl}${book.data.file}#page=${current.pdfPage}&zoom=page-width`} title={`第 ${page + 1} 页`} /> : <button className="image-button" onClick={() => setImageOpen(true)} aria-label="放大原书页面"><img src={`${assetUrl}${current.image}`} alt={`第 ${page + 1} 页`} /></button>}<div className="page-heading"><span>第 {page + 1} 页</span><button className="listen-all" onClick={() => speak(current.paragraphs.map((p) => p.nl).join(' '))}>🔊 朗读整页</button></div><div className="paragraphs">{current.paragraphs.map((p, i) => <article className="pair" key={i}><div className="nl"><span>{p.nl}</span><button onClick={() => speak(p.nl)} aria-label="朗读荷兰语">🔊</button></div><p>{p.zh}</p></article>)}</div></div><nav className="pager"><button onClick={() => go(page - 1)} disabled={page === 0}>← 上一页</button><div className="dots">{pages.map((_, i) => <button key={i} className={i === page ? 'active' : ''} onClick={() => go(i)} aria-label={`第 ${i + 1} 页`} />)}</div><button onClick={() => go(page + 1)} disabled={page === pages.length - 1}>下一页 →</button></nav>{imageOpen && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="放大原书页面" onClick={() => setImageOpen(false)}><button className="lightbox-close" onClick={() => setImageOpen(false)} aria-label="关闭全屏照片">×</button><img src={`${assetUrl}${current.image}`} alt={`第 ${page + 1} 页（放大）`} onClick={(event) => event.stopPropagation()} /></div>}</main>
}

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register(`${base}sw.js`))
createRoot(document.getElementById('root')).render(<App />)
