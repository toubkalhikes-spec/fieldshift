const $ = (s) => document.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icon = (name) =>
  '<img class="icon" alt="" src="assets/' + name + '.svg">';
const arrow = icon("ArrowOutline"),
  key = "fieldshift-workspace-v1";
const defaults = {
  place: "Taroudant, Morocco",
  lat: "30.47",
  lon: "-8.88",
  drain: "",
  water: "",
  soil: "",
  history: [""],
  goal: "Use water wisely",
  feed: "Not sure",
  exclude: "",
  saved: [],
};
let state = structuredClone(defaults);
try {
  Object.assign(state, JSON.parse(localStorage.getItem(key) || "{}"));
} catch {}
let timer,
  removed = null;
function notify(message, undo = false) {
  clearTimeout(timer);
  $("#notice").innerHTML =
    '<div class="toast">' +
    esc(message) +
    (undo ? ' <button data-action="undo">Undo</button>' : "") +
    "</div>";
  timer = setTimeout(() => $("#notice").replaceChildren(), 6000);
}
function persist() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    notify("Browser storage unavailable. Changes last for this session.");
    return false;
  }
}
const routes = {
  overview: ["Overview", "HomeOutline"],
  farm: ["Farm profile", "FarmOutline"],
  priorities: ["Your priorities", "SlidersOutline"],
  compare: ["Compare rotations", "LayersOutline"],
  saved: ["Saved plans", "BookmarkOutline"],
  sources: ["Data sources", "DatabaseOutline"],
};
const goals = [
  [
    "Use water wisely",
    "DropOutline",
    "Prioritize options that fit your water access.",
  ],
  [
    "Support soil health",
    "SeedlingOutline",
    "Explore crops that may benefit the soil.",
  ],
  ["Produce animal feed", "WheatEarOutline", "Include your livestock’s needs."],
  [
    "Explore market options",
    "MarketOutline",
    "Consider crops you could sell locally.",
  ],
];
const plans = {
  A: [
    "Wheat continuity",
    ["Wheat", "Wheat", "Wheat"],
    "Keep the same crop",
    "Reference for comparing changes.",
  ],
  B: [
    "Wheat + chickpea",
    ["Wheat", "Chickpea", "Wheat"],
    "Diversify the wheat sequence",
    "Potential soil fertility benefit.",
  ],
  C: [
    "Barley + chickpea",
    ["Barley", "Chickpea", "Barley"],
    "Compare a barley-based plan",
    "Potential soil fertility benefit.",
  ],
};
const cropIcons = {
  Wheat: "WheatEarOutline",
  Barley: "BarleyOutline",
  Chickpea: "ChickpeaOutline",
};
const guide =
    "https://www.agripedia.ma/sites/default/files/2020-12/guide-culture-pois-chiche.pdf",
  hcp = "https://www.hcp.ma/region-agadir/attachment/2801621/";
const btn = (r, t, primary = false) =>
  '<a class="btn ' +
  (primary ? "primary" : "") +
  '" href="#/' +
  r +
  '">' +
  t +
  "</a>";
const badge = (t, g = false) =>
  '<span class="badge ' + (g ? "green" : "") + '">' + t + "</span>";
const card = (html, cl = "") =>
  '<section class="card ' + cl + '">' + html + "</section>";
const link = (r, t) => '<a href="#/' + r + '">' + t + "</a>";
const info = (i, t, d) =>
  '<div class="info">' +
  icon(i) +
  "<div><strong>" +
  t +
  "</strong><small>" +
  d +
  "</small></div></div>";
const row = (k, v) => '<div class="item">' + k + "<span>" + v + "</span></div>";
const note = (t) => '<div class="note">' + t + "</div>";
const known = (v) => v && v !== "I’m not sure";
const missing = () =>
  [
    ["Soil drainage", state.drain],
    ["Water access", state.water],
    ["Crop history", state.history[0]],
  ]
    .filter((x) => !known(x[1]))
    .map((x) => x[0]);
const summary = await fetch("./data/summary.json")
  .then((r) => (r.ok ? r.json() : Promise.reject()))
  .catch(() => null);
