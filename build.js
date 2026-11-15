
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const folder = "content/articles";
const output = "articles";
const escapeHTML = (s) => String(s ?? "").replace(/[&<>"']/g,
  c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

fs.mkdirSync(output, { recursive: true });

const articles = fs.existsSync(folder)
  ? fs.readdirSync(folder).filter(f => f.endsWith(".md")).map(file => {
      const raw = fs.readFileSync(path.join(folder, file), "utf8");
      const { data, content } = matter(raw);
      return {
        title: data.title || "Untitled",
        description: data.description || "",
        category: data.category || "Life in Canada",
        date: data.date ? new Date(data.date) : new Date(0),
        image: data.image || "",
        slug: path.basename(file, ".md"),
        body: marked.parse(content)
      };
    }).sort((a,b) => b.date - a.date)
  : [];

const styles = `
body{margin:0;background:#f6f8f8;color:#1b303d;font:16px/1.75 Arial,sans-serif}
header{background:#102b3a;color:white;padding:20px}
header a{color:white;text-decoration:none;font-weight:bold}
main{max-width:800px;margin:45px auto;padding:35px;background:white;border-radius:9px}
h1,h2{font-family:Georgia,serif;line-height:1.25}
h1{font-size:clamp(30px,5vw,46px)}
p,li{overflow-wrap:anywhere}
img{max-width:100%;height:auto}
a{color:#087f82}
.meta{color:#61717a;font-size:14px}
@media(max-width:600px){main{margin:15px;padding:20px}}
`;

for (const article of articles) {
  const date = Number.isNaN(article.date.getTime()) ? "" :
    article.date.toLocaleDateString("en-CA", {timeZone:"UTC",year:"numeric",month:"long",day:"numeric"});
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHTML(article.title)} | Beginners Guide to Canada</title>
<meta name="description" content="${escapeHTML(article.description)}">
<link rel="canonical" href="https://beginnersguidetocanada.ca/articles/${encodeURIComponent(article.slug)}/">
<style>${styles}</style></head><body>
<header><a href="/">← Beginners Guide to Canada</a></header>
<main><p class="meta">${escapeHTML(article.category)} · ${escapeHTML(date)}</p>
<h1>${escapeHTML(article.title)}</h1>
${article.image ? `<img src="${escapeHTML(article.image)}" alt="">` : ""}
${article.body}
<p><a href="/">← Back to homepage</a></p>
</main></body></html>`;
  const dir = path.join(output, article.slug);
  fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(path.join(dir,"index.html"),html);
}

const cards = articles.map(a => `
<a class="card" href="/articles/${encodeURIComponent(a.slug)}/"
style="padding:23px;display:block">
<div class="eyebrow">${escapeHTML(a.category)}</div>
<h3>${escapeHTML(a.title)}</h3>
<p>${escapeHTML(a.description)}</p>
<span class="link">Read article →</span>
</a>`).join("");

const section = `
<!-- BG2C ARTICLES START -->
<section class="section" id="latest-articles">
<div class="container">
<div class="section-heading"><div>
<div class="eyebrow">From our blog</div>
<h2>Latest Articles</h2>
</div></div>
<div class="cards">${cards || "<p>Articles coming soon.</p>"}</div>
</div></section>
<!-- BG2C ARTICLES END -->`;

const home = "index.html";
let html = fs.readFileSync(home,"utf8");
html = html.replace(
  /<!-- BG2C ARTICLES START -->[\s\S]*?<!-- BG2C ARTICLES END -->/g,
  ""
);
const guidesBoundary = '</section>\\n<section class="section band" id="topics">';
if (!html.includes(guidesBoundary)) {
  throw new Error('Could not find the end of the featured guides section in index.html');
}
html = html.replace(guidesBoundary, '</section>\\n' + section + '\\n<section class="section band" id="topics">');
fs.writeFileSync(home,html);

console.log(`Generated ${articles.length} article pages.`);
