const fs = require("fs");
const path = require("path");

const GTAG_ID = "G-C9E4E778Y8";

const GTAG_SNIPPET = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${GTAG_ID}');
</script>`;

function injectGtag(html) {
  if (html.includes(GTAG_ID)) return html;
  if (!/<head[\s>]/i.test(html)) return html;
  return html.replace(/<head([^>]*)>/i, `<head$1>\n${GTAG_SNIPPET}`);
}

function walkHtmlFiles(dir, callback) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtmlFiles(fullPath, callback);
    else if (entry.name.endsWith(".html")) callback(fullPath);
  }
}

function injectGtagIntoOutputDir(outputDir) {
  walkHtmlFiles(outputDir, (filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    const updated = injectGtag(content);
    if (updated !== content) {
      fs.writeFileSync(filePath, updated, "utf8");
    }
  });
}

module.exports = {
  GTAG_SNIPPET,
  injectGtag,
  injectGtagIntoOutputDir,
};
