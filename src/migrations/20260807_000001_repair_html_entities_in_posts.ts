import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

function decodeHtmlEntities(value: string): string {
  if (typeof value !== 'string' || !value.includes('&')) return value || ''

  return value
    .replace(/&nbsp;/gi, '\u00A0')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16)
      return Number.isFinite(code) ? String.fromCodePoint(code) : _
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec)
      return Number.isFinite(code) ? String.fromCodePoint(code) : _
    })
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
}

function repairLexicalHtmlEntities(node: unknown): unknown {
  if (node == null) return node
  if (Array.isArray(node)) return node.map(repairLexicalHtmlEntities)
  if (typeof node !== 'object') return node

  const current = node as Record<string, unknown>
  const next: Record<string, unknown> = { ...current }

  if (next.type === 'text' && typeof next.text === 'string') {
    next.text = decodeHtmlEntities(next.text)
  }

  if (Array.isArray(next.children)) {
    next.children = repairLexicalHtmlEntities(next.children)
  }

  return next
}

function looksEncoded(value: unknown): boolean {
  if (typeof value === 'string') {
    return /&#?\w+;|&quot;|&apos;|&amp;|&lt;|&gt;|&nbsp;/i.test(value)
  }
  if (!value || typeof value !== 'object') return false
  return /&#?\w+;|&quot;|&apos;|&amp;|&lt;|&gt;|&nbsp;/i.test(JSON.stringify(value))
}

/**
 * Repair webhook posts where HTML entities were stored literally in Lexical
 * text nodes (e.g. &#39; and &quot; from Outrank content_html).
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const limit = 25
  let page = 1

  for (;;) {
    const result = await payload.find({
      collection: 'cms-posts',
      depth: 0,
      draft: true,
      limit,
      overrideAccess: true,
      page,
    })

    for (const doc of result.docs) {
      const data: Record<string, unknown> = {}

      if (looksEncoded(doc.content)) {
        data.content = repairLexicalHtmlEntities(doc.content)
      }
      if (typeof doc.title === 'string' && looksEncoded(doc.title)) {
        data.title = decodeHtmlEntities(doc.title)
      }
      if (typeof doc.excerpt === 'string' && looksEncoded(doc.excerpt)) {
        data.excerpt = decodeHtmlEntities(doc.excerpt)
      }
      if (typeof doc.aiSummary === 'string' && looksEncoded(doc.aiSummary)) {
        data.aiSummary = decodeHtmlEntities(doc.aiSummary)
      }
      if (doc.seo && typeof doc.seo === 'object') {
        const seo = { ...(doc.seo as Record<string, unknown>) }
        let seoChanged = false
        if (typeof seo.title === 'string' && looksEncoded(seo.title)) {
          seo.title = decodeHtmlEntities(seo.title)
          seoChanged = true
        }
        if (typeof seo.description === 'string' && looksEncoded(seo.description)) {
          seo.description = decodeHtmlEntities(seo.description)
          seoChanged = true
        }
        if (seoChanged) data.seo = seo
      }

      if (Object.keys(data).length === 0) continue

      await payload.update({
        collection: 'cms-posts',
        id: doc.id,
        data,
        draft: doc._status !== 'published',
        overrideAccess: true,
      })
    }

    if (!result.hasNextPage) break
    page += 1
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql``)
}
