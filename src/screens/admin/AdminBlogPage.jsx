import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { AdminGate } from "../../components/admin/AdminGate";
import { SEO } from "../../components/SEO";
import { apiFetch } from "../../lib/api";

export function AdminBlogPage() {
  return (
    <AdminGate>
      <AdminBlogInner />
    </AdminGate>
  );
}

function AdminBlogInner() {
  const { getToken } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadPosts() {
    setIsLoading(true);
    setMessage("");
    try {
      const token = await getToken();
      const data = await apiFetch("/api/admin/posts", { token });
      setPosts(data.posts || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    if (filter === "all") return posts;
    return posts.filter((post) => post.status === filter);
  }, [filter, posts]);

  async function archivePost(id) {
    if (!confirm("Archive this post? It will be hidden from the public blog.")) return;
    const token = await getToken();
    await apiFetch(`/api/admin/posts/${id}`, { method: "DELETE", token });
    await loadPosts();
  }

  async function publishPost(id) {
    const token = await getToken();
    await apiFetch(`/api/admin/posts/${id}/publish`, { method: "POST", token });
    await loadPosts();
  }

  return (
    <>
      <SEO title="Blog admin | ClothME" description="Manage ClothME blog posts." path="/admin/blog" />
      <section className="admin-actions">
        <div className="admin-filters">
          {["all", "draft", "scheduled", "published"].map((item) => (
            <button className={filter === item ? "active" : ""} type="button" key={item} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>
        <a className="admin-primary-button" href="/admin/blog/new">New article</a>
      </section>

      {message ? <p className="admin-message">{message}</p> : null}
      {isLoading ? <p className="admin-message">Loading posts...</p> : null}

      <section className="admin-table" aria-label="Blog posts">
        {filteredPosts.map((post) => (
          <article key={post.id} className="admin-row">
            <div>
              <span className={`status-badge ${post.status}`}>{post.status}</span>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <div className="admin-row-meta">
                <span>{post.slug}</span>
                {post.scheduledFor ? <span>Scheduled: {new Date(post.scheduledFor).toLocaleString()}</span> : null}
              </div>
            </div>
            <div className="admin-row-actions">
              <a href={`/admin/blog/edit/${post.id}`}>Edit</a>
              <a href={`/preview/${post.slug}?token=${post.previewToken}`} target="_blank" rel="noreferrer">Preview</a>
              {post.status !== "published" ? <button type="button" onClick={() => publishPost(post.id)}>Publish</button> : null}
              <button type="button" onClick={() => archivePost(post.id)}>Archive</button>
            </div>
          </article>
        ))}
        {!isLoading && !filteredPosts.length ? <p className="admin-message">No posts found.</p> : null}
      </section>
    </>
  );
}
