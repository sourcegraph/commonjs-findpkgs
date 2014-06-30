#!/usr/bin/env nodejs

var path = require('path');

if (process.argv[2] == '-h') {
  console.error('Usage: commonjs-findpkgs [dir] (defaults to working dir)');
  process.exit(1)
}

var ignores;
if (process.argv[2] == '--ignore') {
  ignores = JSON.parse(process.argv[3]);
  process.argv.splice(2, 2);
}

var dir = process.argv[2];
if (!dir) dir = '.';

// make ignores relative to dir
if (ignores) {
  for (var i = 0; i < ignores.length; i++) {
    ignores[i] = path.join(dir, ignores[i]);
  }
}

console.error('ignores are:', ignores);

var glob = require('glob');
var path = require('path');
var fs = require('fs');
var readJson = require('read-package-json');

glob(path.join(dir, '**/package.json'), function(err, files) {
  if (err) {
    console.error('Error finding package.json files:', err);
    process.exit(1);
  }

  // check that files are not ignored
  files = files.filter(function(file) {
    if (ignores) {
      for (var i = 0; i < ignores.length; i++) {
        if (file.indexOf(ignores[i]) == 0) return false; // skip processing file
      }
    }
    return true;
  });


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
        package: data,
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
