"use client";

import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// Renders question/option/explanation text with:
//  • LaTeX math:  inline  $x^2$    and display  $$\frac{a}{b}$$
//  • simple formatting tags: <sub> <sup> <b> <strong> <i> <em> <u> <br>
// Everything else is escaped, so this is safe for admin-authored content.

const ALLOWED = /&lt;(\/?(?:sub|sup|b|strong|i|em|u|br))\s*\/?&gt;/gi;

function escapeText(s) {
  const esc = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(ALLOWED, "<$1>");
}

function toHtml(input) {
  const s = String(input ?? "");
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let html = "";
  let last = 0;
  let m;
  while ((m = re.exec(s))) {
    if (m.index > last) html += escapeText(s.slice(last, m.index));
    const tex = m[1] ?? m[2];
    const display = m[1] != null;
    try {
      html += katex.renderToString(tex, { throwOnError: false, displayMode: display });
    } catch {
      html += escapeText(m[0]);
    }
    last = re.lastIndex;
  }
  if (last < s.length) html += escapeText(s.slice(last));
  return html;
}

export function MathText({ children, as: Tag = "span", className, ...props }) {
  const html = useMemo(() => toHtml(children), [children]);
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} {...props} />;
}
