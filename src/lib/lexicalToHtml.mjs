/**
 * Converts a Payload CMS Lexical JSON document to an HTML string.
 * Handles all node types produced by htmlToLexical() in transform.mjs,
 * plus native Payload editor output.
 */

export function lexicalToHtml(lexicalJson) {
  if (!lexicalJson?.root?.children) return "";
  return renderChildren(lexicalJson.root.children);
}

function renderChildren(children) {
  if (!Array.isArray(children)) return "";
  return children.map(renderNode).join("");
}

function renderNode(node) {
  if (!node) return "";
  switch (node.type) {
    case "heading": {
      const tag = node.tag || "h2";
      const inner = renderChildren(node.children);
      return inner ? `<${tag}>${inner}</${tag}>` : "";
    }
    case "paragraph": {
      const inner = renderChildren(node.children);
      return inner ? `<p>${inner}</p>` : "";
    }
    case "list": {
      const tag = node.listType === "number" ? "ol" : "ul";
      return `<${tag}>${renderChildren(node.children)}</${tag}>`;
    }
    case "listitem": {
      return `<li>${renderChildren(node.children)}</li>`;
    }
    case "link": {
      // Payload v3 stores url inside fields; older docs may have it at top-level
      const url = escapeAttr(node.fields?.url || node.url || "");
      const newTab = node.fields?.newTab || node.newTab;
      const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${url}"${target}>${renderChildren(node.children)}</a>`;
    }
    case "quote": {
      return `<blockquote>${renderChildren(node.children)}</blockquote>`;
    }
    case "code": {
      // Code block — children are codeHighlight or text nodes
      const text = escapeHtml(extractPlainText(node));
      const lang = node.language ? ` class="language-${escapeAttr(node.language)}"` : "";
      return `<pre><code${lang}>${text}</code></pre>`;
    }
    case "horizontalrule": {
      return "<hr>";
    }
    case "linebreak": {
      return "<br>";
    }
    case "text": {
      return renderText(node);
    }
    default: {
      // Unknown nodes: render children if present, otherwise skip
      if (Array.isArray(node.children)) return renderChildren(node.children);
      return "";
    }
  }
}

// Lexical text format bitmask flags
const IS_BOLD        = 1;
const IS_ITALIC      = 2;
const IS_STRIKETHROUGH = 4;
const IS_UNDERLINE   = 8;
const IS_CODE        = 16;
const IS_SUBSCRIPT   = 32;
const IS_SUPERSCRIPT = 64;

function renderText(node) {
  const raw = node.text;
  if (raw === undefined || raw === null) return "";
  if (raw === "") return "";
  let text = escapeHtml(raw);
  const fmt = node.format || 0;
  // Order matters: inline code wraps before bold/italic to avoid nested tags inside <code>
  if (fmt & IS_CODE)          text = `<code>${text}</code>`;
  if (fmt & IS_BOLD)          text = `<strong>${text}</strong>`;
  if (fmt & IS_ITALIC)        text = `<em>${text}</em>`;
  if (fmt & IS_UNDERLINE)     text = `<u>${text}</u>`;
  if (fmt & IS_STRIKETHROUGH) text = `<s>${text}</s>`;
  if (fmt & IS_SUBSCRIPT)     text = `<sub>${text}</sub>`;
  if (fmt & IS_SUPERSCRIPT)   text = `<sup>${text}</sup>`;
  return text;
}

function extractPlainText(node) {
  if (typeof node.text === "string") return node.text;
  if (Array.isArray(node.children)) return node.children.map(extractPlainText).join("");
  return "";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
