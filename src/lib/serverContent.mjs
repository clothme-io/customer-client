import { mergePostsBySlug, posts as fallbackPosts } from "../data/posts.js";
import { hasDatabase } from "../../server/db.mjs";
import { listPosts } from "../../server/posts.mjs";

export async function getPublicPosts() {
  if (!hasDatabase()) {
    return fallbackPosts;
  }

  try {
    const posts = await listPosts({ admin: false });
    return mergePostsBySlug(posts, fallbackPosts);
  } catch (error) {
    console.warn(`Could not load posts from database. Falling back to local posts. ${error.message}`);
    return fallbackPosts;
  }
}

export function serializePost(post) {
  if (!post) return null;
  return {
    ...post,
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
    scheduledFor: post.scheduledFor ? new Date(post.scheduledFor).toISOString() : null,
    updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null
  };
}

export function serializePosts(posts) {
  return posts.map(serializePost);
}
