// Converts resume JSON (generated_content) to TipTap-compatible HTML
// All section content becomes standard HTML elements TipTap understands.

interface GeneratedContent {
  summary?: string;
  experience?: Array<{ company?: string; role?: string; period?: string; bullets?: string[] }>;
  projects?: Array<{ name?: string; description?: string; tech_stack?: string[]; bullets?: string[] }>;
  skills?: unknown;
  education?: Array<{ institution?: string; degree?: string; period?: string; gpa?: string }>;
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

function normalizeSkills(raw: unknown): Record<string, string[]> | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const names = (raw as unknown[])
      .map((s) => {
        if (typeof s === "string") return s;
        if (s && typeof s === "object") {
          const o = s as Record<string, unknown>;
          return String(o.name ?? o.skill_name ?? o.title ?? "");
        }
        return "";
      })
      .filter(Boolean);
    return names.length ? { Skills: names } : null;
  }
  if (typeof raw === "object") return raw as Record<string, string[]>;
  return null;
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
  if (user?.email) contactParts.push(esc(user.email));
  if (user?.phone_number) contactParts.push(esc(user.phone_number));
  if (user?.location) contactParts.push(esc(user.location));
  if (user?.linkedin_url) contactParts.push(esc(user.linkedin_url.replace(/^https?:\/\/(www\.)?/u, "")));
  if (user?.github_url) contactParts.push(esc(user.github_url.replace(/^https?:\/\/(www\.)?/u, "")));
  if (user?.portfolio_url) contactParts.push(esc(user.portfolio_url.replace(/^https?:\/\/(www\.)?/u, "")));
  if (contactParts.length) {
    html += `<p>${contactParts.join(" · ")}</p>`;
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  if (content.summary) {
    html += `<h2>Summary</h2><p>${esc(content.summary)}</p>`;
  }

  // ── Experience ────────────────────────────────────────────────────────────
  if (content.experience?.length) {
    html += "<h2>Experience</h2>";
    for (const exp of content.experience) {
      const title = [exp.role, exp.company].filter((s): s is string => Boolean(s)).map(esc).join(" · ");
      const period = exp.period ? `<em>  ${esc(exp.period)}</em>` : "";
      html += `<p><strong>${title}</strong>${period}</p>`;
      if (exp.bullets?.length) {
        html += "<ul>" + exp.bullets.map((b) => `<li>${esc(b)}</li>`).join("") + "</ul>";
      }
    }
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  if (content.projects?.length) {
    html += "<h2>Projects</h2>";
    for (const proj of content.projects) {
      const tech = proj.tech_stack?.length ? `<em>  ${esc(proj.tech_stack.join(" · "))}</em>` : "";
      html += `<p><strong>${esc(proj.name ?? "")}</strong>${tech}</p>`;
      if (proj.description) html += `<p>${esc(proj.description)}</p>`;
      if (proj.bullets?.length) {
        html += "<ul>" + proj.bullets.map((b) => `<li>${esc(b)}</li>`).join("") + "</ul>";
      }
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
      const gpa = edu.gpa ? ` — GPA: ${esc(edu.gpa)}` : "";
      const period = edu.period ? `<em>  ${esc(edu.period)}</em>` : "";
      html += `<p><strong>${esc(edu.degree ?? "")}</strong> · ${esc(edu.institution ?? "")}${gpa}${period}</p>`;
    }
  }

  // ── Certifications ────────────────────────────────────────────────────────
  if (content.certifications?.length) {
    html += "<h2>Certifications</h2>";
    for (const cert of content.certifications) {
      const issuer = cert.issuer ? ` — ${esc(cert.issuer)}` : "";
      const date = cert.date ? ` (${esc(cert.date)})` : "";
      html += `<p><strong>${esc(cert.name ?? "")}</strong>${issuer}${date}</p>`;
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
  const doc = new DOMParser().parseFromString(`<body>${editorHtml}</body>`, "text/html");
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
        sections.push({ id: crypto.randomUUID(), title: currentTitle, html: currentNodes.join("") });
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
    sections.push({ id: crypto.randomUUID(), title: currentTitle, html: currentNodes.join("") });
  }

  return { header: headerNodes.join(""), sections };
}

export function reconstructHtml(header: string, sections: ResumeSection[]): string {
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
