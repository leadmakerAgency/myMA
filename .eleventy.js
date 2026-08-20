const { shouldHideInProduction } = require("./lib/post-visibility");
const { injectGtag, injectGtagIntoOutputDir } = require("./lib/gtag");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("blog.css");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("llms.txt");
  eleventyConfig.addPassthroughCopy("_headers");
  eleventyConfig.addPassthroughCopy({ "content/media": "media" });
  eleventyConfig.addPassthroughCopy("admin/");

  const existingPages = [
    "index.html", "about.html", "how-it-works.html", "features.html",
    "features-branded-agent-page.html", "features-plan-comparison.html",
    "features-mobile-app.html", "features-enrollment-dashboard.html",
    "why-myma.html", "pricing.html", "agencies.html", "faq.html",
    "demo.html", "booked-demo.html", "resources.html",
    "compare-call-centers.html", "privacy.html", "terms.html", "disclaimer.html",
  ];
  for (const page of existingPages) {
    eleventyConfig.addPassthroughCopy(page);
  }

  eleventyConfig.addFilter("rangeFromOne", (end) => {
    const n = Math.max(1, Math.floor(Number(end)));
    return Array.from({ length: n }, (_, i) => i + 1);
  });

  eleventyConfig.addFilter("blogPageCount", (postCount, pageSize) => {
    const count = Number(postCount);
    const size = Number(pageSize) || 15;
    return Math.max(1, Math.ceil(count / size));
  });

  eleventyConfig.addFilter("atomDate", (value) => {
    if (!value) return new Date(0).toISOString();
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return new Date(0).toISOString();
    return date.toISOString();
  });

  eleventyConfig.addFilter("isoDate", (value) => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  });

  eleventyConfig.addFilter("postDate", (value) => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      year: "numeric",
      month: "long",
    });
  });

  eleventyConfig.addFilter("readingTime", (content) => {
    if (!content) return "1 min read";
    const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 230));
    return `${minutes} min read`;
  });

  eleventyConfig.addFilter("relatedPosts", (posts, currentUrl, currentTags, limit) => {
    limit = limit || 3;
    const tags = (currentTags || []).map((t) => t.toLowerCase());

    const candidates = posts.filter((p) => p.url !== currentUrl);
    if (tags.length === 0) return candidates.slice(0, limit);

    const scored = candidates.map((p) => {
      const pTags = (p.data.tags || []).map((t) => t.toLowerCase());
      const overlap = tags.filter((t) => pTags.includes(t)).length;
      return { post: p, score: overlap };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.post);
  });

  eleventyConfig.addCollection("posts", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("content/posts/*.md")
      .filter((post) =>
        !shouldHideInProduction({
          date: post.date,
          draft: post.data?.draft,
        })
      )
      .sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addTransform("inject-gtag", (content, outputPath) => {
    if (!outputPath || !outputPath.endsWith(".html")) return content;
    return injectGtag(content);
  });

  eleventyConfig.on("eleventy.after", ({ dir }) => {
    injectGtagIntoOutputDir(dir.output);
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
    },
    htmlTemplateEngine: false,
    markdownTemplateEngine: "njk",
    templateFormats: ["md", "njk"],
  };
};
