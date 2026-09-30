import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
const password = process.argv[2]
if (!password) { console.error('Gebruik: npm run set-password -- "jouw-wachtwoord"'); process.exit(1) }
const hash = createHash('sha256').update(password).digest('hex')
const path = new URL('../src/passwordHash.js', import.meta.url)
const old = readFileSync(path, 'utf8')
writeFileSync(path, old.replace(/export const PASSWORD_HASH = '.*'/, `export const PASSWORD_HASH = '${hash}'`))
console.log('已写入 SHA-256 hash；仓库中不会保存明文密码。')
