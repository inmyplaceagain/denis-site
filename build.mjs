// Zero-dependency static build. `node build.mjs` -> dist/
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from "node:fs";

const here = new URL("./", import.meta.url);
const P = JSON.parse(readFileSync(new URL("./content/profile.json", here), "utf8"));
const css = readFileSync(new URL("./site.css", here), "utf8");
mkdirSync(new URL("./dist/", here), { recursive: true });
if (existsSync(new URL("./public/", here))) cpSync(new URL("./public/", here), new URL("./dist/", here), { recursive: true });

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const draft = (o) => (o.todo ? ' data-draft="true"' : "");
const slugify = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const first = P.identity.name.split(" ")[0];
const today = new Date().toISOString().slice(0, 10);

// Image placeholder: shows the path where a real file is expected. Drop the file in public/ and rebuild.
const frame = (path, label, cls = "") => {
  const has = existsSync(new URL(`./public/${path}`, here));
  return has
    ? `<figure class="frame-img ${cls}"><img src="/${esc(path)}" alt="${esc(label)}" loading="lazy"></figure>`
    : `<figure class="frame-img ph ${cls}" aria-label="Image placeholder"><span class="ph-l">${esc(label)}</span><span class="ph-p">${esc(path)}</span></figure>`;
};

const list = (a, cls) => `<ul class="marks ${cls}">${a.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
const rows = (a) => a.map((m) => `<div class="row"><dt>${esc(m.k)}</dt><dd>${esc(m.v)}</dd></div>`).join("");

const values = P.person.values.map((v) => `<li${draft(v)}><h3>${esc(v.title)}</h3><p>${esc(v.body)}</p></li>`).join("");

const acts = P.timeline.map((t) => `<li class="act"${draft(t)}>
  <div class="years"><span class="from">${esc(t.from)}</span><span class="to">to ${esc(t.to)}</span><span class="n"></span></div>
  <div>
    <h3>${esc(t.title)}</h3>
    <p class="where">${esc(t.where)}</p>
    <p class="chapter">${esc(t.chapter)}</p>
    <aside class="world"><span class="slug">Meanwhile</span><p>${esc(t.world)}</p></aside>
  </div>
</li>`).join("");

const liveWords = /active|live|pilot|runs|shipped|development|playable/i;
const showItem = (p) => {
  const img = p.image || `projects/${slugify(p.name)}.jpg`;
  const id = slugify(p.name);
  return `<li class="show" id="show-${id}"${draft(p)} data-live="${liveWords.test(p.status) ? 1 : 0}">
  <button class="show-open" type="button" data-deck="${id}" aria-haspopup="dialog" aria-label="Open ${esc(p.name)}">${frame(img, p.name)}</button>
  <div class="show-b">
    <div class="show-h"><h3>${esc(p.name)}</h3><span class="tag">${esc(p.tag)}</span></div>
    <p>${esc(p.one)}</p>
    <p class="status">${esc(p.status)}</p>
  </div>
