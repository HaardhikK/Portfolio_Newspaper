"use strict";

/* ------------------------------------------------------------------ *
 * Haardhik Kunder — single-page portfolio
 * Routes: #home  #blog  #blog/{id}  #projects  #contact
 * Content is fetched from data/*.json when served over http(s); opened
 * straight from disk (file://) it falls back to the embedded copy below.
 * Keep FALLBACK_DATA in sync with data/*.json.
 * ------------------------------------------------------------------ */

const FALLBACK_DATA = {
  profile: {
    name: "Haardhik Ratnakar Kunder",
    meta: "kunderhaardhik@gmail.com · Dresden, Germany",
    tagline: "I build AI systems, chase strange questions, and occasionally pretend this was the plan.",
    intro: "My interests sit around LLM architecture, agents, AI in medicine, and autodiscovery, especially systems that can run parts of a research loop on their own. I keep drifting toward robotics and AI alignment because they make the same question harder: how do you get models to act usefully in a world that is messy, physical, and not written like a benchmark?",
    intro2: "A lot of what I work on starts as a question I cannot put down. How should agents share what they know without burying each other in text, when should a model slow down and actually think, how do you learn from data that no one had time to label. Some of those questions become blog notes, and a few grow into projects.",
    intro3: "A project close to me is Spending Rail, a banking layer for autonomous agents picked for Phase 2 of the TinyFish Accelerator, backed by Mango Capital with access to a 2 million dollar seed pool. I also spend a probably unreasonable amount of time on AI Twitter, YouTube talks, newsletters, and paper threads, mostly because I want to know what is changing and understand as much of it as I can.",
    interests: "Lately I care more about making models think well than making them bigger. My thesis, Arthantar, was built around that idea: smaller language models can beat larger ones on hard translation when the framework gives them coreference, gender, and graph context first. My newer work looks at agents coordinating through hidden states instead of long text messages, and an earlier paper of mine used topic models to read disaster tweets.",
    interests2: "When the research loop gets too loud, I usually end up sketching, revisiting a Beyblade idea, or watching a dense talk that sends me back into my notes. The serious and non-serious parts are not fully separate; both are me trying to understand why a system behaves the way it does.",
    hobbies: "Away from the screen, my favourite anime is Steins;Gate and my favourite manga is Oyasumi PunPun. The rest of my downtime goes to drawing, small mechanical obsessions, and keeping an eye on where AI is headed next.",
    email: "kunderhaardhik@gmail.com",
    socials: {
      github: "HaardhikK",
      githubUrl: "https://github.com/HaardhikK",
      linkedin: "haardhik-kunder",
      linkedinUrl: "https://linkedin.com/in/haardhik-kunder"
    }
  },
  education: [
    { id: "tu-dresden", institution: "TU Dresden", degree: "MSc Computational Modeling and Simulation", period: "Oct 2025 to present", note: "Applied AI track, high performance computing" },
    { id: "university-of-mumbai", institution: "University of Mumbai", degree: "B.Tech Computer Engineering", period: "2021 to 2025", note: "Algorithms, ML, language models, computer vision" },
    { id: "pace", institution: "Pace Junior College", degree: "Higher secondary, Mumbai", period: "2019 to 2021", note: "Computer science, data structures, web" }
  ],
  projects: [
    { id: "spending-rail", title: "Spending Rail", date: "2026", blurb: "A banking layer for autonomous agents: each agent gets a scoped wallet, spend limits, risk aware credit, and one reconciliation layer. Selected for Phase 2 of the TinyFish Accelerator, backed by Mango Capital with a $2M seed pool.", stack: ["Agents", "Fintech infra", "Python"], link: "https://x.com/Tiny_Fish/status/2038492752397361364" },
    { id: "dresden-live", title: "Dresden-Live", date: "2026", blurb: "A 3D transit dashboard in Three.js and Mapbox GL that shows live Dresden VVO telemetry with sub second updates. Async polling and buffering keep it smooth under API jitter. Recognized in the kiliankoe/vvo project.", stack: ["Three.js", "Mapbox GL", "Real time"], link: "https://github.com/HaardhikK/Dresden-Live" },
    { id: "arthantar", title: "Arthantar", date: "2025", blurb: "My bachelor thesis: a contextual translation framework that uses coreference, fallback gender inference, and dynamic knowledge graphs so smaller models can outperform larger ones without retraining. Built around efficient inference and tested across Mistral, LLaMA3, and Gemma.", stack: ["LLaMA3", "Knowledge graphs", "FastCoref", "spaCy"], link: "https://github.com/HaardhikK/Arthantar" },
    { id: "automated-book", title: "Automated Book Publication", date: "2025", blurb: "An AI publishing workflow: Playwright scraping, LLaMA3 and Deepseek-R1 rewriting, a Streamlit human review stage, FAISS retrieval, and an RL style loop that ranks chapter versions by quality.", stack: ["Playwright", "LLaMA3", "FAISS", "Streamlit"], link: "https://github.com/HaardhikK/Automated-Book-Publication" },
    { id: "webscraping", title: "Web Scraping and Summarization Engine", date: "2024", blurb: "Scraping pipelines across 155 sites with Selenium and OCR based CAPTCHA handling, then GPT-4 to structure headings, metadata, and image links into analysis ready datasets.", stack: ["Selenium", "PyTesseract", "GPT-4"], link: "https://github.com/HaardhikK/Webscraping" }
  ],
  research: [
    { id: "latent-comm", title: "Latent Communication for Multi-Trajectory Data Analysis Agents", date: "2026", blurb: "I tested whether data analysis agents can share hidden state instead of passing natural language. Latent coordination dropped decoded coordination tokens to 0 while text coordination grew past 2,600, with higher pass rates on short and medium tasks.", stack: ["Agents", "LLMs", "Evaluation"], link: "https://github.com/HaardhikK/latent-communication-for-multi-trajectory-data-analysis-agents" },
    { id: "medfiber", title: "MedFiber: Synthetic 3D Biomedical Fibre Segmentation", date: "Since 2025", blurb: "A pipeline that generates realistic 3D fibre volumes with voxel level labels using Blender physics, then segments them and scores with Dice, IoU, ARI, and object F1. It targets the labeled data scarcity that blocks production grade fibre segmentation.", stack: ["Blender", "3D vision", "Segmentation"], link: "https://github.com/HaardhikK/MedFiber" },
    { id: "federated-xai", title: "Federated Learning and Explainable AI for Tumor Prediction", date: "2024", blurb: "Private MRI tumor prediction across separate nodes with no raw data sharing. A federated ResNet50 and FFT model reached 96.07% accuracy, up from an 86.46% CNN baseline, with SHAP and LIME for clinical readability under HIPAA and GDPR.", stack: ["TF Federated", "ResNet50", "SHAP", "LIME"], link: "https://github.com/HaardhikK/Federated-learning-and-Explainable-Ai-based-Tumor-Prediction" }
  ],
  publications: [
    { id: "topic-modeling", title: "Exploring Deep Learning Techniques for Topic Modeling of Natural Disaster Tweets", venue: "Springer Nature", year: "2025", blurb: "I compared LSA, LDA, BERT, and a LLaMA3 plus BERTopic pipeline on tweets from hurricanes, wildfires, and floods. The LLaMA3 pipeline with UMAP and HDBSCAN separated theme clusters better than every baseline.", tags: ["NLP", "BERTopic", "LLaMA3"], link: "https://link.springer.com/chapter/10.1007/978-981-96-5958-6_37" },
    { id: "f1-gnn", title: "Hybrid Predictive Modeling for F1 Races: Random Forest and Graph Neural Networks", venue: "Springer Nature", year: "2026", blurb: "A sequential Random Forest to GNN pipeline that reached a macro F1 of 0.81, ahead of a standalone GNN at 0.72 and logistic regression at 0.67. SMOTE and GridSearch fixed the class imbalance across sparse race data.", tags: ["GNNs", "Random Forest", "Sports analytics"], link: "https://link.springer.com/chapter/10.1007/978-981-96-8350-5_15" },
    { id: "sign-language", title: "Emotion-Aware Indian Sign Language Recognition: A Multimodal Approach", venue: "Educational Administration: Theory and Practice", year: "2024", blurb: "A real time system that reads sign and emotion at once, with a CNN at 79.22% for emotion and an LSTM at 98.12% for gestures, plus Google text to speech output across 5 Indian languages.", tags: ["Computer vision", "CNN", "LSTM"], link: "https://doi.org/10.53555/kuey.v30i6.7043" }
  ],
  experience: [
    { id: "concetto", role: "Web Development Intern", org: "Concetto Media", date: "2023", blurb: "Built a full stack site end to end for an institution serving 15,000+ students, and improved SEO to lift organic traffic by 40%." }
  ],
  skills: {
    languages: { label: "Languages", items: ["Python (Advanced)", "C/C++", "JavaScript", "MATLAB"] },
    ml_ai: { label: "ML and AI", items: ["PyTorch", "TensorFlow", "LLMs (Advanced)", "GNNs", "OpenCV", "LangChain", "Google ADK"] },
    web: { label: "Web and Data", items: ["ReactJS", "Node.js", "Flask", "Three.js", "Tailwind CSS", "MongoDB", "MySQL", "Selenium"] },
    tools: { label: "Tools", items: ["Docker", "AWS", "Git", "Kubernetes", "Codex", "Claude Code"] },
    spoken: { label: "Spoken", items: ["English (C1)", "German (A1)"] }
  },
  articles: [
    { id: "latent-coordination", title: "Latent versus text coordination for code executing agents", dek: "Can analysis agents coordinate by sharing hidden states instead of talking in text? Mostly yes, until the chain gets long.", date: "Jun 2026", readTime: "6 min", tags: ["Agents", "LLMs"], kind: "Research note", note: "An early research note with a working prototype. Still taking shape.", domain: ["Multi agent systems", "Latent communication", "Closed loop discovery"] },
    { id: "imprint", title: "Exogenous Sensorimotor Imprint", dek: "A third question to sit beside empowerment and homeostasis: how much of an agent's future is being written by sources it cannot steer?", date: "Jun 2026", readTime: "10 min", tags: ["Agency", "Information theory"], kind: "Research note", note: "An early theoretical note. Not fully formalized yet, and openly so.", domain: ["Empowerment", "Homeostasis", "Intrinsic motivation"] },
    { id: "right-under-contact", title: "Speculative Decoding for Contact-Aware Robotics", dek: "Judging a vision and touch reconstruction by how it behaves under a grasp, not by how closely it matches the average shape.", date: "May 2026", readTime: "6 min", tags: ["Robotics", "3D", "Touch"], kind: "Research note", note: "An early research note, still taking shape.", domain: ["Vision and touch", "3D reconstruction", "Speculative decoding"] },
    { id: "mood-tokens", title: "Music for language models: mood tokens for hidden computation", dek: "Training a small family of control tokens that steer not how much a model thinks, but how it thinks.", date: "May 2026", readTime: "7 min", tags: ["LLMs", "Interpretability"], kind: "Research note", note: "An early research note, still taking shape.", domain: ["Pause tokens", "Activation steering", "Neuromodulation"] },
    { id: "medfiber", title: "MedFiber: replicating fibres to train better models", dek: "Generating synthetic 3D fibre volumes with exact labels, so a segmenter can learn from data no one had to label by hand.", date: "2025", readTime: "3 min", tags: ["3D vision", "Synthetic data"], kind: "Project note", note: "Notes on an ongoing project.", domain: ["Synthetic data", "3D segmentation", "Biomedical imaging"] },
    { id: "arthantar", title: "Arthantar: better translation without bigger models", dek: "My bachelor thesis asked whether a smaller translation model could beat larger ones without retraining by surrounding it with the right framework.", date: "2025", readTime: "5 min", tags: ["Translation", "Knowledge graphs"], kind: "Project note", note: "Notes on my bachelor thesis.", domain: ["Knowledge graphs", "Coreference resolution"] }
  ]
};

