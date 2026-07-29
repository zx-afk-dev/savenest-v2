import { Fragment } from 'react';

/**
 * Renders `**bold**` segments as <strong>, leaving everything else as plain
 * text. The AI replies from the upstream chat API commonly use markdown
 * bold (see the sample responses) — this is enough to make those readable
 * without pulling in a full markdown parser for a support-chat bubble.
 */
export function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
