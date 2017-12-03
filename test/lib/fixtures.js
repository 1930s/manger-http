const common = require('./common')
const fs = require('fs')
const url = require('url')
const http = require('http')
const path = require('path')

exports.run = run

function readSync (file) {
  const p = path.resolve(__dirname, '..', 'data', file)
  const input = fs.readFileSync(p)
  const json = JSON.parse(input)
  return json instanceof Array ? json : [json]
}

function ex (server, fixtures, t, cb) {
  const f = fixtures.shift()
  if (!f) {
    return cb()
  }
  let uri = url.format(f.request)
  t.comment(uri)

  const wanted = f.response

  http.get(uri, (res) => {
    t.same(res.statusCode, wanted.statusCode)
    let acc = ''
    res.on('error', (er) => {
      throw er
    })
    res.on('data', (chunk) => {
      acc += chunk
    })
    res.on('end', () => {
      const found = JSON.parse(acc)
      const body = wanted.payload
      t.same(found, body)
      ex(server, fixtures, t, cb)
    })
    res.resume()
  })
}

function run (file, t, cb) {
  const fixtures = readSync(file)
  const server = common.freshMangerServer()
  server.start((er) => {
    if (er) return cb(er)
    ex(server, fixtures, t, (er) => {
      server.stop((serverError) => {
        cb(er || serverError)
      })
    })
  })
}
