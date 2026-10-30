import { Fragment } from "react";

function inline(value) {
  return value.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith("**") && part.endsWith("**")
    ? <strong key={index}>{part.slice(2, -2)}</strong> : <Fragment key={index}>{part}</Fragment>);
}

export function CareerMarkdown({ source }) {
  const blocks = [];
  let list = [];
  let paragraph = [];
  const flushList = () => { if (list.length) { blocks.push({ type: "list", content: list }); list = []; } };
  const flushParagraph = () => { if (paragraph.length) { blocks.push({ type: "paragraph", content: paragraph.join(" ") }); paragraph = []; } };
  for (const raw of String(source || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line === "---") { flushList(); flushParagraph(); continue; }
    if (line.startsWith("# ")) continue;
    if (line.startsWith("## ") || line.startsWith("### ")) {
      flushList(); flushParagraph(); blocks.push({ type: line.startsWith("### ") ? "h3" : "h2", content: line.replace(/^#{2,3}\s+/, "") }); continue;
    }
    if (line.startsWith("- ")) { flushParagraph(); list.push(line.slice(2)); continue; }
    flushList(); paragraph.push(line);
  }
  flushList(); flushParagraph();
  return <>{blocks.map((block, index) => block.type === "h2" ? <h2 key={index}>{inline(block.content)}</h2>
    : block.type === "h3" ? <h3 key={index}>{inline(block.content)}</h3>
    : block.type === "list" ? <ul key={index}>{block.content.map((item, itemIndex) => <li key={itemIndex}>{inline(item)}</li>)}</ul>
    : <p key={index}>{inline(block.content)}</p>)}</>;
}