function metrics() {
  return summary
    ? '<div class="metric">' +
        [
          [
            "ThermometerOutline",
            summary.annual_mean_temperature_c + "°C",
            "Mean temperature",
          ],
          [
            "RainOutline",
            Math.round(summary.annual_precipitation_mm) + " mm",
            "Annual rainfall",
          ],
        ]
          .map(
            ([i, v, t]) =>
              '<div class="inline">' +
              icon(i) +
              "<div><strong>" +
              v +
              "</strong><small>" +
              t +
              "</small></div></div>",
          )
          .join("") +
        "</div>"
    : note("Climate sample unavailable. Reload to try again.");
}
function intro(t, sub, b, extra = "") {
  return (
    '<div class="intro"><div class="row"><h1>' +
    t +
    '</h1><div class="inline">' +
    extra +
    badge(b, true) +
    '</div></div><p class="sub">' +
    sub +
    "</p></div>"
  );
}
function token(c) {
  return (
    '<span class="token ' +
    (c === "Chickpea" ? "legume" : "") +
    '">' +
    icon(cropIcons[c]) +
    c +
    "</span>"
  );
}
function sequence(c) {
  return (
    '<div class="sequence">' +
    c
      .map(
        (v, i) =>
          '<div class="season"><strong>Season ' +
          (i + 1) +
          "</strong>" +
          token(v) +
          "</div>",
      )
      .join(arrow) +
    "</div>"
  );
}
const steps = (idx) =>
  '<div class="steps">' +
  ["farm", "priorities", "compare"]
    .map(
      (r, i) =>
        '<a class="step ' +
        (idx === i ? "active" : "") +
        '" href="#/' +
        r +
        '"><span class="num">' +
        (i + 1) +
        "</span>" +
        ["Farm details", "Your priorities", "Compare options"][i] +
        "</a>",
    )
    .join(arrow) +
  "</div>";
