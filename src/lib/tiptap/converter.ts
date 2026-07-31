// Converts resume JSON (generated_content) to TipTap-compatible HTML
// All section content becomes standard HTML elements TipTap understands.

interface GeneratedContent {
  summary?: string;
  experience?: Array<{
    company?: string;
    role?: string;
    period?: string;
    bullets?: string[];
  }>;
  projects?: Array<{
    name?: string;
    description?: string;
    tech_stack?: string[];
    bullets?: string[];
  }>;
  researchPapers?: Array<{
    title?: string;
    authors?: string[];
    venue?: string;
    year?: string;
    doi?: string;
    arxivUrl?: string;
    publicationUrl?: string;
    githubUrl?: string;
    description?: string;
    keywords?: string[];
    status?: string;
  }>;
  skills?: unknown;
  education?: Array<{
    institution?: string;
    degree?: string;
    period?: string;
    gpa?: string;
  }>;
  certifications?: Array<{ name?: string; issuer?: string; date?: string }>;
}

interface UserContact {
  full_name?: string;
  email?: string;
  phone_number?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hrefUrl(value: string): string {
  return /^https?:\/\//iu.test(value) ? value : `https://${value}`;
}

function displayUrl(value: string): string {
  return value.replace(/^https?:\/\/(www\.)?/iu, "");
}

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/#+/g, " ")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
});

function formatDateValue(value: unknown): string {
  const text = cleanText(value);
  if (!text) return "";
  if (/^\d{4}$/u.test(text)) return text;

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime()) && /\d{4}|GMT|UTC|T\d{2}:/iu.test(text)) {
    return monthFormatter.format(parsed);
  }

  return text;
}

function formatPeriod(value?: string): string {
  const text = cleanText(value);
  if (!text) return "";

  const parts = text.split(/\s+[–-]\s+/u).filter(Boolean);
  if (parts.length >= 2) {
    const start = formatDateValue(parts[0]);
    const rest = parts.slice(1).join(" - ");
    const end = /^present$/iu.test(rest) ? "Present" : formatDateValue(rest);
    return [start, end].filter(Boolean).join(" - ");
  }

  return formatDateValue(text);
}

const SKILL_CATEGORY_ORDER = [
  "Programming Languages",
  "Frontend",
  "Backend",
  "Databases",
  "Cloud & DevOps",
  "Data & AI",
  "Testing & Quality",
  "Tools",
  "Other",
];

const SKILL_CATEGORY_RULES: Array<{ category: string; keywords: string[] }> = [
  { category: "Programming Languages", keywords: ["typescript", "javascript", "python", "java", "go", "golang", "ruby", "php", "rust", "swift", "kotlin"] },
  { category: "Frontend", keywords: ["react", "next js", "vue", "angular", "html", "css", "tailwind", "redux", "vite"] },
  { category: "Backend", keywords: ["node js", "fastify", "express", "rest api", "graphql", "microservices", "api", "serverless"] },
  { category: "Databases", keywords: ["postgresql", "postgres", "mysql", "mongodb", "redis", "sql", "database", "supabase", "prisma"] },
  { category: "Cloud & DevOps", keywords: ["aws", "gcp", "azure", "docker", "kubernetes", "k8s", "ci cd", "github actions", "terraform", "s3"] },
  { category: "Data & AI", keywords: ["machine learning", "artificial intelligence", "ai", "ml", "llm", "rag", "pandas", "numpy", "scikit learn", "tensorflow", "pytorch"] },
  { category: "Testing & Quality", keywords: ["testing", "vitest", "jest", "playwright", "cypress", "debugging", "performance tuning"] },
  { category: "Tools", keywords: ["git", "github", "jira", "figma", "postman", "linux", "bash"] },
];

function normalizeSkillPhrase(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function categoryForSkill(skill: string): string {
  const normalized = normalizeSkillPhrase(skill);
  return SKILL_CATEGORY_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalized === keyword || ` ${normalized} `.includes(` ${keyword} `)),
  )?.category ?? "Other";
}

function orderSkillCategories(skills: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(skills).sort(([left], [right]) => {
      const leftIndex = SKILL_CATEGORY_ORDER.indexOf(left);
      const rightIndex = SKILL_CATEGORY_ORDER.indexOf(right);
      return (
        (leftIndex === -1 ? SKILL_CATEGORY_ORDER.length : leftIndex) -
          (rightIndex === -1 ? SKILL_CATEGORY_ORDER.length : rightIndex) ||
        left.localeCompare(right)
      );
    }),
  );
}