const DATA_FILES = {
  profile: "data/profile.json",
  education: "data/education.json",
  projects: "data/projects.json",
  research: "data/research.json",
  publications: "data/publications.json",
  experience: "data/experience.json",
  skills: "data/skills.json",
  articles: "data/articles.json"
};

/* Real photographs (grayscale + halftone), spread across pages, never crammed. */
const PHOTOS = {
  homeTop: { src: "assets/4.webp", alt: "Me sketching in a park", caption: "Trying my hand at sketching." },
  homeLower: { src: "assets/10.webp", alt: "On a footbridge in the woods", caption: "In the woods." },
  blog: { src: "assets/9.webp", alt: "On the footbridge between Germany and Poland", caption: "Bridge between Poland and Germany." },
  projects: { src: "assets/5.webp", alt: "A candid photograph", caption: "Somewhere away from the lab." },
  contact: { src: "assets/2.webp", alt: "Childhood photo of me with my twin", caption: "me with my twin" }
};

/* Leftover frames, shown together in the Home archive (puzzle layout). */
const ARCHIVE = [
  { src: "assets/1.webp", alt: "A photograph from the archive" },
  { src: "assets/8.webp", alt: "A photograph from the archive" },
  { src: "assets/3.webp", alt: "A photograph from the archive" },
  { src: "assets/6.webp", alt: "A photograph from the archive" },
  { src: "assets/7.webp", alt: "A photograph from the archive" }
];

