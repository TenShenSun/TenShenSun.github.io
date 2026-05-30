/* Agent Architect 博客站 —— 纯前端 SPA（hash 路由 + Markdown 渲染） */
(() => {
  "use strict";

  const view = document.getElementById("view");
  const searchEl = document.getElementById("search");
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  let MANIFEST = null;          // { layers: [...], posts: [...] }
  let POSTS = [];               // 扁平文章列表（按 order 排序）
  const CACHE = new Map();      // slug -> markdown 文本

  /* ---------- 主题 ---------- */
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) document.body.setAttribute("data-theme", savedTheme);
  themeToggle?.addEventListener("click", () => {
    const next = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });

  /* ---------- 工具 ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  async function loadManifest() {
    if (MANIFEST) return MANIFEST;
    const res = await fetch("./posts/manifest.json", { cache: "no-cache" });
    MANIFEST = await res.json();
    POSTS = [...MANIFEST.posts].sort((a, b) => a.order - b.order);
    return MANIFEST;
  }

  async function loadPost(slug) {
    if (CACHE.has(slug)) return CACHE.get(slug);
    const res = await fetch(`./posts/${slug}.md`, { cache: "no-cache" });
    if (!res.ok) throw new Error("not found");
    const md = await res.text();
    CACHE.set(slug, md);
    return md;
  }

  function setActiveNav(name) {
    document.querySelectorAll(".topnav a").forEach((a) =>
      a.classList.toggle("active", a.dataset.nav === name));
  }

  /* ---------- 首页 ---------- */
  async function renderHome() {
    setActiveNav("home");
    await loadManifest();
    const tags = [...new Set(POSTS.flatMap((p) => p.tags || []))].slice(0, 10);

    const layersHtml = MANIFEST.layers.map((layer) => {
      const items = POSTS.filter((p) => p.layer === layer.id);
      if (!items.length) return "";
      return `
        <div class="layer">
          <div class="layer-bar">
            <h3>${esc(layer.name)}</h3>
            <span class="layer-en">${esc(layer.en)}</span>
          </div>
          <p class="section-sub">${esc(layer.desc)}</p>
          <div class="grid">${items.map(cardHtml).join("")}</div>
        </div>`;
    }).join("");

    view.innerHTML = `
      <section class="hero">
        <div class="hero-inner">
          <div class="eyebrow">Full-Stack Agent Engineering</div>
          <h1>全栈智能体架构笔记<br/>从应用风控到模型底层</h1>
          <p class="lead">一个资深 Agent 架构师的系统性技术博客：覆盖 <b>Agent 应用</b>（Chatbot 风控 / 增长 / AIGC）→ <b>Agent 编排</b> → <b>Agent 运行时</b>（Harness + Model）→ <b>模型底层</b> 的完整技术栈。原理 · 案例 · 落地，参考 Anthropic、OpenAI、Google、阿里云、Manus 等一线实践与权威论文。</p>
          <div class="stack-tags">
            ${tags.map((t) => `<span>${esc(t)}</span>`).join("")}
          </div>
        </div>
      </section>
      <div class="wrap">
        <section class="section">
          <div class="section-head"><h2>技术栈分层 · 系列文章</h2><span class="count">${POSTS.length} 篇</span></div>
          <p class="section-sub">按"应用层 → 编排层 → 运行时层 → 模型层"自上而下组织，每一层都给出原理推导、业界对照案例与可落地的工程方案。</p>
          ${layersHtml}
        </section>
      </div>`;
    bindCards();
    window.scrollTo(0, 0);
  }

  function cardHtml(p) {
    return `
      <div class="card" data-slug="${esc(p.slug)}">
        <div class="num">${esc(p.code || "")}</div>
        <h4>${esc(p.title)}</h4>
        <p>${esc(p.summary)}</p>
        <div class="meta">
          ${(p.tags || []).slice(0, 3).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}
          <span class="read">${esc(p.readingTime || "")}</span>
        </div>
      </div>`;
  }

  function bindCards() {
    document.querySelectorAll(".card").forEach((c) =>
      c.addEventListener("click", () => { location.hash = `#/post/${c.dataset.slug}`; }));
  }

  /* ---------- 系列页（目录） ---------- */
  async function renderSeries() {
    setActiveNav("series");
    await loadManifest();
    const list = MANIFEST.layers.map((layer) => {
      const items = POSTS.filter((p) => p.layer === layer.id);
      if (!items.length) return "";
      return `
        <div class="layer">
          <div class="layer-bar"><h3>${esc(layer.name)}</h3><span class="layer-en">${esc(layer.en)}</span></div>
          <div class="grid">${items.map(cardHtml).join("")}</div>
        </div>`;
    }).join("");
    view.innerHTML = `<div class="wrap"><section class="section">
      <div class="section-head"><h2>完整系列目录</h2><span class="count">${POSTS.length} 篇</span></div>
      <p class="section-sub">点击任意卡片进入文章。建议按顺序阅读，也可按需跳读。</p>
      ${list}</section></div>`;
    bindCards();
    window.scrollTo(0, 0);
  }

  /* ---------- 关于页 ---------- */
  async function renderAbout() {
    setActiveNav("about");
    await loadManifest();
    view.innerHTML = `<div class="about">
      <div class="eyebrow">About</div>
      <h1>关于作者</h1>
      <div class="profile-card">
        <p>资深 <b>Agent 架构师</b>，长期工作在大模型与智能体系统的第一线。研究与实践横跨完整技术栈：</p>
        <p class="muted">Agent 应用层（对话产品、内容风控、增长体系、AIGC 工程） → Agent 编排（多智能体协作、规划与记忆） → Agent 运行时（Harness 设计、工具调用、MCP） → 模型底层（架构、后训练、推理优化）。</p>
        <div class="skills">
          <div class="skill"><b>应用 & 风控</b><span>对话产品、Prompt 注入防御、内容安全、Guardrails、合规</span></div>
          <div class="skill"><b>增长 & AIGC</b><span>AARRR、留存飞轮、多模态生成、RAG、内容质量</span></div>
          <div class="skill"><b>Agent 编排</b><span>ReAct / Plan-Execute、Multi-Agent、上下文工程、记忆</span></div>
          <div class="skill"><b>运行时 & Harness</b><span>Agent Loop、工具沙箱、MCP、评测与可观测性</span></div>
          <div class="skill"><b>模型底层</b><span>Transformer、注意力、RLHF/DPO、对齐、推理加速</span></div>
          <div class="skill"><b>生态对照</b><span>Anthropic、OpenAI、Google、阿里云、Manus、开源社区</span></div>
        </div>
      </div>
      <p>这个系列博客记录我对"如何把一个想法做成可靠、可规模化、安全合规的 Agent 系统"的完整思考路径。每篇文章尽量做到：<b>讲清原理 → 对照业界标杆案例 → 给出可落地的工程方案</b>。</p>
      <p>欢迎从 <a href="#/series">系列目录</a> 开始阅读。</p>
    </div>`;
    window.scrollTo(0, 0);
  }

  /* ---------- 文章页 ---------- */
  async function renderPost(slug) {
    setActiveNav("series");
    await loadManifest();
    const idx = POSTS.findIndex((p) => p.slug === slug);
    const post = POSTS[idx];
    if (!post) { view.innerHTML = `<div class="empty">未找到该文章。<a href="#/">返回首页</a></div>`; return; }

    let md;
    try { md = await loadPost(slug); }
    catch { view.innerHTML = `<div class="empty">文章加载失败。请通过本地服务器访问（见 README）。<br/><a href="#/">返回首页</a></div>`; return; }

    // 去掉 markdown 顶部的一级标题（用元数据渲染）
    const body = md.replace(/^#\s+.*\n+/, "");
    const html = window.marked ? window.marked.parse(body) : `<pre>${esc(body)}</pre>`;

    const prev = POSTS[idx - 1];
    const next = POSTS[idx + 1];
    view.innerHTML = `
      <div class="article-layout">
        <article class="article">
          <a class="back" href="#/series">← 返回系列目录</a>
          <div class="post-meta">
            <span>${esc(post.code || "")}</span>
            <span>${esc(post.readingTime || "")}</span>
            <span>${esc(post.date || "")}</span>
          </div>
          <h1>${esc(post.title)}</h1>
          <div class="post-tags">${(post.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
          <div class="article-body">${html}</div>
          <nav class="post-nav">
            ${prev ? `<a href="#/post/${esc(prev.slug)}"><div class="dir">← 上一篇</div><div class="ttl">${esc(prev.title)}</div></a>` : `<span style="flex:1"></span>`}
            ${next ? `<a class="next" href="#/post/${esc(next.slug)}"><div class="dir">下一篇 →</div><div class="ttl">${esc(next.title)}</div></a>` : `<span style="flex:1"></span>`}
          </nav>
        </article>
        <aside class="toc"><div class="toc-title">本页目录</div><div id="tocList"></div></aside>
      </div>`;

    // 代码高亮
    if (window.hljs) document.querySelectorAll(".article-body pre code").forEach((b) => window.hljs.highlightElement(b));
    buildToc();
    window.scrollTo(0, 0);
  }

  function buildToc() {
    const body = document.querySelector(".article-body");
    const tocList = document.getElementById("tocList");
    if (!body || !tocList) return;
    const heads = body.querySelectorAll("h2, h3");
    const links = [];
    heads.forEach((h, i) => {
      const id = "h-" + i;
      h.id = id;
      const a = document.createElement("a");
      a.href = `#${id}`;
      a.textContent = h.textContent;
      if (h.tagName === "H3") a.className = "h3";
      a.addEventListener("click", (e) => { e.preventDefault(); h.scrollIntoView({ behavior: "smooth" }); });
      tocList.appendChild(a);
      links.push({ a, el: h });
    });
    // 滚动高亮
    const onScroll = () => {
      let cur = links[0];
      for (const l of links) { if (l.el.getBoundingClientRect().top < 120) cur = l; }
      links.forEach((l) => l.a.classList.toggle("active", l === cur));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 搜索 ---------- */
  async function renderSearch(q) {
    await loadManifest();
    const k = q.trim().toLowerCase();
    const hits = POSTS.filter((p) =>
      [p.title, p.summary, (p.tags || []).join(" ")].join(" ").toLowerCase().includes(k));
    view.innerHTML = `<div class="wrap"><section class="section">
      <div class="section-head"><h2>搜索：“${esc(q)}”</h2><span class="count">${hits.length} 篇</span></div>
      ${hits.length ? `<div class="grid">${hits.map(cardHtml).join("")}</div>` : `<div class="empty">没有匹配的文章。</div>`}
    </section></div>`;
    bindCards();
  }

  let searchTimer = null;
  searchEl?.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    const q = e.target.value;
    searchTimer = setTimeout(() => {
      if (q.trim()) renderSearch(q);
      else router();
    }, 180);
  });

  /* ---------- 路由 ---------- */
  async function router() {
    const hash = location.hash || "#/";
    try {
      if (hash.startsWith("#/post/")) return await renderPost(decodeURIComponent(hash.slice(7)));
      if (hash.startsWith("#/series")) return await renderSeries();
      if (hash.startsWith("#/about")) return await renderAbout();
      return await renderHome();
    } catch (err) {
      view.innerHTML = `<div class="empty">页面加载出错：${esc(err.message)}<br/>请确认通过本地服务器访问（见 README）。</div>`;
    }
  }

  window.addEventListener("hashchange", router);
  router();
})();