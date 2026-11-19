import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyCategory, transformToPayloadPost, validateNormalizedArticle } from '../../server/webhooks/transform.mjs';

const body = Array.from({ length: 90 }, () => 'People can compare clothing online and choose garments that fit their needs.').join(' ');

function article(overrides = {}) {
  return {
    provider: 'outrank',
    title: 'A practical guide to shopping online',
    slug: 'practical-shopping-guide',
    content: `<p>${body}</p>`,
    metaDescription: 'Advice for choosing clothing online.',
    tags: [],
    ...overrides,
  };
}

test('classifies provider articles without a category and falls back to Shopping Guides', () => {
  assert.equal(classifyCategory('How to measure for a better fit', body), 'fit-guide');
  assert.equal(classifyCategory('AI body measurement for online shopping', body), 'ai-fashion-technology');
  assert.equal(classifyCategory('ClothME launch: our app is here', body), 'clothme-updates');
  assert.equal(classifyCategory('Finding the right denim fabric', body), 'brands-fabrics');
  assert.equal(classifyCategory('A thoughtful way to choose a new coat', body), 'shopping-guides');
});

test('valid articles are assigned a category and published through Payload data', () => {
  const input = article();
  assert.equal(validateNormalizedArticle(input).valid, true);
  const post = transformToPayloadPost(input);
  assert.equal(post.category, 'shopping-guides');
  assert.equal(post._status, 'published');
  assert.equal(post.status, 'published');
  assert.equal(post.seo.canonicalUrl.endsWith('/blog/practical-shopping-guide'), true);
});

test('invalid article links are rejected before publication', () => {
  const result = validateNormalizedArticle(article({ content: `<p>${body}</p><a href="javascript:alert(1)">Read more</a>` }));
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /Unsafe article link/);
});

test('the rollback switch keeps newly received posts as drafts', () => {
  const previous = process.env.BLOG_AUTO_PUBLISH_ENABLED;
  process.env.BLOG_AUTO_PUBLISH_ENABLED = 'false';
  try {
    assert.equal(transformToPayloadPost(article())._status, 'draft');
  } finally {
    if (previous === undefined) delete process.env.BLOG_AUTO_PUBLISH_ENABLED;
    else process.env.BLOG_AUTO_PUBLISH_ENABLED = previous;
  }
});
