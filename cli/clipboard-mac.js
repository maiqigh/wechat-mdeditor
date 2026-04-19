const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function copyHtmlToClipboard(html) {
  if (process.platform !== 'darwin') {
    throw new Error('Rich HTML clipboard is only supported on macOS. Use -o to write a file, or pipe to pbcopy for plain text.');
  }
  const tmpPath = path.join(os.tmpdir(), `wxmd-${process.pid}-${Date.now()}.html`);
  fs.writeFileSync(tmpPath, html, 'utf8');
  try {
    const script = `set the clipboard to (read (POSIX file ${JSON.stringify(tmpPath)}) as \u00ABclass HTML\u00BB)`;
    execFileSync('osascript', ['-e', script], { stdio: ['ignore', 'ignore', 'pipe'] });
  } finally {
    try { fs.unlinkSync(tmpPath); } catch (_) {}
  }
}

module.exports = { copyHtmlToClipboard };