</li>`;
};
const pro = P.projects.filter((p) => p.kind !== "lab"), lab = P.projects.filter((p) => p.kind === "lab");
const projects = `<div class="sec-sub"><h3>Professionally</h3><p class="small">For employers, clients and the studio. ${pro.length} productions.</p></div><ul class="shows">${pro.map(showItem).join("")}</ul>
  <div class="sec-sub" style="margin-top:var(--s8)"><h3>Own things and the lab</h3><p class="small">Built because I wanted them to exist. ${lab.length} productions.</p></div><ul class="shows">${lab.map(showItem).join("")}</ul>`;

const chips = (a) => a.map((s) => `<span class="chip">${esc(s)}</span>`).join("");
const decks = P.projects.filter((p) => p.deck).map((p) => {
  const id = slugify(p.name), d = p.deck, img = p.image || `projects/${id}.jpg`;
  const slides = [
    `<div class="slide cover"><div class="s-text"><p class="slug">${esc(p.tag)} · ${esc(d.year)}</p><h3>${esc(p.name)}</h3><p class="s-lede">${esc(p.one)}</p></div>${frame(img, p.name, "s-img")}</div>`,
    `<div class="slide"><div class="s-text"><p class="slug">The idea</p><h4>Problem</h4><p>${esc(d.problem)}</p><h4>Bet</h4><p>${esc(d.thesis)}</p></div>${frame(`projects/${id}-2.jpg`, `${p.name}, the idea`, "s-img")}</div>`,
    `<div class="slide"><div class="s-text"><p class="slug">The stack</p><div class="chips">${chips(d.stack)}</div><h4>How it is built</h4><p>${esc(d.built)}</p></div>${frame(`projects/${id}-3.jpg`, `${p.name}, the stack`, "s-img")}</div>`,
    `<div class="slide"><div class="s-text"><p class="slug">Where it stands</p><dl class="manual"><div class="row"><dt>Status</dt><dd>${esc(p.status)}</dd></div><div class="row"><dt>My role</dt><dd>${esc(d.role)}</dd></div><div class="row"><dt>When</dt><dd>${esc(d.year)}</dd></div></dl><p class="s-cta"><a class="btn" href="mailto:${esc(P.identity.email)}?subject=${encodeURIComponent(p.name)}">Ask me about ${esc(p.name)} →</a></p></div></div>`,
  ];
  return `<dialog class="deck" id="deck-${id}" aria-label="${esc(p.name)}">
  <div class="deck-bar"><span class="slug">${esc(p.name)} · <span class="deck-n">1</span>/${slides.length}</span><button class="deck-x" type="button" data-close aria-label="Close">Esc ×</button></div>
  <div class="track">${slides.join("")}</div>
  <div class="deck-nav"><button type="button" data-prev aria-label="Previous slide">←</button><span class="dots">${slides.map((_, i) => `<i${i === 0 ? ' class="on"' : ""}></i>`).join("")}</span><button type="button" data-next aria-label="Next slide">→</button></div>