const state = { data: FALLBACK_DATA, route: "home", articleId: null };
const imageCache = new Map();
let renderToken = 0;

const content = document.querySelector("#content");
const mobileMenu = document.querySelector(".mobile-menu");
const rail = document.querySelector("#section-rail");

init();

async function init() {
  state.data = await loadData();
  bindNavigation();
  window.addEventListener("hashchange", renderRoute);
  if (!window.location.hash) {
    history.replaceState(null, "", "#home");
  }
  renderRoute();
  primeSiteImages();
}

async function loadData() {
  if (window.location.protocol === "file:") {
    return FALLBACK_DATA;
  }
  try {
    const entries = await Promise.all(
      Object.entries(DATA_FILES).map(async ([key, path]) => {
        const response = await fetch(path, { cache: "no-store" });
        if (!response.ok) throw new Error(`Could not load ${path}`);
        return [key, await response.json()];
      })
    );
    return { ...FALLBACK_DATA, ...Object.fromEntries(entries) };
  } catch (error) {
    console.info("Using embedded data fallback.", error);
    return FALLBACK_DATA;
  }
}

function bindNavigation() {
  mobileMenu.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("is-menu-open");
    mobileMenu.setAttribute("aria-expanded", String(isOpen));
  });
  rail.addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    document.body.classList.remove("is-menu-open");
    mobileMenu.setAttribute("aria-expanded", "false");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.body.classList.remove("is-menu-open");
      mobileMenu.setAttribute("aria-expanded", "false");
    }
  });
}

