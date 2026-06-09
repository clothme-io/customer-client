import { useMemo, useState } from "react";
import { apiFetch, postToPayload } from "../../lib/api";

const emptyPost = {
  slug: "",
  title: "",
  excerpt: "",
  category: "",
  status: "draft",
  heroImageUrl: "",
  heroImageAlt: "",
  author: "ClothME Team",
  publishedAt: "",
  scheduledFor: "",
  readingTime: "",
  aiSummary: "",
  seoTitle: "",
  seoDescription: "",
  tags: [],
  sections: [{ heading: "", body: "" }],
  faq: [{ question: "", answer: "" }]
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function PostEditor({ initialPost, token, onSave }) {
  const [post, setPost] = useState(postToPayload(initialPost || emptyPost));
  const [tagText, setTagText] = useState((initialPost?.tags || []).join(", "));
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const warnings = useMemo(() => validatePost({ ...post, tags: tagText.split(",").map((tag) => tag.trim()).filter(Boolean) }), [post, tagText]);

  function update(field, value) {
    setPost((current) => ({ ...current, [field]: value }));
  }

  function updateList(field, index, key, value) {
    setPost((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item))
    }));
  }

  function addListItem(field, item) {
    setPost((current) => ({ ...current, [field]: [...current[field], item] }));
  }

  function removeListItem(field, index) {
    setPost((current) => ({ ...current, [field]: current[field].filter((_, itemIndex) => itemIndex !== index) }));
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage("");

    try {
      const data = new FormData();
      data.append("image", file);
      const result = await apiFetch("/api/admin/upload", {
        method: "POST",
        body: data,
        token
      });
      update("heroImageUrl", result.url);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  async function submit(statusOverride) {
    setIsSaving(true);
    setMessage("");

    try {
      const payload = {
        ...post,
        status: statusOverride || post.status,
        tags: tagText.split(",").map((tag) => tag.trim()).filter(Boolean)
      };
      const result = await onSave(payload);
      setPost(postToPayload(result));
      setTagText((result.tags || []).join(", "));
      setMessage("Saved.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="editor-grid">
      <form className="editor-form" onSubmit={(event) => event.preventDefault()}>
        <div className="editor-card">
          <h2>Article basics</h2>
          <label>
            Title
            <input value={post.title} onChange={(event) => update("title", event.target.value)} onBlur={() => !post.slug && update("slug", slugify(post.title))} />
          </label>
          <label>
            Slug
            <input value={post.slug} onChange={(event) => update("slug", slugify(event.target.value))} />
          </label>
          <label>
            Excerpt
            <textarea value={post.excerpt} onChange={(event) => update("excerpt", event.target.value)} />
          </label>
          <div className="editor-two">
            <label>
              Category
              <input value={post.category} onChange={(event) => update("category", event.target.value)} />
            </label>
            <label>
              Author
              <input value={post.author} onChange={(event) => update("author", event.target.value)} />
            </label>
          </div>
          <div className="editor-two">
            <label>
              Status
              <select value={post.status} onChange={(event) => update("status", event.target.value)}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label>
              Reading time
              <input value={post.readingTime} onChange={(event) => update("readingTime", event.target.value)} placeholder="4 min read" />
            </label>
          </div>
          <label>
            Scheduled for
            <input type="datetime-local" value={post.scheduledFor ? post.scheduledFor.slice(0, 16) : ""} onChange={(event) => update("scheduledFor", event.target.value)} />
          </label>
        </div>

        <div className="editor-card">
          <h2>Hero image</h2>
          <label>
            Upload to Bunny.net
            <input type="file" accept="image/*" onChange={uploadImage} />
          </label>
          {isUploading ? <p className="admin-message">Uploading...</p> : null}
          <label>
            Image URL
            <input value={post.heroImageUrl} onChange={(event) => update("heroImageUrl", event.target.value)} />
          </label>
          <label>
            Image alt text
            <input value={post.heroImageAlt} onChange={(event) => update("heroImageAlt", event.target.value)} />
          </label>
        </div>

        <div className="editor-card">
          <h2>SEO and AI search</h2>
          <label>
            SEO title
            <input value={post.seoTitle} onChange={(event) => update("seoTitle", event.target.value)} />
          </label>
          <label>
            SEO description
            <textarea value={post.seoDescription} onChange={(event) => update("seoDescription", event.target.value)} />
          </label>
          <label>
            AI summary
            <textarea value={post.aiSummary} onChange={(event) => update("aiSummary", event.target.value)} />
          </label>
          <label>
            Tags, comma-separated
            <input value={tagText} onChange={(event) => setTagText(event.target.value)} />
          </label>
        </div>

        <div className="editor-card">
          <h2>Article sections</h2>
          {post.sections.map((section, index) => (
            <div className="nested-editor" key={index}>
              <label>
                Heading
                <input value={section.heading} onChange={(event) => updateList("sections", index, "heading", event.target.value)} />
              </label>
              <label>
                Body
                <textarea value={section.body} onChange={(event) => updateList("sections", index, "body", event.target.value)} />
              </label>
              <button type="button" onClick={() => removeListItem("sections", index)}>Remove section</button>
            </div>
          ))}
          <button type="button" onClick={() => addListItem("sections", { heading: "", body: "" })}>Add section</button>
        </div>

        <div className="editor-card">
          <h2>FAQs</h2>
          {post.faq.map((item, index) => (
            <div className="nested-editor" key={index}>
              <label>
                Question
                <input value={item.question} onChange={(event) => updateList("faq", index, "question", event.target.value)} />
              </label>
              <label>
                Answer
                <textarea value={item.answer} onChange={(event) => updateList("faq", index, "answer", event.target.value)} />
              </label>
              <button type="button" onClick={() => removeListItem("faq", index)}>Remove FAQ</button>
            </div>
          ))}
          <button type="button" onClick={() => addListItem("faq", { question: "", answer: "" })}>Add FAQ</button>
        </div>
      </form>

      <aside className="editor-sidebar">
        <div className="editor-card">
          <h2>Publish controls</h2>
          <button className="admin-primary-button" type="button" onClick={() => submit()} disabled={isSaving}>Save</button>
          <button type="button" onClick={() => submit("draft")} disabled={isSaving}>Save draft</button>
          <button type="button" onClick={() => submit("published")} disabled={isSaving}>Publish now</button>
          <button type="button" onClick={() => submit("scheduled")} disabled={isSaving}>Schedule</button>
          {post.previewToken && post.slug ? <a href={`/preview/${post.slug}?token=${post.previewToken}`} target="_blank" rel="noreferrer">Open preview</a> : null}
          {message ? <p className="admin-message">{message}</p> : null}
        </div>

        <div className="editor-card">
          <h2>SEO checks</h2>
          <ul className="validation-list">
            {warnings.map((warning) => <li key={warning}>{warning}</li>)}
            {!warnings.length ? <li>Looks ready to publish.</li> : null}
          </ul>
        </div>
      </aside>
    </section>
  );
}

function validatePost(post) {
  const warnings = [];
  if (!post.title) warnings.push("Missing title.");
  if (!post.slug) warnings.push("Missing slug.");
  if (!post.excerpt) warnings.push("Missing excerpt/meta description.");
  if (!post.heroImageUrl) warnings.push("Missing hero image.");
  if (!post.heroImageAlt) warnings.push("Missing image alt text.");
  if (!post.aiSummary) warnings.push("Missing AI summary.");
  if (!post.seoTitle) warnings.push("Missing SEO title.");
  if (!post.seoDescription) warnings.push("Missing SEO description.");
  if (!post.sections?.some((section) => section.heading && section.body)) warnings.push("Add at least one complete article section.");
  if (!post.faq?.some((item) => item.question && item.answer)) warnings.push("Add at least one FAQ for rich results.");
  if (post.seoTitle && post.seoTitle.length > 60) warnings.push("SEO title is over 60 characters.");
  if (post.seoDescription && post.seoDescription.length > 160) warnings.push("SEO description is over 160 characters.");
  return warnings;
}
