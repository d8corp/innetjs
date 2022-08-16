import { Parse } from 'unzipper'

const Writer = require('fstream').Writer;
const path = require('path');
const stream = require('stream');
const duplexer2 = require('duplexer2');
const Promise = require('bluebird');

export function Extract (opts, template) {
  const reduceCount = 19 + template.length
  // make sure path is normalized before using it
  opts.path = path.resolve(path.normalize(opts.path));

  // @ts-ignore
  const parser = new Parse(opts)
  const outStream = new stream.Writable({ objectMode: true })

  outStream._write = function(entry, encoding, cb) {

    if (entry.type === 'Directory') return cb()

    const extractPath = path.join(opts.path, entry.path.slice(reduceCount))
    if (extractPath.indexOf(opts.path) !== 0) {
      return cb();
    }

    const writer = opts.getWriter ? opts.getWriter({path: extractPath}) :  Writer({ path: extractPath });

    entry.pipe(writer)
      .on('error', cb)
      .on('close', cb);
  };

  const extract = duplexer2(parser,outStream);
  parser.once('crx-header', function(crxHeader) {
    extract.crxHeader = crxHeader;
  });

  parser
    .pipe(outStream)
    .on('finish',function() {
      extract.emit('close');
    });

  extract.promise = function() {
    return new Promise(function(resolve, reject) {
      extract.on('close', resolve);
      extract.on('error',reject);
    });
  };

  return extract;
}