async function renderRoute() {
  const parsed = parseHash(window.location.hash);
  const token = ++renderToken;
  state.route = parsed.route;
  state.articleId = parsed.articleId;

  let html = "";
  if (state.route === "blog" && state.articleId) html = renderArticle(state.articleId);
  else if (state.route === "blog") html = renderBlog();
  else if (state.route === "projects") html = renderProjects();
  else if (state.route === "contact") html = renderContact();
  else html = renderHome();

  await preloadImages(getRouteImageSources(parsed));
  if (token !== renderToken) return;

  content.innerHTML = `<div class="view">${html}</div>`;
  updateActiveNav(state.route);

  if (state.route === "blog" && state.articleId) {
    const article = (state.data.articles || []).find((a) => a.id === state.articleId);
    if (article) hydrateArticle(article);
  }

  requestAnimationFrame(() => {
    const view = content.querySelector(".view");
    if (view) view.classList.add("is-visible");
  });
  content.focus({ preventScroll: true });
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

function shouldRenderArchive() {
  return !("matchMedia" in window) || !window.matchMedia("(max-width: 720px)").matches;
}

function getRouteImageSources({ route, articleId }) {
  if (route === "blog" && !articleId) return [PHOTOS.blog.src];
  if (route === "projects") return [PHOTOS.projects.src];
  if (route === "contact") return [PHOTOS.contact.src];
  if (route === "home") {
    const archiveSources = shouldRenderArchive() ? ARCHIVE.map((photo) => photo.src) : [];
    return [PHOTOS.homeTop.src, PHOTOS.homeLower.src, ...archiveSources];
  }
  return [];
}

function getAllSiteImageSources() {
  const archiveSources = shouldRenderArchive() ? ARCHIVE.map((photo) => photo.src) : [];
  return [
    ...Object.values(PHOTOS).map((photo) => photo.src),
    ...archiveSources
  ];
}

function primeSiteImages() {
  const start = () => preloadImages(getAllSiteImageSources());
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(start, { timeout: 2000 });
  } else {
    window.setTimeout(start, 600);
  }
}

