/**
 * Normalize AI-generated markdown before rendering or persistence.
 */
export function normalizeMarkdownInput(markdown: string): string {
  if (!markdown) return "";

  let text = markdown.trim();

  if (text.includes("\\n")) {
    text = text.replace(/\\n/g, "\n");
  }
  text = text.replace(/\\t/g, "\t");
  text = text.replace(/\\([#*_`[\]()>-])/g, "$1");

  const fenceMatch = text.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/i);
  if (fenceMatch) {
    text = fenceMatch[1]!.trim();
  }

  text = dedentMarkdown(text);
  text = insertBlockNewlines(text);

  return text.trim();
}

function dedentMarkdown(text: string): string {
  const lines = text.split("\n");
  const contentLines = lines.filter((line) => line.trim().length > 0);
  if (contentLines.length === 0) return text;

  const indents = contentLines
    .map((line) => {
      const match = line.match(/^(\s*)/);
      return match ? match[1]!.length : 0;
    })
    .filter((n) => n > 0);

  if (indents.length === 0) return text;

  const minIndent = Math.min(...indents);
  if (minIndent < 2) return text;

  return lines
    .map((line) => (line.length >= minIndent ? line.slice(minIndent) : line))
    .join("\n");
}

function insertBlockNewlines(text: string): string {
  let result = text;

  result = result.replace(/([.!?])\s*(#{2,6}\s)/g, "$1\n\n$2");
  result = result.replace(/(\S)\s+(#{2,6}\s)/g, "$1\n\n$2");
  result = result.replace(/([.!?])\s+(-\s)/g, "$1\n\n$2");
  result = result.replace(/(\S)\s+(-\s)/g, "$1\n\n$2");
  result = result.replace(/(\S)\s+(>\s)/g, "$1\n\n$2");
  result = result.replace(/([.!?])\s+(\d+\.\s)/g, "$1\n\n$2");
  result = result.replace(/(\S)\s+(\d+\.\s)/g, "$1\n\n$2");

  return result;
}
