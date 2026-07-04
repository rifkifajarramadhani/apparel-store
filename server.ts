import handler from './dist/server/server.js'

// ponytail: ships runtime node_modules; bundle the SSR handler if image size hurts.
const CLIENT = `${import.meta.dir}/dist/client`

Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  hostname: '0.0.0.0',
  async fetch(req) {
    const { pathname } = new URL(req.url)
    if (pathname !== '/') {
      const file = Bun.file(CLIENT + pathname)
      if (await file.exists()) return new Response(file)
    }
    return handler.fetch(req)
  },
})