</dialog>`;
}).join("");

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9+#]/g, "");
const stackIndex = P.projects.filter((p) => p.deck).map((p) => ({ id: slugify(p.name), items: p.deck.stack.map((s) => ({ full: norm(s), words: s.split(/[\s/,()]+/).map(norm).filter(Boolean) })) }));
const techHit = (key, it) => it.full === key || it.words.includes(key) || (key.length >= 6 && it.full.includes(key));
const techWall = (P.tech || []).map((g) => `<div class="tech-group"><h3 class="slug">${esc(g.group)}</h3><div class="chips">${g.items.map((t) => {
  const key = norm(t.split(/[\/(]/)[0]);
  const hits = stackIndex.filter((s) => key.length > 1 && s.items.some((it) => techHit(key, it))).map((s) => s.id);
  return `<button type="button" class="chip tech" data-hits="${hits.join(" ")}" aria-pressed="false">${esc(t)}${hits.length ? `<span class="n">${hits.length}</span>` : ""}</button>`;
}).join("")}</div></div>`).join("");

const S = P.studio;
const studio = !S ? "" : `<section id="studio">
  <div class="sec-head"><h2>The studio</h2><span class="slug">08 / ${esc(S.name)}</span></div>
  <div class="studio-hero">
    <p class="wordmark">${esc(S.wordmark || S.name)}</p>
    <p class="s-lede">${esc(S.tagline)}</p>
  </div>
  <div class="split">
    <div><p class="prose">${esc(S.intro)}</p><p class="prose" style="margin-top:var(--s2)"><span class="slug">My role</span><br>${esc(S.myRole)}</p></div>
    <div><h3>Who makes it</h3><ul class="team">${S.team.map((t) => `<li${draft(t)}><span class="avatar" aria-hidden="true">${esc(t.name[0])}</span><div><b>${esc(t.name)}</b> <span class="slug">${esc(t.role)}</span><p>${esc(t.bio)}</p></div></li>`).join("")}</ul></div>
  </div>
  <p class="slug" style="margin:var(--s6) 0 var(--s2)">How we work · four lines we do not cross</p>
  <ol class="ethos">${S.ethos.map((e, i) => `<li><span class="mono n">0${i + 1}</span><h3>${esc(e.title)}</h3><p>${esc(e.body)}</p></li>`).join("")}</ol>
  <div class="split" style="margin-top:var(--s8)">
    ${S.firstProduct ? `<div class="box"><p class="slug">First product · ${esc(S.firstProduct.status)}</p><h3>${esc(S.firstProduct.name)}</h3><p>${esc(S.firstProduct.one)}</p>${S.firstProduct.deck ? `<button type="button" class="linkish" data-deck="${esc(S.firstProduct.deck)}">Open the deck →</button>` : ""}</div>` : ""}
    ${S.stewardship ? `<div class="box"><p class="slug">How the studio is owned · ${esc(S.stewardship.status)}</p><h3>Built by its people, owned by its people</h3><p>${esc(S.stewardship.body)}</p></div>` : ""}
  </div>
  <div class="cta">${S.url ? `<a class="btn" href="${esc(S.url)}">${esc(S.url.replace(/^https?:\/\//, ""))} →</a>` : ""}${S.email ? `<span class="small">${esc(S.email)}</span>` : ""}</div>
</section>`;

const voices = P.voices.map((v) => `<li><blockquote>${esc(v.quote)}</blockquote><p class="who">${esc(v.who)} · ${esc(v.role)}</p></li>`).join("");
const cards = (a) => a.map((i) => `<li${draft(i)}><h3>${esc(i.title)}</h3><p>${esc(i.body)}</p></li>`).join("");

const navItems = [["person", "Person"], ["timeline", "Timeline"], ["work", "Work"], ["voices", "Voices"], ["into", "Into"], ["together", "Together"], ...(P.studio ? [["studio", "Studio"]] : []), ["agents", "Agents"]];
const nav = navItems.map(([id, l], i) => `<a href="#${id}" data-n="${String(i + 1).padStart(2, "0")}">${l}</a>`).join("");

const shows2 = null;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(P.identity.name)}</title>
<meta name="description" content="${esc(P.agent.summaryHint)}">
<link rel="alternate" type="application/json" href="/profile.json" title="Machine-readable profile">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400;12..96,75..100,500;12..96,75..100,600;12..96,75..100,800&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>
<div class="frame">
<aside class="rail">
  <a class="brand" href="#top">${esc(P.identity.name)}</a>
  <nav aria-label="Sections">${nav}</nav>
  <div class="now">
    <div class="clock" id="clock">--:--</div>
    <div>in Prague. <span id="doing">Probably at the keyboard.</span></div>
    <div style="margin-top:8px"><a href="mailto:${esc(P.identity.email)}">Write to ${esc(first)}</a></div>
  </div>
</aside>

<main class="page">
<header class="hero" id="top">
  <p class="slug rise">INT. <b>PRAGUE</b> — ${today.slice(0, 4)} — DAY</p>
  <h1 class="rise">${esc(first)}<br>${esc(P.identity.name.split(" ").slice(1).join(" "))}<span class="dot">.</span></h1>
  <div class="hero-grid rise">
    <p class="lede">${esc(P.identity.tagline)}</p>
    ${frame("portrait.jpg", `${P.identity.name}, portrait`, "portrait")}
  </div>
  <div class="meta rise">
    <span>${esc(P.identity.location)}</span>
    <span>${P.identity.languages.map(esc).join(" · ")}</span>
    ${P.identity.links.linkedin ? `<a href="${esc(P.identity.links.linkedin)}">LinkedIn</a>` : ""}
    <a href="/profile.json">profile.json</a>
    <a href="/llms.txt">llms.txt</a>
  </div>
</header>

<section id="person">
  <div class="sec-head"><h2>The person, not the role</h2><span class="slug">01 / Who</span></div>
  <p class="prose">${esc(P.person.intro)}</p>
  <ul class="values">${values}</ul>
  <div class="split">
    <div><h3>Energised by</h3>${list(P.person.howIWork.energizedBy, "plus")}</div>
    <div><h3>Drained by</h3>${list(P.person.howIWork.drainedBy, "minus")}</div>
  </div>
  <p class="slug" style="margin-bottom:var(--s2)">Working with ${esc(first)} · the short manual</p>
  <dl class="manual">${rows(P.person.howIWork.manual)}</dl>
</section>

<section id="timeline">
  <div class="sec-head"><h2>Timeline, in context</h2><span class="slug">02 / ${P.timeline.length} acts</span></div>
  <p class="prose">Each chapter next to what was going on in the world at the time. Careers make more sense that way.</p>
  <ol class="acts" style="margin-top:var(--s6)">${acts}</ol>
</section>

<section id="work">
  <div class="sec-head"><h2>What I have built</h2><span class="slug">03 / ${P.projects.length} productions</span></div>
  ${projects}
  <div class="toolbox">
    <div class="sec-sub"><h3>Technologies I have shipped with</h3><p class="small">Tap one to light up the productions that use it. Numbers count productions on this page, not years.</p></div>
    <div class="tech-wall">${techWall}</div>
    <p class="slug" style="margin:var(--s8) 0 var(--s2)">The toolbox, in prose</p>
    <dl class="manual">${rows(P.skills)}</dl>
  </div>
</section>

<section id="voices">
  <div class="sec-head"><h2>What people I worked with say</h2><span class="slug">04 / Voices</span></div>
  <ul class="voices">${voices}</ul>
</section>

<section id="into">
  <div class="sec-head"><h2>What I am into</h2><span class="slug">05 / Off the clock</span></div>
  <ul class="cards">${cards(P.into)}</ul>
</section>

<section id="together">
  <div class="sec-head"><h2>How we could get together</h2><span class="slug">06 / Formats</span></div>
  <ul class="cards">${cards(P.together)}</ul>
  <div class="cta"><a class="btn" href="mailto:${esc(P.identity.email)}">Write to ${esc(first)} →</a><span class="small">${esc(P.agent.contact)}</span></div>
</section>

${studio}

<section id="agents">
  <div class="sec-head"><h2>If you are an agent</h2><span class="slug">${S ? "09" : "08"} / Machine-readable</span></div>
  <div class="term">
    <div class="cmd">curl -s https://YOUR-DOMAIN/llms.txt | head</div>
    <div class="out"><span class="k"># ${esc(P.identity.name)}</span>
${esc(P.agent.summaryHint)}

<span class="k">structured:</span> <a href="/profile.json">/profile.json</a>   <span class="k">plain:</span> <a href="/llms.txt">/llms.txt</a>   <span class="k">contact:</span> ${esc(P.identity.email)}</div>
  </div>
  <div class="fit">
    <div><h3 class="slug" style="margin-bottom:var(--s2)">Good fit signals</h3>${list(P.agent.goodFitSignals, "plus")}</div>
    <div><h3 class="slug" style="margin-bottom:var(--s2)">Poor fit signals</h3>${list(P.agent.poorFitSignals, "minus")}</div>
  </div>
</section>

${decks}
<footer><span>${esc(P.identity.name)} · built from one JSON file</span><span>updated ${today}</span></footer>
</main>
</div>
<script>
(function(){
  var c=document.getElementById('clock'),d=document.getElementById('doing');
  function tick(){try{var n=new Date();var t=n.toLocaleTimeString('en-GB',{timeZone:'Europe/Prague',hour:'2-digit',minute:'2-digit'});c.textContent=t;var h=+t.slice(0,2);d.textContent=h<7?'Asleep, hopefully.':h<12?'Deep work. Email lands later.':h<18?'Calls and reviews.':h<22?'Scratch lessons or a cut in progress.':'Winding down.';}catch(e){}}
  tick();setInterval(tick,30000);
  document.querySelectorAll('.show-open,[data-deck].linkish').forEach(function(btn){btn.addEventListener('click',function(){var d=document.getElementById('deck-'+btn.dataset.deck);if(d)openDeck(d);});});
  function openDeck(d){var track=d.querySelector('.track'),slides=[].slice.call(track.children),i=0,n=d.querySelector('.deck-n'),dots=[].slice.call(d.querySelectorAll('.dots i'));
    function go(k){i=Math.max(0,Math.min(slides.length-1,k));track.style.transform='translateX('+(-i*100)+'%)';n.textContent=i+1;dots.forEach(function(x,j){x.classList.toggle('on',j===i)});}
    function key(e){if(e.key==='ArrowRight')go(i+1);else if(e.key==='ArrowLeft')go(i-1);}
    var x0=null;
    d.querySelector('[data-next]').onclick=function(){go(i+1)};d.querySelector('[data-prev]').onclick=function(){go(i-1)};d.querySelector('[data-close]').onclick=function(){d.close()};
    d.addEventListener('click',function(e){if(e.target===d)d.close()});
    track.ontouchstart=function(e){x0=e.touches[0].clientX};track.ontouchend=function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>40)go(i+(dx<0?1:-1));x0=null};
    d.addEventListener('keydown',key);d.addEventListener('close',function(){document.body.style.overflow='';d.removeEventListener('keydown',key)},{once:true});
    document.body.style.overflow='hidden';go(0);d.showModal();}
  var chips=[].slice.call(document.querySelectorAll('.chip.tech')),shows=[].slice.call(document.querySelectorAll('.show')),walls=[].slice.call(document.querySelectorAll('.shows'));
  chips.forEach(function(c){c.addEventListener('click',function(){var on=c.getAttribute('aria-pressed')==='true';chips.forEach(function(x){x.setAttribute('aria-pressed','false')});
    if(on||!c.dataset.hits){walls.forEach(function(w){w.classList.remove('filtering')});shows.forEach(function(s){s.classList.remove('hit')});return;}
    c.setAttribute('aria-pressed','true');var hits=c.dataset.hits.split(' ');walls.forEach(function(w){w.classList.add('filtering')});shows.forEach(function(s){s.classList.toggle('hit',hits.indexOf(s.id.replace('show-',''))>-1)});
    var f=document.querySelector('.show.hit');if(f)f.scrollIntoView({behavior:'smooth',block:'center'});});});
  var links=[].slice.call(document.querySelectorAll('.rail nav a'));
  var secs=links.map(function(a){return document.querySelector(a.getAttribute('href'))}).filter(Boolean);
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(a){a.removeAttribute('aria-current')});var a=links[secs.indexOf(e.target)];if(a)a.setAttribute('aria-current','true');}})},{rootMargin:'-40% 0px -55% 0px'});secs.forEach(function(s){io.observe(s)});}
})();
</script>
</body>
</html>`;

const llms = `# ${P.identity.name}

> ${P.agent.summaryHint}

Location: ${P.identity.location}
Languages: ${P.identity.languages.join(", ")}
Contact: ${P.identity.email} (${P.agent.contact})
Structured profile: /profile.json

## Values
${P.person.values.map((v) => `- ${v.title}: ${v.body}`).join("\n")}

## How I work
Energised by: ${P.person.howIWork.energizedBy.join("; ")}
Drained by: ${P.person.howIWork.drainedBy.join("; ")}
${P.person.howIWork.manual.map((m) => `- ${m.k}: ${m.v}`).join("\n")}

## Timeline
${P.timeline.map((t) => `- ${t.from} to ${t.to}: ${t.title} (${t.where}). ${t.chapter} Context: ${t.world}`).join("\n")}

## Skills
${P.skills.map((m) => `- ${m.k}: ${m.v}`).join("\n")}

## Projects
${P.projects.map((p) => `- ${p.name} [${p.tag}, ${p.status}]: ${p.one}`).join("\n")}

## Recommendations
${P.voices.map((v) => `- "${v.quote}" (${v.who}, ${v.role})`).join("\n")}

## Interests
${P.into.map((i) => `- ${i.title}: ${i.body}`).join("\n")}

## Ways to collaborate
${P.together.map((i) => `- ${i.title}: ${i.body}`).join("\n")}

## Fit
Good: ${P.agent.goodFitSignals.join("; ")}
Poor: ${P.agent.poorFitSignals.join("; ")}
`;

const out = (f, s) => writeFileSync(new URL(`./dist/${f}`, here), s);
out("index.html", html);
out("llms.txt", llms);
out("profile.json", JSON.stringify(P, null, 2));
const drafts = JSON.stringify(P).match(/"todo":true/g)?.length ?? 0;
const missing = [...html.matchAll(/class="ph-p">([^<]+)</g)].map((m) => m[1]);
console.log(`built dist/ — ${drafts} todo, ${missing.length} image placeholders (put files under public/: ${missing.join(", ")})`);
