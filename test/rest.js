const common = require('./lib/common')
const fs = require('fs')
const http = require('http')
const path = require('path')
const test = require('tap').test

test('abort', (t) => {
  const server = common.freshMangerServer()
  server.start((er) => {
    if (er) throw er
    const req = http.get('http://localhost:1337/', () => {})
    req.on('error', (er) => {
      t.is(er.code, 'ECONNRESET')
      server.stop((er) => {
        if (er) throw er
        t.end()
      })
    })
    process.nextTick(() => {
      req.abort()
    })
  })
})

function readFixtures (file) {
  const p = path.resolve(__dirname, 'data', file)
  const input = fs.readFileSync(p)
  const json = JSON.parse(input)
  return json instanceof Array ? json : [json]
}

test('root', (t) => {
  const fixtures = readFixtures('root.json')
  console.log(fixtures)
  t.end()
})

test('feed', (t) => {
  const fixtures = readFixtures('feed.json')
  console.log(fixtures)
  t.end()
})

// TODO: etc.
