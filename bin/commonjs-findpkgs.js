#!/usr/bin/env nodejs

if (process.argv[2] == '-h') {
  console.error('Usage: commonjs-findpkgs [dir] (defaults to working dir)');
  process.exit(1)
}

var dir = process.argv[2];
if (!dir) dir = '.';

var glob = require('glob');
var path = require('path');
var fs = require('fs');
var readJson = require('read-package-json');

glob(path.join(dir, '**/package.json'), function(err, files) {
  if (err) {
    console.error('Error finding package.json files:', err);
    process.exit(1);
  }

  if (files.length == 0) {
    console.log('[]');
    process.exit(0);
  }

  var pkgs = [];
  files.forEach(function(file) {
    readJson(file, function(err, data) {
      if (err) {
        console.error('Error reading ' + file + ':', err);
        process.exit(1);
      }

      var pkgdir = path.dirname(file);

      var libFiles = glob.sync(path.join(pkgdir, 'lib/**/*.js'));
      var mainFile = findMainFile(pkgdir, data.main || 'index');
      if (mainFile && libFiles.indexOf(mainFile) == -1) libFiles.push(mainFile);

      pkgs.push({
        dir: pkgdir,
        packageJSONFile: file,
//        package: data,
        libFiles: libFiles,
        testFiles: glob.sync(path.join(pkgdir, 'test/**/*.js')),
      });
      if (pkgs.length == files.length) console.log(JSON.stringify(pkgs, null, 2));
    });
  });
})

function findMainFile(dir, main) {
  var poss = [main];
  if (!/\.js(on)?$/.test(main)) poss.push(main + '.js', main + '.json');
  var found;
  poss.forEach(function(f) {
    if (fs.existsSync(path.join(dir, f))) found = f;
  });
  if (found) return path.join(dir, found);
}
