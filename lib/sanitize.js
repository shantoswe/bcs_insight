import sanitizeHtml from "sanitize-html";

// Allow only a small, safe subset for question/explanation rich text.
const OPTIONS = {
  allowedTags: [
    "b", "i", "em", "strong", "u", "sub", "sup", "br", "p", "span",
    "ul", "ol", "li", "blockquote", "code", "pre",
  ],
  allowedAttributes: {
    span: ["style"],
  },
  allowedStyles: {
    span: {
      "color": [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/],
      "font-weight": [/^bold$/, /^\d+$/],
    },
  },
};

export function sanitize(dirty) {
  if (!dirty) return "";
  return sanitizeHtml(String(dirty), OPTIONS);
}

// plain-text: strip everything
export function stripHtml(dirty) {
  if (!dirty) return "";
  return sanitizeHtml(String(dirty), { allowedTags: [], allowedAttributes: {} });
}
