import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkStringify from 'remark-stringify';

const processor = unified()
  .use(rehypeParse)
  .use(rehypeRemark)
  .use(remarkStringify, { fences: true, bullet: '-', listItemIndent: 'one' });

export function estimateTokens(text) {
  return Math.max(0, Math.ceil(text.length / 4));
}

function contentOf(tag) {
  const match = /content=["']([^"']*)["']/i.exec(tag);
  const value = match?.[1]?.trim();
  return value ? value : undefined;
}

function metaByName(html, name) {
  const tag = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*>`, 'i').exec(
    html
  )?.[0];
  return tag ? contentOf(tag) : undefined;
}

function metaByProperty(html, property) {
  const tag = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]*>`,
    'i'
  ).exec(html)?.[0];
  return tag ? contentOf(tag) : undefined;
}

export function extractMeta(html) {
  const title = metaByName(html, 'title') ?? metaByProperty(html, 'og:title');
  const description =
    metaByName(html, 'description') ?? metaByProperty(html, 'og:description');
  const image = metaByProperty(html, 'og:image');

  return { title, description, image };
}

function yamlScalar(value) {
  const scalar = String(value).replace(/\r?\n/g, ' ').trim();
  if (scalar === '' || /[:#[\]{}&*!|>'"]/i.test(scalar)) {
    return JSON.stringify(scalar);
  }
  return scalar;
}

export function buildFrontmatter(meta) {
  const { title, description, image } = meta;
  if (!title && !description && !image) {
    return '';
  }

  const lines = ['---'];
  if (title) lines.push(`title: ${yamlScalar(title)}`);
  if (description) lines.push(`description: ${yamlScalar(description)}`);
  if (image) lines.push(`image: ${yamlScalar(image)}`);
  lines.push('---', '');

  return `${lines.join('\n')}\n`;
}

export async function htmlToMarkdown(html) {
  const file = await processor.process(html);
  return String(file);
}

export async function convertToMarkdown(html) {
  const body = await htmlToMarkdown(html);
  const frontmatter = buildFrontmatter(extractMeta(html));
  const markdown = frontmatter ? `${frontmatter}\n${body}` : body;
  return { markdown, frontmatter };
}