const value = (v) => esc(v || "Not provided");
function overview() {
  return (
    intro(
      "Your next season starts here",
      "Build your farm profile, then explore crop rotation options.",
      "Demo workspace",
      '<img src="assets/FarmerAndSeedlingIllustration.png" alt="" width="66">',
    ) +
    '<div class="stack"><div class="grid">' +
    card(
      '<div class="row"><h2>' +
        esc(state.place || "My field") +
        " farm</h2>" +
        badge(missing().length ? "Setup incomplete" : "Details provided") +
        '</div><p class="muted">' +
        icon("PinOutline") +
        " " +
        esc(state.place) +
        "</p><p>Add your field details to make the comparison more useful.</p>" +
        row(icon("LayersOutline") + " Soil & drainage", value(state.drain)) +
        row(icon("DropOutline") + " Water access", value(state.water)) +
        row(
          icon("WheatEarOutline") + " Crop history",
          value(state.history[0]),
        ) +
        '<div class="cta">' +
        btn("farm", "Continue setup →", true) +
        "</div><small>You can keep unknown details marked as unknown.</small>",
    ) +
    '<div class="stack">' +
    card(
      "<h2>Climate at a glance</h2><small>Taroudant reference point · 2025</small>" +
        metrics() +
        "<small>Historical regional estimates, not a field measurement.</small><small>NASA POWER · 365 daily records</small><p>" +
        link("sources", "Explore the data →") +
        "</p>",
    ) +
    card(
      info(
        "PinOutline",
        "Working with a demo",
        "Replace the reference location with your field when you’re ready.",
      ),
      "mint",
    ) +
    '</div></div><h2>A simple path to your plan</h2><div class="tiles">' +
    [
      ["farm", "Describe your farm", "Add soil, water and recent crops."],
      ["priorities", "Choose your priorities", "Tell us what matters most."],
      [
        "compare",
        "Compare your options",
        "Review sequences, evidence and gaps.",
      ],
    ]
      .map(
        ([r, t, d], i) =>
          '<a class="card" href="#/' +
          r +
          '"><h3><span class="num">' +
          (i + 1) +
          "</span>" +
          t +
          "</h3><p>" +
          d +
          "</p>" +
          badge(["Next step", "Preferences", "Preview available"][i]) +
          "</a>",
      )
      .join("") +
    "</div>" +
    card(
      '<div class="row"><div><h2>See an example before you start</h2><small>Explore three illustrative crop plans for the Taroudant demo.</small></div>' +
        btn("compare", "Preview example plans →") +
        "</div>",
    ) +
    "</div>"
  );
}
function input(k, title, type = "text", extra = "") {
  return (
    '<label class="field">' +
    title +
    '<input name="' +
    k +
    '" type="' +
    type +
    '" value="' +
    esc(state[k]) +
    '" ' +
    extra +
    "></label>"
  );
}
function select(k, title, options, val = state[k]) {
  return (
    '<label class="field">' +
    title +
    '<select name="' +
    k +
    '">' +
    ["", ...options, "I’m not sure"]
      .map(
        (o) =>
          '<option value="' +
          esc(o) +
          '" ' +
          (val === o ? "selected" : "") +
          ">" +
          esc(o || "Select an option") +
          "</option>",
      )
      .join("") +
    "</select></label>"
  );
}
function farm() {
  return (
    intro(
      "Tell us about your farm",
      "Start with what you know. You can fill in the rest later.",
      "Demo farm",
    ) +
    steps(0) +
    '<div class="grid wide"><form id="farmForm" class="card"><h2>01  Location</h2>' +
    input("place", "Where is your field?", "text", 'required maxlength="90"') +
    '<div class="split">' +
    input(
      "lat",
      "Latitude",
      "number",
      'min="-90" max="90" step="any" required',
    ) +
    input(
      "lon",
      "Longitude",
      "number",
      'min="-180" max="180" step="any" required',
    ) +
    '</div><small>Climate data always refers to the Taroudant sample.</small><hr class="divider"><h2>02  Soil & water</h2><div class="split">' +
    select("drain", "How well does your soil drain?", [
      "Well drained",
      "Moderately drained",
      "Poorly drained",
    ]) +
    select("water", "How is your field watered?", [
      "Rainfed",
      "Irrigated",
      "Mixed rain and irrigation",
    ]) +
    "</div>" +
    select("soil", "Soil type (optional)", ["Sandy", "Loam", "Clay", "Silt"]) +
    '<hr class="divider"><h2>03  Crop history</h2>' +
    state.history
      .map((v, i) =>
        select(
          "history" + i,
          i ? "Earlier season " + (i + 1) : "What did you grow last season?",
          ["Wheat", "Barley", "Chickpea", "Other", "Fallow"],
          v,
        ),
      )
      .join("") +
    '<button type="button" class="link" data-action="earlier">Add an earlier season</button><hr class="divider"><div class="row"><button value="draft">Save draft</button><button class="primary" value="next">Continue to priorities →</button></div></form><div class="stack">' +
    card(
      '<h2>Your starting point</h2><img class="map" src="assets/TaroudantReferenceMapSchematic.png" alt="Reference map of Taroudant"><small>Reference location · not a field boundary</small>' +
        metrics() +
        "<small>NASA POWER · 2025 regional estimates</small>",
    ) +
    card(
      "<h2>Why we ask</h2>" +
        info(
          "LayersOutline",
          "Soil drainage",
          "Helps check crop suitability.",
        ) +
        info("DropOutline", "Water access", "Adds context to rainfall data.") +
        info("SeedlingOutline", "Crop history", "Helps review crop sequences."),
    ) +
    "</div></div>"
  );
}
function priorities() {
  return (
    intro(
      "What matters most to you?",
      "Choose one main goal. We’ll keep your other needs in view.",
      "Demo preferences",
    ) +
    steps(1) +
    '<div class="grid wide"><div class="stack">' +
    card(
      '<h2>Choose your main goal</h2><p>Select one. You can change it later.</p><div class="split">' +
        goals
          .map(
            ([t, i, d]) =>
              '<button class="goal" data-goal="' +
              t +
              '" aria-pressed="' +
              (state.goal === t) +
              '">' +
              icon(i) +
              "<strong>" +
              t +
              "</strong><small>" +
              d +
              "</small></button>",
          )
          .join("") +
        "</div>",
    ) +
    card(
      '<h2>Practical needs</h2><div class="split"><div><p>Do you need feed for livestock?</p>' +
        ["Yes", "No", "Not sure"]
          .map(
            (v) =>
              '<button data-feed="' +
              v +
              '" aria-pressed="' +
              (state.feed === v) +
              '">' +
              v +
              "</button>",
          )
          .join(" ") +
        "</div>" +
        input(
          "exclude",
          "Any crops you want to avoid?",
          "text",
          'placeholder="e.g. barley" maxlength="100"',
        ) +
        "</div>",
    ) +
    "</div>" +
    card(
      "<h2>Your plan, at a glance</h2><p>" +
        esc(state.place) +
        "</p><small>Main goal</small><strong>" +
        esc(state.goal) +
        "</strong><small>Livestock needs</small>" +
        esc(state.feed) +
        "<small>Farm details</small>" +
        (missing().length ? "Still incomplete" : "Provided") +
        '<small>Crop exclusions</small><span id="excludeSummary">' +
        esc(state.exclude || "None added") +
        "</span>" +
        note(
          "Your goal guides the comparison. Field suitability still needs local review.",
        ),
    ) +
    '</div><div class="actions cta">' +
    btn("farm", "Back to farm details") +
    btn("compare", "Preview crop options →", true) +
    "</div>"
  );
}
function compares() {
  return (
    intro(
      "Compare crop rotations",
      "Explore what could work for your next three seasons.",
      "Demo preview",
    ) +
    '<div class="stack">' +
    card(
      '<div class="row">' +
        [
          ["Location", state.place],
          ["Soil", state.drain],
          ["Water access", state.water],
          ["Priority", state.goal],
        ]
          .map(
            ([k, v]) => "<div><small>" + k + "</small>" + value(v) + "</div>",
          )
          .join("") +
        btn("farm", "Add farm details", true) +
        "</div>",
    ) +
    card(
      '<h2>Three-season plans</h2><small>Three seasons shown side by side · scroll across on smaller screens.</small><div class="scroll" tabindex="0" aria-label="Rotation comparison"><table><thead><tr><th>Plan</th><th>① Season 1</th><th>② Season 2</th><th>③ Season 3</th><th>Why explore it</th><th></th></tr></thead><tbody>' +
        Object.entries(plans)
          .map(
            ([id, [t, c, why, d]]) =>
              "<tr><td><strong>" +
              id +
              "　" +
              t +
              "</strong></td>" +
              c.map((x) => "<td>" + token(x) + "</td>").join("") +
              "<td><strong>" +
              why +
              "</strong><small>" +
              d +
              "</small></td><td>" +
              btn("plan/" + id, "Explore") +
              "</td></tr>",
          )
          .join("") +
        "</tbody></table></div>" +
        note(review()) +
        (state.exclude
          ? note(
              "Crops to avoid: " +
                esc(state.exclude) +
                ". Check these examples against your preferences.",
            )
          : ""),
    ) +
    '<div class="split">' +
    card(
      "<h2>Climate context / 2025</h2>" +
        metrics() +
        "<small>NASA POWER · Taroudant regional estimates</small>",
    ) +
    card(
      "<h2>Evidence & assumptions</h2><p>Moroccan crop references</p><small>Farm suitability not yet assessed</small>" +
        link("sources", "Review sources →"),
    ) +
    "</div></div>"
  );
}
function review() {
  return missing().length
    ? "Still needed: " + missing().join(", ").toLowerCase() + "."
    : "Farm details provided. Review suitability with a local adviser.";
}
function refs() {
  return (
    '<div class="item"><div><strong>Moroccan chickpea guide</strong><small>OCP · INRA-CRRA Settat</small></div><span><a target="_blank" rel="noreferrer" href="' +
    guide +
    '">Read source ↗</a></span></div><div class="item"><div><strong>Crop context in Taroudant</strong><small>HCP · Souss-Massa, 2025 edition</small></div><span><a target="_blank" rel="noreferrer" href="' +
    hcp +
    '">Read source ↗</a></span></div>'
  );
}
function detail(id) {
  const [t, c, why, d] = plans[id];
  return (
    intro(
      t,
      id === "A"
        ? "A hypothetical baseline."
        : "A legume between two cereal seasons.",
      "Example plan",
    ) +
    '<div class="stack"><div class="row">' +
    link("compare", "← Back to comparison") +
    '<button data-save="' +
    id +
    '">' +
    (state.saved.includes(id) ? "View saved plan" : "Save for review") +
    "</button></div>" +
    card(
      sequence(c) +
        "<small>Example sequence · timing is not yet confirmed</small>",
    ) +
    '<div class="grid"><div class="stack">' +
    card(
      "<h2>What this plan changes</h2>" +
        info(
          cropIcons[c[1]],
          why,
          id === "A"
            ? "Wheat continues in all three seasons."
            : "Chickpea replaces the middle cereal season.",
        ) +
        info(
          "LayersOutline",
          id === "A" ? "Familiar crop plan" : "Potential soil benefit",
          id === "A"
            ? "Use this as a reference when comparing the alternatives."
            : "Nitrogen contribution depends on field conditions and residue management.",
        ) +
        info(
          "InfoOutline",
          "What needs care",
          id === "A"
            ? "Review crop and disease history."
            : "Check drainage and water availability during flowering.",
        ),
    ) +
    card(
      "<h2>Evidence behind this option</h2>" +
        refs() +
        "<small>Regional guidance needs checking against your field.</small>",
    ) +
    "</div>" +
    card(
      "<h2>Check this plan for your farm</h2>" +
        note(esc(state.goal)) +
        "<p>Field suitability and water use have not been assessed.</p>" +
        [
          ["Soil drainage", state.drain],
          ["Water access", state.water],
          ["Crop history", state.history[0]],
        ]
          .map(([k, v]) => row(k, value(v)))
          .join("") +
        '<div class="cta">' +
        btn("farm", "Complete farm details →", true) +
        "</div>",
    ) +
    "</div></div>"
  );
}
function saved() {
  return (
    intro(
      "Plans to revisit",
      "Keep useful options together for a closer look.",
      "Demo workspace",
    ) +
    "<p>" +
    state.saved.length +
    " saved " +
    (state.saved.length === 1 ? "plan" : "plans") +
    '</p><div class="grid wide cta"><div class="stack">' +
    (state.saved.length
      ? state.saved
          .map((id) => {
            const [t, c] = plans[id];
            return card(
              '<div class="row">' +
                badge("Saved for review") +
                '<button class="link" data-remove="' +
                id +
                '">Remove</button></div><h2>' +
                t +
                "</h2><p>" +
                esc(state.place) +
                "</p>" +
                sequence(c) +
                "<small>Main goal · " +
                esc(state.goal) +
                "</small>" +
                note(review()) +
                '<div class="cta inline">' +
                btn("plan/" + id, "Review plan", true) +
                btn("farm", "Edit farm details") +
                "</div>",
            );
          })
          .join("")
      : card(
          "<h2>No saved plans yet</h2><p>Explore an example and save it for review.</p>" +
            btn("compare", "Explore plans →", true),
        )) +
    "</div>" +
    card(
      "<h2>Before you decide</h2>" +
        info(
          "BookOutline",
          "Review the evidence",
          "See why the option was included.",
        ) +
        info(
          "FarmOutline",
          "Complete your farm profile",
          "Keep unknown details visible.",
        ) +
        info(
          "PeopleOutline",
          "Discuss it locally",
          "Check timing and repeat intervals.",
        ),
    ) +
    "</div>"
  );
}
function sources() {
  return (
    intro(
      "Know what’s behind your options",
      "See the sources, coverage and limits of this demo.",
      "Demo dataset",
    ) +
    '<div class="stack"><div class="grid">' +
    card(
      '<div class="row"><h2>NASA POWER</h2>' +
        badge("Downloaded sample", true) +
        "</div>" +
        row("Reference location", "30.47, −8.88") +
        row("Period", "Jan–Dec 2025") +
        row("Coverage", "365 daily records") +
        metrics() +
        "<h2>Included measurements</h2>" +
        [
          "Mean air temperature",
          "Minimum air temperature",
          "Maximum air temperature",
          "Corrected precipitation",
        ]
          .map((x, i) => row(x, i === 3 ? "mm/day" : "°C"))
          .join("") +
        '<small>MERRA-2 / POWER · Local solar time (LST)</small><div class="row cta"><a class="btn primary" href="data/daily_2025.csv" download>Download daily CSV ↓</a><a class="btn" href="data/nasa_power_raw.json" target="_blank" rel="noreferrer">View original JSON ↗</a></div>',
    ) +
    '<div class="stack">' +
    card(
      "<h2>What this data can tell you</h2><p>Historical regional weather patterns and the completeness of this sample.</p>" +
        note("No missing values in the four downloaded variables."),
    ) +
    card(
      "<h2>What it cannot tell you</h2><p>Conditions inside a specific field, future weather, long-term trends, crop suitability or irrigation requirements.</p><small>Grid: approximately 0.5° latitude × 0.625° longitude.</small>",
    ) +
    card(
      "<h2>Your field still matters</h2><p>Add local soil, water and crop history.</p>" +
        link("farm", "Edit farm details →"),
      "mint",
    ) +
    "</div></div>" +
    card("<h2>Agricultural references</h2>" + refs()) +
    "</div>"
  );
}
function render() {
  const [route = "overview", id] = location.hash
    .replace(/^#\/?/, "")
    .split("/");
  const page =
    route === "plan" && Object.hasOwn(plans, id)
      ? route
      : Object.hasOwn(routes, route)
        ? route
        : "overview";
  const active = page === "plan" ? "compare" : page;
  const nav = (r) =>
    '<a href="#/' +
    r +
    '" ' +
    (r === active ? 'class="active" aria-current="page"' : "") +
    ">" +
    icon(routes[r][1]) +
    routes[r][0] +
    "</a>";
  $("#header").innerHTML =
    '<button class="menu" data-action="menu" aria-label="Navigation" aria-expanded="false">☰</button><a href="#/overview" class="brand"><img src="assets/FieldLineLogo.svg" width="36" alt="">Fieldshift</a><a class="desktop ' +
    (active !== "sources" ? "active" : "") +
    '" href="#/overview">Workspace</a><a class="desktop ' +
    (active === "sources" ? "active" : "") +
    '" href="#/sources">Data sources</a><span class="right desktop">' +
    icon("PinOutline") +
    " " +
    esc(state.place) +
    '</span><span class="desktop">EN</span><img class="avatar" src="assets/AccountAvatar.png" alt="Demo farmer">';
  $("#sidebar").classList.remove("open");
  $("#sidebar").innerHTML =
    [
      ["Workspace", ["overview"]],
      ["Planning", ["farm", "priorities", "compare", "saved"]],
      ["Reference", ["sources"]],
    ]
      .map(
        ([k, rs]) =>
          "<section><small>" +
          k +
          "</small>" +
          rs.map(nav).join("") +
          "</section>",
      )
      .join("") +
    '<div class="team">MarshmallowMoon<br><span>Space Apps project</span></div>';
  const title = page === "plan" ? plans[id][0] : routes[page][0];
  document.title = title + " · Fieldshift";
  $("#main").innerHTML =
    '<div class="crumb">' +
    link("overview", "Workspace") +
    "　/　" +
    title +
    "</div>" +
    (page === "plan"
      ? detail(id)
      : { overview, farm, priorities, compare: compares, saved, sources }[
          page
        ]()) +
    '<small class="bottom">Planning options for local review. Field suitability has not been assessed.</small>';
}
function readFarm(form) {
  for (const [k, v] of new FormData(form)) {
    if (k.startsWith("history")) state.history[Number(k.slice(7))] = v;
    else state[k] = v.trim();
  }
}
$(".skip").addEventListener("click", (event) => {
  event.preventDefault();
  $("#main").focus();
});
document.addEventListener("submit", (e) => {
  if (e.target.id !== "farmForm") return;
  e.preventDefault();
  readFarm(e.target);
  const ok = persist();
  if (e.submitter?.value === "next") location.hash = "/priorities";
  else {
    render();
    if (ok) notify("Farm draft saved");
  }
});
document.addEventListener("input", (e) => {
  if (e.target.name === "exclude") {
    state.exclude = e.target.value;
    persist();
    $("#excludeSummary").textContent = state.exclude || "None added";
  }
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const d = b.dataset;
  if (d.action === "menu") {
    b.setAttribute("aria-expanded", $("#sidebar").classList.toggle("open"));
    return;
  }
  if (d.action === "earlier") {
    readFarm($("#farmForm"));
    state.history.push("");
    render();
    return;
  }
  if (d.goal) state.goal = d.goal;
  else if (d.feed) state.feed = d.feed;
  else if (d.save) {
    if (state.saved.includes(d.save)) {
      location.hash = "/saved";
      return;
    }
    state.saved.push(d.save);
    notify("Plan saved for review");
  } else if (d.remove) {
    removed = d.remove;
    state.saved = state.saved.filter((x) => x !== removed);
    notify("Plan removed", true);
  } else if (d.action === "undo" && removed) {
    if (!state.saved.includes(removed)) state.saved.push(removed);
    removed = null;
    notify("Plan restored");
  } else return;
  persist();
  render();
  if (d.goal || d.feed)
    document
      .querySelector(
        d.goal
          ? '[data-goal="' + d.goal + '"]'
          : '[data-feed="' + d.feed + '"]',
      )
      ?.focus();
});
window.addEventListener("hashchange", () => {
  render();
  scrollTo(0, 0);
  $("#main").focus({ preventScroll: true });
});
render();
