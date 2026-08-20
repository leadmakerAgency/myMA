const fs = require("fs");
const path = require("path");

const GTAG_ID = "G-C9E4E778Y8";

const GTAG_SNIPPET = `<!-- Google tag (gtag.js) - G-C9E4E778Y8 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${GTAG_ID}');
</script>`;

const GTAG_BODY_BACKUP = `<!-- Google tag (gtag.js) body backup - G-C9E4E778Y8 -->
<script>
  if (!document.querySelector('script[src*="G-C9E4E778Y8"]')) {
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    var gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}';
    document.head.appendChild(gtagScript);
    gtag('config', '${GTAG_ID}');
  }
</script>`;

function injectGtag(html) {
  let updated = html;

  if (!updated.includes(GTAG_ID) && /<head[\s>]/i.test(updated)) {
    updated = updated.replace(/<head([^>]*)>/i, `<head$1>\n${GTAG_SNIPPET}`);
  }

  if (!updated.includes("body backup") && /<body[\s>]/i.test(updated)) {
    updated = updated.replace(/<body([^>]*)>/i, `<body$1>\n${GTAG_BODY_BACKUP}`);
  }

  return updated;
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

function injectGtagIntoSourceFiles(projectRoot) {
  const root = projectRoot || path.join(__dirname, "..");
  const files = fs
    .readdirSync(root)
    .filter((name) => name.endsWith(".html"))
    .map((name) => path.join(root, name));

  files.push(path.join(root, "admin", "index.html"));

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf8");
    const updated = injectGtag(content);
    if (updated !== content) {
      fs.writeFileSync(filePath, updated, "utf8");
    }
  }
}

module.exports = {
  GTAG_SNIPPET,
  injectGtag,
  injectGtagIntoOutputDir,
  injectGtagIntoSourceFiles,
};
