const fs = require("fs");
const path = require("path");

const GTAG_ID = "G-C9E4E778Y8";
const GTM_ID = "GTM-PQF5KVDR";
const INCLUDES_DIR = path.join(__dirname, "..", "_includes");
const CONSENT_SNIPPET = fs
  .readFileSync(path.join(INCLUDES_DIR, "consent-mode.njk"), "utf8")
  .trim();
const COOKIE_BANNER_SNIPPET = fs
  .readFileSync(path.join(INCLUDES_DIR, "cookie-banner.njk"), "utf8")
  .trim();

const GTM_HEAD_SNIPPET = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');</script>
<!-- End Google Tag Manager -->`;

const GTM_BODY_SNIPPET = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

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

function injectGtag(html, options = {}) {
  const skipCookies = Boolean(options.skipCookies);
  let updated = html;
  const hasCookieBanner = updated.includes('id="myma-cookie-banner"');
  const hasGtmHead = updated.includes("googletagmanager.com/gtm.js");
  const hasGtmBody = updated.includes("googletagmanager.com/ns.html");
  const hasGtagHead = updated.includes(`gtag/js?id=${GTAG_ID}`);
  const hasGtagBody = updated.includes("body backup");

  if (/<head[\s>]/i.test(updated)) {
    const headSnippets = [];
    if (!hasGtmHead) headSnippets.push(GTM_HEAD_SNIPPET);
    if (!hasGtagHead) headSnippets.push(GTAG_SNIPPET);
    if (headSnippets.length > 0) {
      updated = updated.replace(
        /<head([^>]*)>/i,
        `<head$1>\n${headSnippets.join("\n")}`
      );
    }
  }

  if (!updated.includes("<!-- Google Consent Mode -->")) {
    if (updated.includes("<!-- Google Tag Manager -->")) {
      updated = updated.replace(
        "<!-- Google Tag Manager -->",
        `${CONSENT_SNIPPET}\n<!-- Google Tag Manager -->`
      );
    } else if (/<head[\s>]/i.test(updated)) {
      updated = updated.replace(/<head([^>]*)>/i, `<head$1>\n${CONSENT_SNIPPET}`);
    }
  }

  if (/<body[\s>]/i.test(updated)) {
    const bodySnippets = [];
    if (!hasGtmBody) bodySnippets.push(GTM_BODY_SNIPPET);
    if (!hasGtagBody) bodySnippets.push(GTAG_BODY_BACKUP);
    if (bodySnippets.length > 0) {
      updated = updated.replace(
        /<body([^>]*)>/i,
        `<body$1>\n${bodySnippets.join("\n")}`
      );
    }
  }

  if (!skipCookies && !hasCookieBanner && /<\/body>/i.test(updated)) {
    updated = updated.replace(/<\/body>/i, `${COOKIE_BANNER_SNIPPET}\n</body>`);
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
    const skipCookies = filePath.includes(`${path.sep}admin${path.sep}`);
    const updated = injectGtag(content, { skipCookies });
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
    const skipCookies = filePath.includes(`${path.sep}admin${path.sep}`);
    const updated = injectGtag(content, { skipCookies });
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
