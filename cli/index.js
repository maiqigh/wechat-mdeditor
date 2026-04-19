#!/usr/bin/env node
const fs = require('fs');
const { render, themes } = require('./renderer');
const { copyHtmlToClipboard } = require('./clipboard-mac');

function printHelp() {
  process.stdout.write(`Usage: wxmd [options] [input.md]

Convert Markdown to WeChat-compatible inline-styled HTML.
Reads from stdin when no input file is given.

Options:
  -o, --output <file>   Write HTML to file
  -c, --clip            Copy rich HTML to clipboard (macOS)
  -t, --theme <name>    Theme: ${themes.join(', ')} (default: infoq)
  -f, --font <name>     Font: sans | serif | <css font-family> (default: sans)
  -s, --size <px>       Base font size, e.g. 15px (default: 15px)
  -h, --help            Show this help

If neither --output nor --clip is given, HTML is written to stdout.
--output and --clip can be combined.

Examples:
  wxmd post.md -c
  wxmd post.md -o post.html
  cat post.md | wxmd -c -t lyric -s 16px
`);
}

function parseArgs(argv) {
  const opts = { theme: 'infoq', font: 'sans', size: '15px', output: null, clip: false, help: false, input: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const need = (name) => {
      const v = argv[++i];
      if (v === undefined) {
        process.stderr.write(`Missing value for ${name}\n`);
        process.exit(2);
      }
      return v;
    };
    switch (a) {
      case '-h': case '--help':   opts.help = true; break;
      case '-o': case '--output': opts.output = need(a); break;
      case '-c': case '--clip':   opts.clip = true; break;
      case '-t': case '--theme':  opts.theme = need(a); break;
      case '-f': case '--font':   opts.font = need(a); break;
      case '-s': case '--size':   opts.size = need(a); break;
      default:
        if (a.startsWith('-')) {
          process.stderr.write(`Unknown option: ${a}\n`);
          process.exit(2);
        }
        if (opts.input) {
          process.stderr.write(`Unexpected argument: ${a}\n`);
          process.exit(2);
        }
        opts.input = a;
    }
  }
  return opts;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

(async () => {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { printHelp(); return; }

  let source;
  if (opts.input) {
    source = fs.readFileSync(opts.input, 'utf8');
  } else if (!process.stdin.isTTY) {
    source = await readStdin();
  } else {
    printHelp();
    process.exit(1);
  }

  const html = render(source, { theme: opts.theme, font: opts.font, size: opts.size });

  if (opts.output) {
    fs.writeFileSync(opts.output, html, 'utf8');
    process.stderr.write(`Wrote ${html.length} bytes to ${opts.output}\n`);
  }
  if (opts.clip) {
    copyHtmlToClipboard(html);
    process.stderr.write('Copied rich HTML to clipboard. Paste into WeChat editor with Cmd+V.\n');
  }
  if (!opts.output && !opts.clip) {
    process.stdout.write(html);
  }
})().catch(err => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
