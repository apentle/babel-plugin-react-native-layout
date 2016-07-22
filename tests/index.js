'use strict';

const chalk = require('chalk');
const diff = require('diff');
const fs = require('fs');
const path = require('path');
const babel = require('babel-core');

const pluginPath = require.resolve('./node_modules/babel-plugin-react-native-layout/lib');

// Run each test case
var error = 0;

function normalizeLines(str) {
  return str.trimRight().replace(/\r\n/g, '\n');
}

function runTest(dir) {
  var options = {};
  fs.readdirSync(dir.path).map(item => {
    if (item == 'options.json') {
      options = JSON.parse(fs.readFileSync(dir.path + '/options.json', 'utf8'));
    };
  });

  var output = babel.transformFileSync(dir.path + '/actual.js', {
    plugins: [
      'syntax-jsx',
      [pluginPath, options]
    ]
  });
  var expected = fs.readFileSync(dir.path + '/expected.js', 'utf8');

  var diffs = diff.diffLines(normalizeLines(output.code), normalizeLines(expected));
  if (diffs.length == 1) {
    process.stdout.write(chalk.bgGreen.white(' PASS '));
    process.stdout.write(chalk.green(' ' + dir.name));
  } else {
    process.stdout.write(chalk.bgRed.white(' ERR '));
    process.stdout.write(chalk.red(' ' + dir.name + '\n'));
    error++;
    diffs.forEach(part => {
      var value = part.value;
      if (part.added) {
        value = chalk.green(part.value);
      } else if (part.removed) {
        value = chalk.red(part.value);
      }
      process.stdout.write(value);
    });
  }

  process.stdout.write('\n');
}

function recursiveTest(dir) {
  fs.readdirSync(dir).map(item => {
    if (item === 'actual.js') {
      runTest({
        path: dir,
        name: dir.substr(dir.lastIndexOf('tests') + 6)
      });
    } else {
      var dirPath = path.join(dir, item);
      if (fs.statSync(dirPath).isDirectory()) {
        recursiveTest(dirPath);
      }
    }
  });
}

// Start to test
recursiveTest(__dirname);

process.exit(error);
