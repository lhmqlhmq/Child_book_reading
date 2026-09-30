import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PASSWORD_HASH } from './passwordHash'
import './styles.css'

const base = import.meta.env.BASE_URL
const key = (name) => `child-reading:${name}`

async function sha256(value) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function useBooks() {
  const [books, setBooks] = useState([])
  useEffect(() => {
    fetch(`${base}books/index.json`).then((r) => r.json()).then(async (items) => {
      const loaded = await Promise.all(items.map(async (item) => ({ ...item, data: await fetch(`${base}books/${item.slug}/book.json`).then((r) => r.json()) })))
      setBooks(loaded)
    })
  }, [])
  return books
}

function App() {
  const books = useBooks()
  const [authed, setAuthed] = useState(localStorage.getItem(key('authenticated')) === 'yes')
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState(0)
  const [speed, setSpeed] = useState(Number(localStorage.getItem(key('speed'))) || 1)

  useEffect(() => { localStorage.setItem(key('speed'), speed) }, [speed])
  useEffect(() => {
    if (selected) setPage(Number(localStorage.getItem(key(`page:${selected.slug}`))) || 0)
  }, [selected])

  if (!authed) return <Login onSuccess={() => { localStorage.setItem(key('authenticated'), 'yes'); setAuthed(true) }} />
  if (selected) return <Reader book={selected} page={page} setPage={setPage} speed={speed} setSpeed={setSpeed} onBack={() => setSelected(null)} />
  return <Shelf books={books} onOpen={setSelected} />
}

function Login({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  async function submit(e) {
    e.preventDefault(); setError('')
    if ((await sha256(password)) === PASSWORD_HASH) onSuccess()
    else setError('密码不正确，请再试一次。')
  }
  return <main className="gate"><div className="gate-card"><div className="brand-mark">📚</div><h1>给孩子读书</h1><p>这是一个家庭阅读空间</p><form onSubmit={submit}><label htmlFor="password">家庭密码</label><input id="password" type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} /><button className="primary" type="submit">进入书架</button>{error && <div className="error">{error}</div>}</form></div></main>
}

function Shelf({ books, onOpen }) {
  return <main className="page-shell"><header className="topbar"><div><span className="eyebrow">FAMILY READING</span><h1>我的书架</h1></div><div className="book-count">{books.length} 本书</div></header><section className="shelf-grid">{books.map((book) => <BookCard key={book.slug} book={book} onClick={() => onOpen(book)} />)}</section>{!books.length && <p className="loading">正在加载书架…</p>}<footer>自制示例内容 · 荷兰语朗读由浏览器提供</footer></main>
}

function BookCard({ book, onClick }) {
  const progress = Math.round((((Number(localStorage.getItem(key(`page:${book.slug}`))) || 0) + 1) / book.data.pages.length) * 100)
  return <button className="book-card" onClick={onClick}><img src={`${base}books/${book.slug}/${book.data.cover}`} alt="" /><div className="book-info"><h2>{book.data.titleZh}</h2><p>{book.data.titleNl}</p><div className="progress"><span style={{ width: `${progress}%` }} /></div><small>读到 {progress}%</small></div></button>
}

function Reader({ book, page, setPage, speed, setSpeed, onBack }) {
  const pages = book.data.pages; const current = pages[page]
  const speak = (text) => { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'nl-NL'; u.rate = speed; speechSynthesis.speak(u) }
  const go = (next) => { const n = Math.max(0, Math.min(pages.length - 1, next)); setPage(n); localStorage.setItem(key(`page:${book.slug}`), n) }
  useEffect(() => () => speechSynthesis.cancel(), [])
  return <main className="reader"><header className="reader-top"><button className="icon-button" onClick={onBack} aria-label="返回书架">←</button><div><span className="eyebrow">{book.data.titleNl}</span><strong>{page + 1} / {pages.length}</strong></div><select aria-label="朗读速度" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}><option value="0.8">0.8×</option><option value="1">1×</option></select></header><div className="page-content"><button className="image-button" onClick={() => window.open(`${base}books/${book.slug}/${current.image}`, '_blank')} aria-label="放大原书页面"><img src={`${base}books/${book.slug}/${current.image}`} alt={`第 ${page + 1} 页`} /></button><div className="page-heading"><span>第 {page + 1} 页</span><button className="listen-all" onClick={() => speak(current.paragraphs.map((p) => p.nl).join(' '))}>🔊 朗读整页</button></div><div className="paragraphs">{current.paragraphs.map((p, i) => <article className="pair" key={i}><div className="nl"><span>{p.nl}</span><button onClick={() => speak(p.nl)} aria-label="朗读荷兰语">🔊</button></div><p>{p.zh}</p></article>)}</div></div><nav className="pager"><button onClick={() => go(page - 1)} disabled={page === 0}>← 上一页</button><div className="dots">{pages.map((_, i) => <button key={i} className={i === page ? 'active' : ''} onClick={() => go(i)} aria-label={`第 ${i + 1} 页`} />)}</div><button onClick={() => go(page + 1)} disabled={page === pages.length - 1}>下一页 →</button></nav></main>
}

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register(`${base}sw.js`))
createRoot(document.getElementById('root')).render(<App />)
