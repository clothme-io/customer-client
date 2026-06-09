export async function apiFetch(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || payload.error || "Request failed");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function postToPayload(post) {
  return {
    id: post.id,
    slug: post.slug || "",
    title: post.title || "",
    excerpt: post.excerpt || "",
    category: post.category || "",
    status: post.status || "draft",
    heroImageUrl: post.heroImageUrl || post.image || "",
    heroImageAlt: post.heroImageAlt || post.imageAlt || "",
    author: post.author || "ClothME Team",
    publishedAt: post.publishedAt || null,
    scheduledFor: post.scheduledFor || null,
    readingTime: post.readingTime || "",
    aiSummary: post.aiSummary || "",
    seoTitle: post.seoTitle || "",
    seoDescription: post.seoDescription || "",
    tags: post.tags || [],
    sections: post.sections || [],
    faq: post.faq || []
  };
}
