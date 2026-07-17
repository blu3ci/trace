import { pdfDefaultSchemaMappings } from "@blocknote/xl-pdf-exporter";
import { Text } from "@react-pdf/renderer";

type DefaultParagraphMapping = typeof pdfDefaultSchemaMappings.blockMapping.paragraph;

/**
 * react-pdf collapses leading regular spaces. Convert only the initial spaces
 * in a text block to non-breaking spaces so a document's visible indentation
 * is retained in every PDF export.
 */
function preserveLeadingWhitespace<T>(content: T): T {
  if (!Array.isArray(content) || content.length === 0) return content;

  const first = content[0] as { type?: unknown; text?: unknown };
  if (first.type !== "text" || typeof first.text !== "string") return content;

  const text = first.text.replace(/^[ \t]+/, (whitespace) => (
    whitespace.replace(/ /g, "\u00a0").replace(/\t/g, "\u00a0\u00a0\u00a0\u00a0")
  ));

  if (text === first.text) return content;

  return [{ ...first, text }, ...content.slice(1)] as T;
}

export const documentPdfSchemaMappings = {
  ...pdfDefaultSchemaMappings,
  blockMapping: {
    ...pdfDefaultSchemaMappings.blockMapping,
    paragraph: ((block, exporter) => (
      <Text key={`paragraph${block.id}`}>
        {exporter.transformInlineContent(preserveLeadingWhitespace(block.content))}
      </Text>
    )) satisfies DefaultParagraphMapping,
  },
};
