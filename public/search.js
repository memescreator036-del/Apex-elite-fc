(() => {
  "use strict";
  const form = document.getElementById("searchForm");
  const input = document.getElementById("query");
  const status = document.getElementById("status");
  const results = document.getElementById("results");
  let index = [];

  const clean = v => String(v ?? "");
  const esc = v => clean(v).replace(/[&<>"']/g, c =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const norm = v => clean(v).toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();

  function put(type,title,description,url,keywords="") {
    if (!title) return;
    index.push({type,title:clean(title),description:clean(description),url:url || "/",keywords});
  }

  async function loadIndex() {
    const response = await fetch("/api/site", {headers:{Accept:"application/json"}});
    if (!response.ok) throw new Error("Search could not connect to the club website data.");
    const data = await response.json();
    index = [];

    (data.playerProfiles || []).filter(p => p && p.published).forEach(p => {
      put("Player profile",p.name,
        [p.position,p.team,p.number ? "Squad number "+p.number : "",p.bio].filter(Boolean).join(" · "),
        "/players.html",p.slug);
    });
    (data.news || []).forEach(n => put("News",n.title,n.text,"/#news",n.date || ""));
    (data.products || []).forEach(p => put("Shop",p.name,
      "₦"+Number(p.price || 0).toLocaleString("en-NG")+(p.sizes ? " · Sizes: "+p.sizes : ""),
      "/#shop",p.sizes || ""));
    (data.menu || []).filter(m => m && m.visible !== false).forEach(m =>
      put("Club section",m.label,"Open "+m.label,m.href || "/", ""));
    (data.sponsors || []).filter(s => s && s.visible !== false).forEach(s =>
      put("Sponsor",s.name,s.description,s.url || "/", ""));
    const lineup = data.squad && Array.isArray(data.squad.lineup) ? data.squad.lineup : [];
    lineup.forEach(p => put("Squad",p.slug.replace(/-/g," "),p.role+" · "+p.status,
      "/squad.html",p.slug));
    status.textContent = index.length
      ? "Search is ready. Enter a name, position, product or club topic."
      : "No public content is available to search yet.";
  }

  function runSearch(query) {
    const terms = norm(query).split(/\s+/).filter(Boolean);
    if (!terms.length) { results.innerHTML=""; status.textContent="Enter a search term."; return; }
    const found = index.map(item => {
      const hay = norm([item.title,item.description,item.type,item.keywords].join(" "));
      const score = terms.reduce((sum,t) => sum + (hay.includes(t) ? 1 : 0),0);
      return {...item,score};
    }).filter(item => item.score > 0)
      .sort((a,b) => b.score-a.score || a.title.localeCompare(b.title)).slice(0,40);

    status.textContent = found.length ? `${found.length} result(s) found.` : "No matches. Try a different search.";
    results.innerHTML = found.map(item =>
      `<a class="result" href="${esc(item.url)}"><div class="kind">${esc(item.type)}</div>`+
      `<h2>${esc(item.title)}</h2><p>${esc(item.description)}</p></a>`).join("");
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    runSearch(input.value);
  });
  loadIndex().catch(error => { status.textContent = error.message; });
})();