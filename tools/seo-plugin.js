// Vite plugin: search-engine setup for the bilingual home page.
//
// index.html holds both languages (<span lang="ja"> / <span lang="en">), and the page switches in place.
// For search engines each language also gets its own URL:
//   /    Japanese (index.html)
//   /en  English  (en/index.html, written at build time from the finished index.html)
// Head tags that differ by language carry the English value in data-en="…"; the Japanese file drops
// those attributes and the English file swaps them in. Structured data (JSON-LD) comes from
// src/seo/schema.js, and the FAQPage data is read straight from the FAQ section, so it always matches.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { structuredData, companyStructuredData, recordStructuredData } from '../src/seo/schema.js';

// Japanese-only extra pages and their structured data (each page's own FAQ, if any, becomes a FAQPage too)
const EXTRA_PAGES = { company: companyStructuredData, record: recordStructuredData };

const ldTag = (id, data) =>
  `<script type="application/ld+json" id="${id}">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

const decode = (s) =>
  s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const text = (s) => decode(s.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

/** Text of every <span lang="…"> of one language inside a fragment (nested spans included). */
function langText(fragment, l) {
  const out = [];
  const re = new RegExp(`<span lang="${l}">`, 'g');
  let m;
  while ((m = re.exec(fragment))) {
    // walk to the matching </span>
    let depth = 1, i = re.lastIndex;
    const tag = /<span\b[^>]*>|<\/span>/g;
    tag.lastIndex = i;
    let t;
    while (depth && (t = tag.exec(fragment))) depth += t[0] === '</span>' ? -1 : 1;
    out.push(text(fragment.slice(i, t ? t.index : fragment.length)));
    re.lastIndex = t ? tag.lastIndex : fragment.length;
  }
  return out.join(' ').trim();
}

/** FAQPage from the visible FAQ section: <details class="faq-item"><summary>Q</summary><div class="faq-a">A</div></details> */
export function faqData(html, l) {
  const items = [...html.matchAll(/<details class="faq-item"[^>]*>([\s\S]*?)<\/details>/g)].map(([, body]) => {
    body = body.replace(/<span class="faq-(q|mark)"[^>]*>[^<]*<\/span>/g, '');
    const q = body.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] ?? '';
    const a = body.match(/<div class="faq-a">([\s\S]*?)<\/div>\s*$/)?.[1] ?? '';
    return { q: langText(q, l) || text(q), a: langText(a, l) || text(a) };
  }).filter((x) => x.q && x.a);
  if (!items.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: l,
    mainEntity: items.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}

function withStructuredData(html, l) {
  html = html.replace(/<script type="application\/ld\+json" id="ld-(site|faq)">[\s\S]*?<\/script>\n?/g, '');
  const faq = faqData(html, l);
  const tags = ldTag('ld-site', structuredData(l)) + '\n' + (faq ? ldTag('ld-faq', faq) + '\n' : '');
  return html.replace('</head>', `${tags}</head>`);
}

const stripEn = (html) => html.replace(/\sdata-en="[^"]*"/g, '');

export function toEnglish(html) {
  html = html.replace(/<html lang="ja"/, '<html lang="en"');
  html = html.replace(/<title data-en="([^"]*)">[^<]*<\/title>/, '<title>$1</title>');
  html = html.replace(/<(meta|link)\b([^>]*?)\sdata-en="([^"]*)"([^>]*)>/g, (_, tag, a, en, b) => {
    const attrs = a + b;
    const key = /\scontent="/.test(attrs) ? 'content' : 'href';
    return `<${tag}${attrs.replace(new RegExp(`\\s${key}="[^"]*"`), ` ${key}="${en}"`)}>`;
  });
  return stripEn(withStructuredData(html, 'en'));
}

/** llms-full.txt = llms.txt + every FAQ answer on the site, in Japanese and English, for AI assistants. */
async function writeLlmsFull(outDir, homeHtml) {
  const base = await readFile(resolve(outDir, 'llms.txt'), 'utf8');
  const qa = (data) => (data?.mainEntity ?? []).map((x) => `### ${x.name}\n\n${x.acceptedAnswer.text}\n`).join('\n');
  let out = base.trimEnd() + '\n\n## FAQ（日本語） — https://yukilab.co/#faq\n\n' + qa(faqData(homeHtml, 'ja'));
  out += '\n## FAQ (English) — https://yukilab.co/en#faq\n\n' + qa(faqData(homeHtml, 'en'));
  try {
    const rec = await readFile(resolve(outDir, 'record.html'), 'utf8');
    out += '\n## 裕輝レコード FAQ — https://yukilab.co/record\n\n' + qa(faqData(rec, 'ja'));
  } catch {}
  await writeFile(resolve(outDir, 'llms-full.txt'), out);
}

export default function seoPages() {
  let outDir = 'dist';
  let root = process.cwd();
  return {
    name: 'yukilab-seo-pages',
    configResolved(c) { root = c.root; outDir = resolve(c.root, c.build.outDir); },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const extra = ctx.filename.match(/(?:^|\/)(\w+)\.html$/)?.[1];
        if (EXTRA_PAGES[extra]) {
          const faq = faqData(html, 'ja');
          return html.replace('</head>', `${ldTag('ld-site', EXTRA_PAGES[extra]())}\n${faq ? ldTag('ld-faq', faq) + '\n' : ''}</head>`);
        }
        if (!/(^|\/)index\.html$/.test(ctx.filename)) return html;
        return withStructuredData(html, 'ja');
      },
    },
    // dev server: serve the English page at /en too
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!/^\/en\/?(\?|#|$)/.test(req.url)) return next();
        try {
          const raw = await readFile(resolve(root, 'index.html'), 'utf8');
          const html = toEnglish(await server.transformIndexHtml('/index.html', raw, req.originalUrl));
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        } catch (e) { next(e); }
      });
    },
    async writeBundle() {
      const file = resolve(outDir, 'index.html');
      const html = await readFile(file, 'utf8');
      await mkdir(resolve(outDir, 'en'), { recursive: true });
      await writeFile(resolve(outDir, 'en', 'index.html'), toEnglish(html));
      await writeFile(file, stripEn(html));
      await writeLlmsFull(outDir, html);
    },
  };
}
