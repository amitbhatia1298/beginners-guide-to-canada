
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const googleAnalyticsTag = `<!-- Google tag (gtag.js) - BG2C GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-F21V3RCM3S"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-F21V3RCM3S');
</script>`;

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
        imageAlt: data.image_alt || data.title || "",
        slug: path.basename(file, ".md"),
        body: (() => {
          // Generate stable heading IDs so article table-of-contents links work
          // on the built website, not only in GitHub's Markdown preview.
          // Marked v15 does not expose Slugger on the marked object.
          // Build stable heading IDs from rendered heading text instead.
          const seenHeadingIds = new Map();
          const renderer = new marked.Renderer();
          renderer.heading = function ({ tokens, depth }) {
            // The page template already prints the article title as its single H1.
            // Skip the duplicate Markdown H1; retain H2/H3 headings and their IDs.
            if (depth === 1) return "";
            const inline = this.parser.parseInline(tokens);
            const plainText = inline
              .replace(/<[^>]*>/g, "")
              .replace(/&amp;/g, "&")
              .replace(/&quot;/g, '"')
              .replace(/&#39;|&apos;/g, "'")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">");
            const baseId = plainText
              .toLowerCase()
              .normalize("NFKD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^\p{L}\p{N}\s-]/gu, "")
              .trim()
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-");
            const occurrence = seenHeadingIds.get(baseId) || 0;
            seenHeadingIds.set(baseId, occurrence + 1);
            const id = occurrence ? `${baseId}-${occurrence}` : baseId;
            return `<h${depth} id="${escapeHTML(id)}">${inline}</h${depth}>\n`;
          };
          renderer.table = function ({ header, rows }) {
            const headerHtml = header.map(cell => `<th>${this.parser.parseInline(cell.tokens)}</th>`).join("");
            const rowsHtml = rows.map(row => `<tr>${row.map(cell => `<td>${this.parser.parseInline(cell.tokens)}</td>`).join("")}</tr>`).join("");
            return `<div class="table-wrap"><table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></div>\n`;
          };
          return marked.parse(content, { renderer, gfm: true });
        })()
      };
    }).sort((a,b) => b.date - a.date)
  : [];

