/**
 * dsh-whale-pet — node half.
 *
 * 通过 webServer 注册两个 HTTP 路由供浏览器端 client 调用：
 *   GET /__whale-pet/balance  查询 DeepSeek 余额（凭据服务解析 DEEPSEEK_API_KEY，进程内 fetch）
 *   GET /__whale-pet/image    返回鲸鱼娘形象图的 data URI（从插件包内读取 whale_pet_b64.txt）
 *
 * 兼容性注记：旧版派生 curl / node 子进程双通道查询余额；新版 dsh 的 subprocess 服务
 * 契约已变更，host 插件现以全局 fetch + AbortController 直连 API，无子进程依赖。
 */
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const name = 'dsh-whale-pet'
// webServer 由 web 组合保证提供；声明为硬依赖使 apply 等待其就绪
export const inject = ['webServer']

// 形象图 base64 候选路径：优先随插件包自身解析（仓库即包时 b64 在 plugin/ 上一级；
// 仅复制 plugin/ 安装时 b64 与 index.js 同目录），最后回退旧版硬编码的本机开发路径。
const IMAGE_B64_CANDIDATES = [
  fileURLToPath(new URL('../whale_pet_b64.txt', import.meta.url)),
  fileURLToPath(new URL('./whale_pet_b64.txt', import.meta.url)),
  'G:\\WorkSpace\\DSH\\dsh-whale-pet\\whale_pet_b64.txt',
]
const IMAGE_B64_FILE = (() => {
  for (const candidate of IMAGE_B64_CANDIDATES) {
    if (existsSync(candidate)) return candidate
  }
  return IMAGE_B64_CANDIDATES[0]
})()
const BALANCE_ENDPOINT = 'https://api.deepseek.com/user/balance'
const FETCH_TIMEOUT_MS = 20000

function sendJson(res, payload, status = 200) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function parsePayload(text) {
  const parsed = JSON.parse(text || 'null')
  const balances = (parsed && Array.isArray(parsed.balance_infos) ? parsed.balance_infos : []).map((b) => ({
    currency: b.currency || 'CNY',
    total: String(b.total_balance !== undefined ? b.total_balance : ''),
    granted: String(b.granted_balance !== undefined ? b.granted_balance : ''),
    toppedUp: String(b.topped_up_balance !== undefined ? b.topped_up_balance : ''),
  }))
  return { ok: true, isAvailable: parsed ? parsed.is_available === true : false, balances, at: Date.now() }
}

/** 进程内直连 DeepSeek 余额接口（全局 fetch，超时后中断）。 */
async function fetchBalance(apiKey) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(BALANCE_ENDPOINT, {
      headers: { authorization: 'Bearer ' + apiKey },
      signal: controller.signal,
    })
    const text = await response.text()
    if (response.status < 200 || response.status >= 300) {
      throw new Error('http ' + response.status + ': ' + text.slice(0, 200))
    }
    return parsePayload(text)
  } finally {
    clearTimeout(timeout)
  }
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
        sendJson(res, { ok: false, error: 'no-key', hint: '尚未配置 DEEPSEEK_API_KEY，请在设置中填写 DeepSeek API Key' })
        return
      }

      try {
        sendJson(res, await fetchBalance(cred.value))
      } catch (error) {
        sendJson(res, {
          ok: false,
          error: 'fetch-failed',
          message: String((error && error.message) || error).slice(0, 200),
        })
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
