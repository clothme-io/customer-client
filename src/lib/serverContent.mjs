import { getPayload } from "payload";
import config from "@payload-config";
import { posts as fallbackPosts, mergePostsBySlug } from "../data/posts.js";
import { mapPayloadPostToLegacy } from "../../server/webhooks/transform.mjs";

async function getPayloadPosts({ slug } = {}) {
  const payload = await getPayload({ config });

  if (slug) {
    const result = await payload.find({
      collection: "cms-posts",
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: "published" } },
        ],
      },
      limit: 1,
      depth: 1,
    });
    return result.docs[0] ? [mapPayloadPostToLegacy(result.docs[0])] : [];
  }

  const result = await payload.find({
    collection: "cms-posts",
    where: { status: { equals: "published" } },
    sort: "-publishedAt",
    limit: 50,
    depth: 1,
  });
  return result.docs.map(doc => mapPayloadPostToLegacy(doc));
}

export async function getPublicPosts() {
  try {
    const posts = await getPayloadPosts();
    return mergePostsBySlug(posts, fallbackPosts);
  } catch (error) {
    console.warn(`Could not load posts from Payload CMS. Falling back to local posts. ${error.message}`);
    return fallbackPosts;
  }
}

export async function getPublicPost(slug) {
  try {
    const posts = await getPayloadPosts({ slug });
    return posts[0] || null;
  } catch (error) {
    console.warn(`Could not load post "${slug}" from Payload CMS. ${error.message}`);
    return null;
  }
}

export function serializePost(post) {
  if (!post) return null;
  return {
    ...post,
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
    updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null
  };
}

export function serializePosts(posts) {
  return posts.map(serializePost);
}
