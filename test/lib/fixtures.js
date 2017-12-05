const common = require('./common')
const fs = require('fs')
const http = require('http')
const path = require('path')
const stream = require('stream')
const url = require('url')

exports.run = run

function mkArray (obj) {
  if (!obj) return
  return obj instanceof Array ? obj : [obj]
}

function resolve (file) {
  return path.resolve(__dirname, '..', 'data', file)
}

function readSync (file) {
  const p = resolve(file)
  const input = fs.readFileSync(p)
  const json = JSON.parse(input)
  return mkArray(json)
}

function freshRemoteServer (fixture, t) {
  const r = mkArray(fixture.remote)
  if (!r) return

  const fixtures = r.map((f) => {
    return (req, res) => {
      t.is(req.url, f.url)
      res.writeHead(f.statusCode || 404, f.head)

      if (f.file) {
        const p = resolve(f.file)
        stream.createReadStream(p).pipe(res)
      } else {
        res.end(f.payload)
      }
    }
  })

  return http.createServer((req, res) => {
    const f = fixtures.shift()
    f(req, res)
  })
}

function httpRequestOpts (json) {
  let opts = Object.assign(Object.create(null), json)
  opts.port = opts.port || 1337
  return opts
}

function test (server, fixtures, t, cb) {
  const f = fixtures.shift()
  if (!f) {
    return cb()
  }

  const wanted = f.response
  const opts = httpRequestOpts(f.request)

  if (f.title) t.comment(f.title)

  const req = http.request(opts, (res) => {
    t.is(res.statusCode, wanted.statusCode, 'should be status code')
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
      t.same(found, body, 'should be payload')
      test(server, fixtures, t, cb)
    })
    res.resume()
  })

  req.end()
}

function run (file, t, cb) {
  const fixtures = readSync(file)
  const server = common.freshMangerServer()

  function go () {
    server.start((er) => {
      if (er) return cb(er)
      test(server, fixtures, t, (er) => {
        if (er) throw er
        server.stop((er) => {
          if (er) throw er
          if (remoteServer) {
            remoteServer.close((er) => {
              cb(er)
            })
          } else {
            cb()
          }
        })
      })
    })
  }

  const remoteServer = freshRemoteServer(fixtures, t)

  if (remoteServer) {
    remoteServer.listen(1338, (er) => {
      if (er) throw er
      go()
    })
  } else {
    go()
  }
}
