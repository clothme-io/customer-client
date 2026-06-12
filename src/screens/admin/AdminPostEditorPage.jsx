import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { AdminGate } from "../../components/admin/AdminGate";
import { PostEditor } from "../../components/admin/PostEditor";
import { SEO } from "../../components/SEO";
import { apiFetch } from "../../lib/api";

export function AdminPostEditorPage({ mode, id }) {
  return (
    <AdminGate>
      <AdminPostEditorInner mode={mode} id={id} />
    </AdminGate>
  );
}

function AdminPostEditorInner({ mode, id }) {
  const { getToken } = useAuth();
  const [post, setPost] = useState(null);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const isEdit = mode === "edit";

  useEffect(() => {
    async function setup() {
      try {
        const authToken = await getToken();
        setToken(authToken || "");
        if (isEdit) {
          const data = await apiFetch(`/api/admin/posts/${id}`, { token: authToken });
          setPost(data.post);
        }
      } catch (error) {
        setMessage(error.message);
      }
    }
    setup();
  }, [getToken, id, isEdit]);

  async function savePost(payload) {
    const method = payload.id ? "PUT" : "POST";
    const path = payload.id ? `/api/admin/posts/${payload.id}` : "/api/admin/posts";
    const data = await apiFetch(path, {
      method,
      token,
      body: JSON.stringify(payload)
    });
    setPost(data.post);
    if (!payload.id && data.post?.id) {
      window.history.replaceState(null, "", `/admin/blog/edit/${data.post.id}`);
    }
    return data.post;
  }

  return (
    <>
      <SEO title={isEdit ? "Edit article | ClothME" : "New article | ClothME"} description="Create and edit ClothME blog articles." path={isEdit ? `/admin/blog/edit/${id}` : "/admin/blog/new"} />
      {message ? <p className="admin-message">{message}</p> : null}
      {isEdit && !post && !message ? <p className="admin-message">Loading article...</p> : null}
      {(!isEdit || post) && token ? <PostEditor initialPost={post} token={token} onSave={savePost} /> : null}
    </>
  );
}
