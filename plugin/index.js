/**
 * dsh-whale-pet 鈥?node half.
 *
 * 椴搁奔濞樹綑棰濇瀹狅細閫氳繃 webServer 娉ㄥ唽涓や釜 HTTP 璺敱渚涙祻瑙堝櫒绔?client 璋冪敤銆? *
 *   GET  /__whale-pet/balance  鏌ヨ DeepSeek 鍓╀綑浣欓锛坈url 鈫?node fetch 鍙岄€氶亾锛? *   GET  /__whale-pet/image    杩斿洖椴搁奔濞樺舰璞″浘鐨?data URI锛堜粠 G:\WorkSpace\DSH\dsh-whale-pet\whale_pet_b64.txt 璇诲彇锛? *
 * API Key 閫氳繃鍑嵁鏈嶅姟瑙ｆ瀽锛圖EEPSEEK_API_KEY锛夛紝缁?stdin 绠￠亾浼犵粰 curl锛? * 涓嶈惤鍛戒护琛岋紱node fetch 澶囩敤閫氶亾璧扮幆澧冨彉閲忋€傚弻閫氶亾淇濊瘉鍙敤鎬с€? */
import { readFileSync } from 'node:fs'

export const name = 'dsh-whale-pet'
// webServer 由 web 组合保证提供；声明为硬依赖使 apply 等待其就绪
export const inject = ['webServer']

const IMAGE_B64_FILE = 'G:\\WorkSpace\\DSH\\dsh-whale-pet\\whale_pet_b64.txt'
const BALANCE_ENDPOINT = 'https://api.deepseek.com/user/balance'

/** 璇诲彇璇锋眰浣擄紙JSON锛?*/
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 1024 * 1024) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res, payload, status = 200) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

export function apply(ctx) {
  const webServer = ctx.webServer

  const disposeBalance = webServer.register({
    kind: 'exact',
    path: '/__whale-pet/balance',
    handler: async (req, res) => {
      if (req.method !== 'GET') {
        sendJson(res, { ok: false, error: 'method not allowed' }, 405)
        return
      }

      const credentials = ctx.get('credentials')
      if (credentials === undefined) {
        sendJson(res, { ok: false, error: 'credentials-unavailable' })
        return
      }
      let cred
      try {
        cred = await credentials.resolve('DEEPSEEK_API_KEY')
      } catch (error) {
        sendJson(res, { ok: false, error: 'resolve-failed', message: String((error && error.message) || error) })
        return
      }
      if (cred === undefined || !cred.value) {
        sendJson(res, { ok: false, error: 'no-key', hint: '灏氭湭閰嶇疆 DEEPSEEK_API_KEY锛岃鍦ㄨ缃腑濉啓 DeepSeek API Key' })
        return
      }

      const subprocess = ctx.get('subprocess')
      if (subprocess === undefined) {
        sendJson(res, { ok: false, error: 'subprocess-unavailable' })
        return
      }

      const parsePayload = (text) => {
        const parsed = JSON.parse(text || 'null')
        const balances = (parsed && Array.isArray(parsed.balance_infos) ? parsed.balance_infos : []).map((b) => ({
          currency: b.currency || 'CNY',
          total: String(b.total_balance !== undefined ? b.total_balance : ''),
          granted: String(b.granted_balance !== undefined ? b.granted_balance : ''),
          toppedUp: String(b.topped_up_balance !== undefined ? b.topped_up_balance : ''),
        }))
        return { ok: true, isAvailable: parsed ? parsed.is_available === true : false, balances, at: Date.now() }
      }

      const runCurl = async () => {
        const curlPath = await subprocess.resolveExecutable('curl.exe')
        const handle = subprocess.spawn({
          argv: [curlPath, '-sS', '--max-time', '20', '-H', '@-', BALANCE_ENDPOINT],
          cwd: undefined,
          stdio: {
            stdin: { data: 'Authorization: Bearer ' + cred.value + '\n' },
            stdout: { maxBytes: 1 << 16, spill: { maxBytes: 1 << 20 } },
            stderr: { maxBytes: 1 << 16, spill: { maxBytes: 1 << 20 } },
          },
          graceMs: 3000,
          env: {},
        })
        const outcome = await handle.done
        const out = handle.collected.stdout.readFrom(0)
        const err = handle.collected.stderr.readFrom(0)
        if (outcome.exitCode !== 0) {
          throw new Error(String(err.text || ('curl exited ' + outcome.exitCode)))
        }
        return parsePayload(out.text)
      }

      const runNodeFetch = async () => {
        const nodePath = await subprocess.resolveExecutable('node.exe')
        const script =
          "(async () => { const key = process.env.DSH_WHALE_KEY; const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 20000); try { const r = await fetch('" +
          BALANCE_ENDPOINT +
          "', { headers: { authorization: 'Bearer ' + key }, signal: ctrl.signal }); const text = await r.text(); console.log('STATUS:' + r.status); console.log(text); } catch (e) { console.error('FETCH_ERR:' + e.message); process.exit(2); } finally { clearTimeout(t); } })()"
        const handle = subprocess.spawn({
          argv: [nodePath, '-e', script],
          cwd: undefined,
          stdio: {
            stdin: 'ignore',
            stdout: { maxBytes: 1 << 16, spill: { maxBytes: 1 << 20 } },
            stderr: { maxBytes: 1 << 16, spill: { maxBytes: 1 << 20 } },
          },
          graceMs: 3000,
          env: { DSH_WHALE_KEY: cred.value },
        })
        const outcome = await handle.done
        const out = handle.collected.stdout.readFrom(0)
        const err = handle.collected.stderr.readFrom(0)
        if (outcome.exitCode !== 0) {
          throw new Error(String(err.text || ('node exited ' + outcome.exitCode)))
        }
        const lines = out.text.split(/\r?\n/)
        const statusLine = lines.find((l) => l.startsWith('STATUS:'))
        if (!statusLine || !statusLine.startsWith('STATUS:2')) {
          throw new Error('node fetch bad status: ' + (statusLine || out.text).slice(0, 200))
        }
        const body = lines.filter((l) => !l.startsWith('STATUS:')).join('\n')
        return parsePayload(body)
      }

      try {
        const result = await runCurl()
        sendJson(res, result)
      } catch (curlError) {
        try {
          const result = await runNodeFetch()
          sendJson(res, result)
        } catch (nodeError) {
          sendJson(res, {
            ok: false,
            error: 'both-failed',
            curl: String((curlError && curlError.message) || curlError).slice(0, 200),
            node: String((nodeError && nodeError.message) || nodeError).slice(0, 200),
          })
        }
      }
    },
  })

  const disposeImage = webServer.register({
    kind: 'exact',
    path: '/__whale-pet/image',
    handler: (req, res) => {
      if (req.method !== 'GET') {
        sendJson(res, { ok: false, error: 'method not allowed' }, 405)
        return
      }
      try {
        const text = readFileSync(IMAGE_B64_FILE, 'utf8').trim()
        if (text.length < 100) {
          sendJson(res, { ok: false, error: 'empty-file' })
          return
        }
        sendJson(res, { ok: true, dataUri: 'data:image/png;base64,' + text })
      } catch (error) {
        sendJson(res, { ok: false, error: 'read-failed', message: String((error && error.message) || error).slice(0, 200) })
      }
    },
  })

  ctx.on('dispose', () => {
    disposeBalance()
    disposeImage()
  })
}