function collectSkillNames(raw: unknown): string[] | null {
  if (!raw) return null;
  const names: string[] = [];
  if (Array.isArray(raw)) {
    names.push(
      ...(raw as unknown[]).map((s) => {
        if (typeof s === "string") return s.trim();
        if (s && typeof s === "object") {
          const o = s as Record<string, unknown>;
          return String(o.name ?? o.skill_name ?? o.title ?? "").trim();
        }
        return "";
      }).filter(Boolean),
    );
  } else if (typeof raw === "object") {
    for (const values of Object.values(raw as Record<string, unknown>)) {
      names.push(
        ...(Array.isArray(values)
          ? values.map((item) => String(item).trim()).filter(Boolean)
          : String(values ?? "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)),
      );
    }
  }
  return Array.from(new Set(names));
}

function normalizeSkills(raw: unknown): Record<string, string[]> | null {
  const names = collectSkillNames(raw);
  if (!names?.length) return null;
  const categorized: Record<string, string[]> = {};
  for (const name of names) {
    const category = categoryForSkill(name);
    categorized[category] = [...(categorized[category] ?? []), name];
  }
  return orderSkillCategories(categorized);
}

function isInvalidSummary(value?: string): boolean {
  const text = cleanText(value);
  return !text || /^#|job description|^company$/iu.test(text);
}

function fallbackSummary(content: GeneratedContent): string {
  const skills = Object.values(normalizeSkills(content.skills) ?? {})
    .flat()
    .slice(0, 5);
  const evidence = [
    ...(content.experience ?? []).map((item) => item.role || item.company),
    ...(content.projects ?? []).map((item) => item.name),
  ]
    .filter(Boolean)
    .slice(0, 2);
  const skillText = skills.length
    ? ` with strength in ${skills.join(", ")}`
    : "";
  const evidenceText = evidence.length
    ? `, backed by ${evidence.join(" and ")}`
    : "";
  return `Candidate profile aligned to the target role${skillText}${evidenceText}. Brings relevant portfolio evidence and practical execution to deliver measurable impact.`;
}

export function generatedContentToHtml(
  content: GeneratedContent,
  user?: UserContact | null,
): string {
  let html = "";

  // ── Header ────────────────────────────────────────────────────────────────
  const name = user?.full_name || "Your Name";
  html += `<h1>${esc(name)}</h1>`;

  const contactParts: string[] = [];
  if (user?.email)
    contactParts.push(
      `<a href="mailto:${esc(user.email)}">${esc(user.email)}</a>`,
    );
  if (user?.phone_number)
    contactParts.push(
      `<a href="tel:${esc(user.phone_number.replace(/\s+/g, ""))}">${esc(user.phone_number)}</a>`,
    );
  if (user?.location) contactParts.push(esc(user.location));
  if (contactParts.length) {
    html += `<p>${contactParts.join(" | ")}</p>`;
  }

  const socialParts: string[] = [];
  if (user?.github_url)
    socialParts.push(
      `<a href="${esc(hrefUrl(user.github_url))}">${esc(displayUrl(user.github_url))}</a>`,
    );
  if (user?.linkedin_url)
    socialParts.push(
      `<a href="${esc(hrefUrl(user.linkedin_url))}">${esc(displayUrl(user.linkedin_url))}</a>`,
    );
  if (user?.portfolio_url)
    socialParts.push(
      `<a href="${esc(hrefUrl(user.portfolio_url))}">${esc(displayUrl(user.portfolio_url))}</a>`,
    );
  if (socialParts.length) {
    html += `<p>${socialParts.join(" | ")}</p>`;
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary = isInvalidSummary(content.summary)
    ? fallbackSummary(content)
    : cleanText(content.summary);
  if (summary) {
    html += `<h2>Summary</h2><p>${esc(summary)}</p>`;
  }

  // ── Experience ────────────────────────────────────────────────────────────
  if (content.experience?.length) {
    html += "<h2>Experience</h2>";
    for (const exp of content.experience) {
      const title = [exp.role, exp.company]
        .map(cleanText)
        .filter(Boolean)
        .map(esc)
        .join(" · ");
      const periodText = formatPeriod(exp.period);
      const period = periodText ? `<em>  ${esc(periodText)}</em>` : "";
      html += `<p><strong>${title}</strong>${period}</p>`;
      if (exp.bullets?.length) {
        html +=
          "<ul>" +
          exp.bullets
            .map(cleanText)
            .filter(Boolean)
            .map((b) => `<li>${esc(b)}</li>`)
            .join("") +
          "</ul>";
      }
    }
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  if (content.projects?.length) {
    html += "<h2>Projects</h2>";
    for (const proj of content.projects) {
      const tech = proj.tech_stack?.length
        ? `<em>  ${esc(proj.tech_stack.map(cleanText).filter(Boolean).join(" · "))}</em>`
        : "";
      html += `<p><strong>${esc(cleanText(proj.name))}</strong>${tech}</p>`;
      if (proj.description)
        html += `<p>${esc(cleanText(proj.description))}</p>`;
      if (proj.bullets?.length) {
        html +=
          "<ul>" +
          proj.bullets
            .map(cleanText)
            .filter(Boolean)
            .map((b) => `<li>${esc(b)}</li>`)
            .join("") +
          "</ul>";
      }
    }
  }

  // ── Research Papers ──────────────────────────────────────────────────────
  if (content.researchPapers?.length) {
    html += "<h2>Research Papers</h2>";
    for (const paper of content.researchPapers) {
      const authors = paper.authors?.length ? ` · ${esc(paper.authors.map(cleanText).filter(Boolean).join(", "))}` : "";
      const venueYear = [paper.venue, paper.year].map(cleanText).filter(Boolean).join(" · ");
      const meta = venueYear ? `<em>  ${esc(venueYear)}</em>` : "";
      html += `<p><strong>${esc(cleanText(paper.title))}</strong>${authors}${meta}</p>`;
      if (paper.description) html += `<p>${esc(cleanText(paper.description))}</p>`;
      const links = [
        paper.doi ? `DOI: ${paper.doi}` : "",
        paper.arxivUrl ? `arXiv: ${displayUrl(paper.arxivUrl)}` : "",
        paper.publicationUrl ? `Publication: ${displayUrl(paper.publicationUrl)}` : "",
        paper.githubUrl ? `Code: ${displayUrl(paper.githubUrl)}` : "",
      ].filter(Boolean);
      if (links.length) html += `<p>${esc(links.join(" · "))}</p>`;
    }
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  const skills = normalizeSkills(content.skills);
  if (skills && Object.keys(skills).length) {
    html += "<h2>Skills</h2>";
    for (const [cat, list] of Object.entries(skills)) {
      html += `<p><strong>${esc(cat)}:</strong> ${esc(list.join(", "))}</p>`;
    }
  }

  // ── Education ─────────────────────────────────────────────────────────────
  if (content.education?.length) {
    html += "<h2>Education</h2>";
    for (const edu of content.education) {
      const gpa = edu.gpa ? ` — GPA: ${esc(cleanText(edu.gpa))}` : "";
      const periodText = formatPeriod(edu.period);
      const period = periodText ? `<em>  ${esc(periodText)}</em>` : "";
      html += `<p><strong>${esc(cleanText(edu.degree))}</strong> · ${esc(cleanText(edu.institution))}${gpa}${period}</p>`;
    }
  }

  // ── Certifications ────────────────────────────────────────────────────────
  if (content.certifications?.length) {
    html += "<h2>Certifications</h2>";
    for (const cert of content.certifications) {
      const issuer = cert.issuer ? ` — ${esc(cleanText(cert.issuer))}` : "";
      const date = cert.date ? ` (${esc(cleanText(cert.date))})` : "";
      html += `<p><strong>${esc(cleanText(cert.name))}</strong>${issuer}${date}</p>`;
    }
  }

  return html;
}

// Extract named sections from TipTap HTML for the sidebar
export interface ResumeSection {
  id: string;
  title: string;
  html: string; // includes the <h2> and its following content
}

export function extractSections(editorHtml: string): {
  header: string;
  sections: ResumeSection[];
} {
  const doc = new DOMParser().parseFromString(
    `<body>${editorHtml}</body>`,
    "text/html",
  );
  const body = doc.body;

  const headerNodes: string[] = [];
  const sections: ResumeSection[] = [];
  let currentTitle = "";
  let currentNodes: string[] = [];
  let sectionOpen = false;

  for (const node of Array.from(body.childNodes)) {
    const el = node as Element;
    const isH2 = el.nodeType === Node.ELEMENT_NODE && el.tagName === "H2";

    if (isH2) {
      if (sectionOpen && currentNodes.length) {
        sections.push({
          id: crypto.randomUUID(),
          title: currentTitle,
          html: currentNodes.join(""),
        });
      }
      currentTitle = el.textContent ?? "Section";
      currentNodes = [el.outerHTML];
      sectionOpen = true;
    } else if (sectionOpen) {
      currentNodes.push(el.nodeType === Node.ELEMENT_NODE ? el.outerHTML : "");
    } else {
      headerNodes.push(el.nodeType === Node.ELEMENT_NODE ? el.outerHTML : "");
    }
  }

  if (sectionOpen && currentNodes.length) {
    sections.push({
      id: crypto.randomUUID(),
      title: currentTitle,
      html: currentNodes.join(""),
    });
  }

  return { header: headerNodes.join(""), sections };
}

export function reconstructHtml(
  header: string,
  sections: ResumeSection[],
): string {
  return header + sections.map((s) => s.html).join("");
}

// Produces a complete HTML document for PDF rendering via Puppeteer
export function buildPdfDocument(editorHtml: string, template: string): string {
  const templateCss = getTemplateCss(template);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10.5pt; color: #1a1a1a; line-height: 1.5; }
  ${templateCss}
</style>
</head>
<body class="resume-body">
${editorHtml}
</body>
</html>`;
}

function getTemplateCss(template: string): string {
  switch (template) {
    case "academic":
      return `
@page { size: A4; margin: 0; }
html, body {
  width: 210mm;
  min-height: 297mm;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.resume-body {
  width: 210mm;
  min-height: 297mm;
  padding: 10.5mm;
  background: #fff;
  font-family: "CMU Serif", "Latin Modern Roman", "Computer Modern", "Times New Roman", Georgia, serif;
  font-size: 12pt;
  line-height: 1.2;
  color: #111;
  overflow-wrap: break-word;
  hyphens: auto;
}
h1 {
  font-family: "CMU Serif", "Latin Modern Roman", "Computer Modern", "Times New Roman", Georgia, serif;
  font-size: 25pt;
  font-weight: 400;
  text-align: center;
  color: #111;
  border: 0;
  padding: 0;
  margin: 0 0 5px;
  line-height: 1.08;
  letter-spacing: 0;
}
h1 + p,
h1 + p + p {
  text-align: center;
  font-size: 12pt;
  color: #111;
  margin: 0 0 4px;
  line-height: 1.2;
}
h1 + p + p { margin-bottom: 18px; }
h2 {
  font-family: "CMU Serif", "Latin Modern Roman", "Computer Modern", "Times New Roman", Georgia, serif;
  font-size: 17.5pt;
  font-weight: 500;
  font-variant: small-caps;
  text-transform: uppercase;
  letter-spacing: 0;
  color: #111;
  border-bottom: 1px solid #222;
  padding-bottom: 2px;
  margin: 18px 0 10px;
  line-height: 1.05;
  break-after: avoid;
  page-break-after: avoid;
}
p {
  font-size: 12pt;
  line-height: 1.2;
  color: #111;
  margin-bottom: 5px;
}
ul, ol {
  padding-left: 18pt;
  margin: 4px 0 8px;
}
li {
  font-size: 12pt;
  line-height: 1.2;
  color: #111;
  margin-bottom: 2px;
  padding-left: 2px;
}
a {
  color: #003399;
  text-decoration: none;
}
strong { font-weight: 700; }
em { font-style: italic; color: #111; }
section, h2, p, ul, ol { break-inside: auto; page-break-inside: auto; }
h2, h3, p:has(strong), li { break-inside: avoid; page-break-inside: avoid; }`;
    case "modern":
      return `
.resume-body { padding: 18mm 16mm; font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; }
h1 { font-size: 22pt; font-weight: 700; color: #111; border-bottom: 3px solid #b8963e; padding-bottom: 8px; margin-bottom: 5px; }
h2 { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #b8963e; border-bottom: 1px solid #e8d8b0; padding-bottom: 3px; margin: 14px 0 7px; }
p { font-size: 10.5pt; line-height: 1.5; margin-bottom: 3px; }
ul { padding-left: 16px; margin: 4px 0; }
li { font-size: 10pt; margin-bottom: 2px; }
strong { font-weight: 700; }
em { font-style: italic; color: #666; }`;
    case "compact":
      return `
.resume-body { padding: 12mm 12mm; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 9.5pt; }
h1 { font-size: 18pt; font-weight: 700; color: #111; margin-bottom: 4px; }
h2 { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #444; border-bottom: 1px solid #ddd; padding-bottom: 2px; margin: 10px 0 5px; }
p { font-size: 9.5pt; line-height: 1.4; margin-bottom: 2px; }
ul { padding-left: 14px; margin: 3px 0; }
li { font-size: 9pt; margin-bottom: 1px; }`;
    case "elegant":
      return `
.resume-body { padding: 18mm 16mm; font-family: Georgia, 'Times New Roman', serif; }
h1 { font-family: Georgia, serif; font-size: 24pt; font-weight: 700; color: #111; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 6px; letter-spacing: -0.5px; }
h2 { font-family: Georgia, serif; font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin: 16px 0 8px; }
p { font-size: 10.5pt; line-height: 1.55; margin-bottom: 4px; }
ul { padding-left: 18px; margin: 5px 0; }
li { font-size: 10pt; margin-bottom: 3px; }`;
    default: // classic
      return `
.resume-body { padding: 18mm 16mm; font-family: 'Helvetica Neue', Arial, sans-serif; }
h1 { font-family: Georgia, serif; font-size: 22pt; font-weight: 700; color: #111; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 6px; letter-spacing: -0.3px; }
h2 { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #555; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin: 14px 0 7px; }
p { font-size: 10.5pt; line-height: 1.5; margin-bottom: 3px; }
ul { padding-left: 16px; margin: 4px 0; }
li { font-size: 10pt; margin-bottom: 2px; }
strong { font-weight: 700; }
em { font-style: italic; color: #666; }`;
  }
}
