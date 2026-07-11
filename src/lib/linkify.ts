/* Turn bare URLs inside stored rich-text HTML into clickable links, without
   double-linking anything already wrapped in an <a>. Runs on display only —
   the source HTML is left untouched. */

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)"'\]])/g;

export function linkifyHtml(html: string): string {
  if (!html || !html.includes("http")) return html;

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstChild as HTMLElement | null;
  if (!root) return html;

  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const targets: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.textContent || "";
    if (!text.includes("http")) continue;
    // skip text already inside an anchor
    let p = node.parentElement;
    let insideAnchor = false;
    while (p && p !== root) {
      if (p.tagName === "A") { insideAnchor = true; break; }
      p = p.parentElement;
    }
    if (!insideAnchor) targets.push(node as Text);
  }

  for (const t of targets) {
    const text = t.textContent || "";
    const frag = doc.createDocumentFragment();
    let last = 0;
    for (const m of text.matchAll(URL_RE)) {
      const start = m.index ?? 0;
      if (start > last) frag.appendChild(doc.createTextNode(text.slice(last, start)));
      const a = doc.createElement("a");
      a.href = m[0];
      a.textContent = m[0];
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      frag.appendChild(a);
      last = start + m[0].length;
    }
    if (last < text.length) frag.appendChild(doc.createTextNode(text.slice(last)));
    t.parentNode?.replaceChild(frag, t);
  }

  return root.innerHTML;
}
