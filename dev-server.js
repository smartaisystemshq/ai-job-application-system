// Local development API server — mirrors Vercel serverless functions
// Run: node dev-server.js
// Then start Vite dev server separately: npm run dev

const http = require('http')
const path = require('path')
const fs = require('fs')

const PORT = 3001

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.statusCode = 200; res.end(); return }

  const url = new URL(req.url, `http://localhost:${PORT}`)
  const apiPath = url.pathname.replace('/api/', '')

  const handlerFile = path.join(__dirname, 'api', apiPath + '.js')
  if (!fs.existsSync(handlerFile)) {
    res.statusCode = 404
    res.end(JSON.stringify({ error: `API route not found: ${apiPath}` }))
    return
  }

  // Read body
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const rawBody = Buffer.concat(chunks).toString()

  let body = {}
  try { body = JSON.parse(rawBody) } catch {}

  // Mock Express-like req/res
  const mockReq = { method: req.method, body, url: req.url }
  const headers = {}
  const mockRes = {
    statusCode: 200,
    setHeader: (k, v) => { headers[k] = v },
    status: (code) => { mockRes.statusCode = code; return mockRes },
    json: (data) => {
      res.statusCode = mockRes.statusCode
      Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v))
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(data))
    },
    end: () => { res.statusCode = mockRes.statusCode; res.end() },
  }

  try {
    delete require.cache[require.resolve(handlerFile)]
    const handler = require(handlerFile)
    await handler(mockReq, mockRes)
  } catch (err) {
    console.error(`Error in ${apiPath}:`, err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err.message }))
  }
})

server.listen(PORT, () => {
  console.log(`API dev server running on http://localhost:${PORT}`)
  console.log('Available routes:', fs.readdirSync('./api').filter(f => f.endsWith('.js')).map(f => '/api/' + f.replace('.js', '')))
})