const categories = [
  {
    "name": "Immigration & Permanent Residence",
    "slug": "immigration-permanent-residence",
    "desc": "Express Entry, PNP, family sponsorship and permanent residence",
    "icon": "🍁"
  },
  {
    "name": "Work & Careers",
    "slug": "work-careers",
    "desc": "Work permits, job searches, resumes and careers",
    "icon": "💼"
  },
  {
    "name": "Study in Canada",
    "slug": "study-in-canada",
    "desc": "Study permits, schools, tuition and student life",
    "icon": "🎓"
  },
  {
    "name": "Visit Canada",
    "slug": "visit-canada",
    "desc": "Visitor visas, Super Visa, extensions and travel",
    "icon": "✈️"
  },
  {
    "name": "Canadian Citizenship",
    "slug": "canadian-citizenship",
    "desc": "Citizenship eligibility, applications and passports",
    "icon": "📘"
  },
  {
    "name": "Housing & Real Estate",
    "slug": "housing-real-estate",
    "desc": "Renting, buying a home, mortgages and tenant rights",
    "icon": "🏠"
  },
  {
    "name": "Banking, Finance & Taxes",
    "slug": "banking-finance-taxes",
    "desc": "Bank accounts, credit, taxes, savings and benefits",
    "icon": "💳"
  },
  {
    "name": "Healthcare & Insurance",
    "slug": "healthcare-insurance",
    "desc": "Provincial health coverage, doctors and insurance",
    "icon": "🩺"
  },
  {
    "name": "Life in Canada",
    "slug": "life-in-canada",
    "desc": "First steps, documents, transportation and daily life",
    "icon": "🌆"
  },
  {
    "name": "Provinces & Territories",
    "slug": "provinces-territories",
    "desc": "Compare provinces, cities and settlement options",
    "icon": "🗺️"
  }
];
const categorySlug = new Map(categories.map(c => [c.name.toLowerCase(), c.slug]));
const categoryBySlug = new Map(categories.map(c => [c.slug, c]));

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
/* Readable, responsive Markdown tables */
.table-wrap{max-width:100%;overflow-x:auto;margin:22px 0}
table{width:100%;border-collapse:collapse;border-spacing:0;font-size:15px;line-height:1.55}
thead{background:#eef5f5}
th,td{padding:12px 14px;border:1px solid #dce5e7;text-align:left;vertical-align:top}
th{color:#183746;font-weight:700}
tbody tr:nth-child(even){background:#f8fbfb}
tbody tr:hover{background:#f0f7f6}
td p,th p{margin:0}
.back-to-top{position:fixed;right:20px;bottom:20px;width:38px;height:38px;display:grid;place-items:center;border:1px solid #dce5e7;border-radius:50%;background:rgba(255,255,255,.94);color:#45616c;text-decoration:none;font:22px/1 Arial,sans-serif;box-shadow:0 2px 9px rgba(16,43,58,.12);opacity:0;visibility:hidden;transform:translateY(5px);transition:opacity .18s ease,transform .18s ease,visibility .18s;z-index:5}
.back-to-top.visible{opacity:.82;visibility:visible;transform:translateY(0)}
.back-to-top:hover,.back-to-top:focus-visible{opacity:1;color:#087f82;outline:2px solid #087f82;outline-offset:3px}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.back-to-top{transition:none}}
@media(max-width:600px){main{margin:15px;padding:20px}.back-to-top{right:12px;bottom:max(12px,env(safe-area-inset-bottom));width:36px;height:36px}}
`;

for (const article of articles) {
  const date = Number.isNaN(article.date.getTime()) ? "" :
    article.date.toLocaleDateString("en-CA", {timeZone:"UTC",year:"numeric",month:"long",day:"numeric"});
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${googleAnalyticsTag}
<title>${escapeHTML(article.title)} | Beginners Guide to Canada</title>
<meta name="description" content="${escapeHTML(article.description)}">
<link rel="canonical" href="https://beginnersguidetocanada.ca/articles/${encodeURIComponent(article.slug)}/">
<style>${styles}</style></head><body id="top">
<header><a href="/">← Beginners Guide to Canada</a></header>
<main><p class="meta">${escapeHTML(article.category)} · ${escapeHTML(date)}</p>
<h1>${escapeHTML(article.title)}</h1>
${article.image ? `<img src="${escapeHTML(article.image)}" alt="${escapeHTML(article.imageAlt)}" loading="lazy" decoding="async">` : ""}
${article.body}
<p><a href="/">← Back to homepage</a></p>
</main>
<a class="back-to-top" href="#top" aria-label="Back to top" title="Back to top">↑</a>
<script>
(function(){
  const control=document.querySelector(".back-to-top");
  if(!control)return;
  function update(){control.classList.toggle("visible",window.scrollY>450);}
  window.addEventListener("scroll",update,{passive:true});
  update();
})();
</script>
</body></html>`;
  const dir = path.join(output, article.slug);
  fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(path.join(dir,"index.html"),html);
}

const cards = articles.map(a => {
  const date = Number.isNaN(a.date.getTime()) ? "" :
    a.date.toLocaleDateString("en-CA", {timeZone:"UTC",year:"numeric",month:"long",day:"numeric"});
  return `
<a class="card" href="/articles/${encodeURIComponent(a.slug)}/"
style="padding:23px;display:block">
<div class="eyebrow">${escapeHTML(a.category)}</div>
<h3>${escapeHTML(a.title)}</h3>
<p>${escapeHTML(a.description)}</p>
<p class="meta">${escapeHTML(date)}</p>
<span class="link">Read article →</span>
</a>`;
}).join("");

const section = `
<!-- BG2C ARTICLES START -->
<section class="section" id="latest-articles">
<div class="container">
<div class="section-heading"><div>
<div class="eyebrow">From our blog</div>
<h2>Latest Articles</h2>
</div><p>Fresh, practical guides and explainers from BG2C.</p></div>
<div class="cards">${cards || '<p class="empty">Our first articles are being prepared. In the meantime, <a href="#topics">explore all topics</a>.</p>'}</div>
</div></section>
<!-- BG2C ARTICLES END -->`;

const home = "index.html";
let html = fs.readFileSync(home,"utf8");
html = html.replace(
  /<!-- BG2C ARTICLES START -->[\s\S]*?<!-- BG2C ARTICLES END -->/g,
  ""
);
const topicsIndex = html.indexOf('<section class="section band" id="topics">');
if (topicsIndex === -1) {
  throw new Error('Could not find the Explore by Topic section in index.html');
}
html = html.slice(0, topicsIndex) + section + '\n' + html.slice(topicsIndex);
fs.writeFileSync(home,html);


for (const category of categories) {
  const items = articles.filter(a => categorySlug.get(String(a.category).toLowerCase()) === category.slug);
  const cards = items.map(a => `<article class="card"><div class="card-body"><div class="eyebrow">${escapeHTML(a.category)}</div><h2><a href="/articles/${encodeURIComponent(a.slug)}/">${escapeHTML(a.title)}</a></h2><p>${escapeHTML(a.description)}</p><p class="meta">${escapeHTML(a.date.toLocaleDateString("en-CA",{timeZone:"UTC",year:"numeric",month:"long",day:"numeric"}))}</p><a class="link" href="/articles/${encodeURIComponent(a.slug)}/">Read article →</a></div></article>`).join("");
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${googleAnalyticsTag}<title>${escapeHTML(category.name)} | Beginners Guide to Canada</title><meta name="description" content="${escapeHTML(category.desc)}. Practical, beginner-friendly information from Beginners Guide to Canada."><link rel="canonical" href="https://beginnersguidetocanada.ca/category/${category.slug}/"><style>
:root{--navy:#102b3a;--teal:#087f82;--ink:#1b303d;--muted:#61717a;--line:#dce5e7;--paper:#f6f8f8}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.65 Arial,sans-serif}header{background:var(--navy);padding:20px max(20px,calc((100% - 1100px)/2))}header a{color:white;text-decoration:none;font-weight:bold}.wrap{max-width:1100px;margin:42px auto;padding:0 20px}.intro,.card{background:white;border:1px solid var(--line);border-radius:9px}.intro{padding:30px;margin-bottom:22px}.eyebrow{color:var(--teal);font-size:12px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase}h1,h2{font-family:Georgia,serif;line-height:1.2}h1{font-size:clamp(32px,5vw,48px);margin:10px 0}h2{font-size:23px}.muted,p{color:var(--muted)}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.card-body{padding:24px}.link{color:var(--teal);font-weight:bold}.empty{background:white;padding:26px;border:1px solid var(--line);border-radius:8px}@media(max-width:650px){.cards{grid-template-columns:1fr}.wrap{margin:22px auto}.intro{padding:22px}}</style></head><body><header><a href="/">← Beginners Guide to Canada</a></header><main class="wrap"><section class="intro"><div class="eyebrow">${category.icon} BG2C Topic Guide</div><h1>${escapeHTML(category.name)}</h1><p>${escapeHTML(category.desc)}. Explore clear, practical explainers designed to help you understand your options and next steps.</p><p><a href="/">Home</a> / ${escapeHTML(category.name)}</p></section><section><div class="eyebrow">Browse this topic</div><h2>Articles and guides</h2>${cards || '<div class="empty"><strong>Guides are being developed.</strong><p>We are preparing detailed, carefully researched articles for this topic. Please check back soon.</p><a href="/">Explore other BG2C topics →</a></div>'}</section></main></body></html>`;
  const dir = path.join("category", category.slug);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,"index.html"),page);
}

console.log(`Generated ${articles.length} article pages.`);

// Generate search-engine discovery files on every production build.
const siteUrl = "https://beginnersguidetocanada.ca";
const staticPaths = [
  "/",
  "/privacy/",
  "/terms/",
  "/disclaimer/",
  "/editorial-policy/",
  "/contact/",
  ...categories.map(category => `/category/${category.slug}/`),
  ...articles.map(article => `/articles/${encodeURIComponent(article.slug)}/`)
];
const uniquePaths = [...new Set(staticPaths)];
const xmlEscape = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniquePaths.map(route => `  <url><loc>${xmlEscape(siteUrl + route)}</loc></url>`).join("\n")}
</urlset>
`;
fs.writeFileSync("sitemap.xml", sitemap);
fs.writeFileSync("robots.txt", `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${siteUrl}/sitemap.xml
`);
console.log(`Generated sitemap.xml with ${uniquePaths.length} URLs and robots.txt.`);