function preloadImages(srcs) {
  return Promise.all(srcs.map(preloadImage));
}

function preloadImage(src) {
  if (!src) return Promise.resolve();
  if (imageCache.has(src)) return imageCache.get(src);

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().catch(() => {}).finally(resolve);
      } else {
        resolve();
      }
    };
    img.onerror = resolve;
    img.src = src;
  });

  imageCache.set(src, promise);
  return promise;
}

function parseHash(hash) {
  const cleaned = hash.replace(/^#\/?/, "") || "home";
  const [route, articleId] = cleaned.split("/");
  if (route === "blog") return { route, articleId: articleId || null };
  if (["home", "projects", "contact"].includes(route)) return { route, articleId: null };
  return { route: "home", articleId: null };
}

function updateActiveNav(route) {
  document.querySelectorAll(".rail-link").forEach((link) => {
    const active = link.dataset.route === route;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

/* -------------------------------- Home -------------------------------- */

function renderHome() {
  const { profile, education, skills } = state.data;

  const figure = (photo, side) => `
    <figure class="cut cut--${side}">
      <img src="${escapeAttribute(photo.src)}" alt="${escapeAttribute(photo.alt)}" loading="eager" decoding="async" fetchpriority="high">
      <figcaption class="cap">${escapeHtml(photo.caption)}</figcaption>
    </figure>`;

  const eduRows = education.map((e) => `
    <li>
      <span class="row-when">${escapeHtml(e.period)}</span>
      <span class="row-main"><strong>${escapeHtml(e.institution)}</strong><span>${escapeHtml(e.degree)}</span></span>
    </li>`).join("");
  const skillRows = renderSkillRows(skills);
  const archiveHtml = shouldRenderArchive() ? `
      <section class="block archive">
        <p class="label">Archive</p>
        <div class="archive-grid">
          ${ARCHIVE.map((p) => `<figure class="archive-figure"><img src="${escapeAttribute(p.src)}" alt="${escapeAttribute(p.alt)}" loading="eager" decoding="async"></figure>`).join("")}
        </div>
      </section>` : "";

  return `
    <section class="home">
      <p class="label">Home</p>
      <h1 class="lead">${escapeHtml(profile.tagline)}</h1>

      <div class="prose">
        ${figure(PHOTOS.homeTop, "right")}
        <p>${escapeHtml(profile.intro)}</p>
        <p>${escapeHtml(profile.intro2)}</p>
        <p>${escapeHtml(profile.intro3)}</p>
      </div>

      <section class="block education-block">
        <p class="label">Education</p>
        <ul class="rows">${eduRows}</ul>
      </section>

      <div class="prose prose--after">
        ${figure(PHOTOS.homeLower, "left")}
        <p>${escapeHtml(profile.interests)}</p>
        <p>${escapeHtml(profile.interests2)}</p>
        <p class="muted">${escapeHtml(profile.hobbies)}</p>
      </div>

      ${skillRows ? `
      <section class="block stack-block">
        <p class="label">Stack</p>
        <ul class="rows">${skillRows}</ul>
      </section>` : ""}

      ${archiveHtml}
    </section>
  `;
}

/* -------------------------------- Blog -------------------------------- */

function renderBlog() {
  const articles = Array.isArray(state.data.articles) ? state.data.articles : [];

  if (!articles.length) {
    return `
      <section class="blog">
        <p class="label">Blog</p>
        <h1 class="lead">Writing</h1>
        <p class="standfirst">Notes on what I'm building and thinking about. The first post is on its way.</p>
      </section>`;
  }

  const rows = articles.map((a) => {
    const tags = (Array.isArray(a.domain) && a.domain.length)
      ? `<span class="post-tags">${a.domain.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</span>`
      : "";
    return `
    <li class="post-row">
      <a href="#blog/${encodeURIComponent(a.id)}">
        <span class="post-meta">${[a.kind, a.date, a.readTime].filter(Boolean).map(escapeHtml).join(" · ")}</span>
        <span class="post-title">${escapeHtml(a.title)}</span>
        <span class="post-dek">${escapeHtml(a.dek || "")}</span>
        ${tags}
      </a>
    </li>`;
  }).join("");

  return `
    <section class="blog">
      <p class="label">Blogs</p>
      <h1 class="lead">Research Notes and Working Ideas</h1>
      <figure class="cut cut--right cut--blog">
        <img src="${escapeAttribute(PHOTOS.blog.src)}" alt="${escapeAttribute(PHOTOS.blog.alt)}" loading="eager" decoding="async" fetchpriority="high">
        <figcaption class="cap">${escapeHtml(PHOTOS.blog.caption)}</figcaption>
      </figure>
      <ul class="post-list">${rows}</ul>
    </section>
  `;
}

function renderArticle(articleId) {
  const article = (state.data.articles || []).find((a) => a.id === articleId);

  if (!article) {
    return `
      <article class="post">
        <a class="back" href="#blog">Back to ideas</a>
        <h1 class="post-headline">Post not found</h1>
        <p class="standfirst">That post doesn't exist yet. Head back to the writing index.</p>
      </article>`;
  }

  const meta = [article.kind, article.date, article.readTime].filter(Boolean).map(escapeHtml).join(" · ");
  const domain = Array.isArray(article.domain) ? article.domain : [];
  const domainHtml = domain.length
    ? `<div class="post-domain"><span class="post-domain__label">Domain</span><ul class="post-domain__tags">${domain.map((t) => `<li class="tag">${escapeHtml(t)}</li>`).join("")}</ul></div>`
    : "";

  return `
    <article class="post">
      <a class="back" href="#blog">Back to ideas</a>
      <p class="label">${meta}</p>
      <h1 class="post-headline">${escapeHtml(article.title)}</h1>
      ${article.dek ? `<p class="post-dek-lead">${escapeHtml(article.dek)}</p>` : ""}
      ${article.note ? `<p class="post-note">${escapeHtml(article.note)}</p>` : ""}
      ${domainHtml}
      <div class="post-body" id="post-body"><p class="post-loading">Loading…</p></div>
    </article>
  `;
}

// Fetch the post's Markdown body, render it, and typeset any math.
async function hydrateArticle(article) {
  const el = document.querySelector("#post-body");
  if (!el || el.dataset.rendered) return;

  if (window.location.protocol === "file:") {
    el.innerHTML = `<p class="post-loading">Post bodies load from a Markdown file, so this reading view needs the site served over a local server (try <code>python -m http.server</code>). Home, Projects, and Contact work offline.</p>`;
    return;
  }

  try {
    const res = await fetch(`data/posts/${article.id}.md`, { cache: "no-store" });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const md = await res.text();
    el.innerHTML = renderMarkdown(md);
    el.dataset.rendered = "1";
    wrapTables(el);
    typesetMath(el);
    externalizeLinks(el);
  } catch (error) {
    el.innerHTML = `<p class="post-loading">Could not load this post.</p>`;
    console.info("Post load failed.", error);
  }
}

// Markdown to HTML, shielding math from the markdown parser first.
function renderMarkdown(md) {
  if (typeof marked === "undefined") {
    return `<pre>${escapeHtml(md)}</pre>`;
  }
  const store = [];
  const stash = (m) => `@@MATH${store.push(m) - 1}@@`;
  let src = md.replace(/\$\$([\s\S]+?)\$\$/g, stash); // display math first
  src = src.replace(/\$([^\n$]+?)\$/g, stash);        // then inline math
  let html = marked.parse(src);
  html = html.replace(/@@MATH(\d+)@@/g, (_, i) => store[Number(i)]);
  return html;
}

function typesetMath(el) {
  if (typeof window.renderMathInElement !== "function") return;
  try {
    window.renderMathInElement(el, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false
    });
  } catch (error) {
    console.info("Math typeset failed.", error);
  }
}

function externalizeLinks(el) {
  el.querySelectorAll('a[href^="http"]').forEach((a) => {
    a.target = "_blank";
    a.rel = "noreferrer";
  });
}

// Wrap wide tables so they scroll within the column instead of overflowing
// the page (matters on mobile, where a multi-column table is wider than the screen).
function wrapTables(el) {
  el.querySelectorAll("table").forEach((table) => {
    if (table.parentElement && table.parentElement.classList.contains("table-scroll")) return;
    const wrap = document.createElement("div");
    wrap.className = "table-scroll";
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
}

/* ------------------------------ Projects ------------------------------ */

function renderProjects() {
  const { projects, research, publications, experience } = state.data;

  return `
    <section class="work">
      <p class="label">Projects</p>
      <h1 class="lead">What I've built and published.</h1>
      <figure class="cut cut--right cut--work">
        <img src="${escapeAttribute(PHOTOS.projects.src)}" alt="${escapeAttribute(PHOTOS.projects.alt)}" loading="eager" decoding="async" fetchpriority="high">
        <figcaption class="cap">${escapeHtml(PHOTOS.projects.caption)}</figcaption>
      </figure>

      ${workGroup("Building", projects, (p) => itemRow(p.date, p.title, p.blurb, p.stack, p.link, p.link && p.link.includes("x.com") ? "Link" : "GitHub"))}
      ${workGroup("Research", research, (p) => itemRow(p.date, p.title, p.blurb, p.stack, p.link, "GitHub"))}
      ${workGroup("Published", publications, (p) => itemRow(`${p.venue} · ${p.year}`, p.title, p.blurb, p.tags, p.link, "Read"))}
      ${workGroup("Experience", experience, (e) => itemRow(e.date, `${e.role}, ${e.org}`, e.blurb, null, null, null))}
    </section>
  `;
}

function workGroup(label, items, renderItem) {
  if (!items || !items.length) return "";
  return `
    <section class="block">
      <p class="label">${escapeHtml(label)}</p>
      <ul class="item-list">${items.map(renderItem).join("")}</ul>
    </section>`;
}

function itemRow(when, title, blurb, tags, link, linkLabel) {
  const head = link
    ? `<a class="item-title" href="${escapeAttribute(link)}" target="_blank" rel="noreferrer">${escapeHtml(title)}<span class="item-go">${escapeHtml(linkLabel || "Link")}</span></a>`
    : `<span class="item-title">${escapeHtml(title)}</span>`;
  const tagHtml = (tags && tags.length)
    ? `<div class="tags">${tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>`
    : "";
  return `
    <li class="item">
      <span class="item-when">${escapeHtml(when || "")}</span>
      <div class="item-main">
        ${head}
        <p>${escapeHtml(blurb)}</p>
        ${tagHtml}
      </div>
    </li>`;
}

function renderSkillRows(skills) {
  return Object.values(skills || {}).map((g) => `
    <li>
      <span class="row-when">${escapeHtml(g.label)}</span>
      <span class="row-main"><span>${g.items.map(escapeHtml).join(", ")}</span></span>
    </li>`).join("");
}

/* ------------------------------ Contact ------------------------------- */

function renderContact() {
  const { profile } = state.data;

  const links = [
    ["Email", `mailto:${profile.email}`, profile.email],
    ["GitHub", profile.socials.githubUrl, profile.socials.github],
    ["LinkedIn", profile.socials.linkedinUrl, profile.socials.linkedin],
    ["Resume", "assets/Haardhik_Kunder.pdf", "PDF"]
  ].map(([k, href, val]) => `
    <a class="contact-row" href="${escapeAttribute(href)}"${href.startsWith("mailto:") ? "" : ' target="_blank" rel="noreferrer"'}>
      <span class="contact-k">${escapeHtml(k)}</span>
      <span class="contact-v">${escapeHtml(val)}</span>
    </a>`).join("");

  return `
    <section class="contact">
      <p class="label">Contact</p>
      <h1 class="lead">Open to hearing cool ideas and collaboration.</h1>
      
      <div class="contact-grid">
        <div class="contact-links">${links}</div>
        <figure class="cut cut--contact">
          <img src="${escapeAttribute(PHOTOS.contact.src)}" alt="${escapeAttribute(PHOTOS.contact.alt)}" loading="eager" decoding="async" fetchpriority="high">
          ${PHOTOS.contact.caption ? `<figcaption class="cap">${escapeHtml(PHOTOS.contact.caption)}</figcaption>` : ""}
        </figure>
      </div>
    </section>
  `;
}

/* ------------------------------ Helpers ------------------------------- */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
