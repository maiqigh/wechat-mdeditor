const fs = require('fs');
const path = require('path');
const marked = require('marked');
const FuriganaMD = require('../libs/FuriganaMD.js');

const PROJ_ROOT = path.join(__dirname, '..');

function loadSource(relPath) {
  return fs.readFileSync(path.join(PROJ_ROOT, relPath), 'utf8');
}

const WxRenderer = new Function(
  'marked', 'FuriganaMD',
  loadSource('assets/scripts/renderers/wx-renderer.js') + '\nreturn WxRenderer;'
)(marked, FuriganaMD);

function loadTheme(relPath, exportName) {
  return new Function(loadSource(relPath) + `\nreturn ${exportName};`)();
}

const themes = {
  infoq:   loadTheme('assets/scripts/themes/infoq.js',   'infoqTheme'),
  default: loadTheme('assets/scripts/themes/default.js', 'defaultTheme'),
  lyric:   loadTheme('assets/scripts/themes/lyric.js',   'lyricTheme'),
  lupeng:  loadTheme('assets/scripts/themes/lupeng.js',  'lupengTheme'),
};

const FONTS = {
  sans:  "-apple-system-font,BlinkMacSystemFont, Helvetica Neue, PingFang SC, Hiragino Sans GB , Microsoft YaHei UI , Microsoft YaHei ,Arial,sans-serif",
  serif: "Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, 'PingFang SC', Cambria, Cochin, Georgia, Times, 'Times New Roman', serif",
};

function resolveFont(font) {
  if (!font) return FONTS.sans;
  return FONTS[font] || font;
}

function render(source, { theme = 'infoq', font = 'sans', size = '15px' } = {}) {
  const themeObj = themes[theme];
  if (!themeObj) {
    throw new Error(`Unknown theme "${theme}". Available: ${Object.keys(themes).join(', ')}`);
  }
  const wx = new WxRenderer({ theme: themeObj, fonts: resolveFont(font), size });
  let output = marked(source, { renderer: wx.getRenderer() });
  if (wx.hasFootnotes()) {
    output = output.replace(/(style=".*?)"/, '$1;margin-top: 0"');
    output += wx.buildFootnotes();
    output += wx.buildAddition();
  }
  return output;
}

module.exports = { render, themes: Object.keys(themes) };
