const layoutTokens = new Set([
  'listItemPrefix',
  'listItemIndent',
  'linePrefix',
  'blockQuotePrefix',
  'lineEnding',
  'lineEndingBlank',
]);

export default {
  names: ['compact-simple-lists'],
  description: 'Keep single-paragraph list items adjacent',
  tags: ['blank_lines'],
  parser: 'micromark',
  function: (params, onError) => {
    const visit = (tokens) => {
      for (const token of tokens) {
        if (
          token.type === 'htmlFlow' ||
          token.type === 'codeFenced' ||
          token.type === 'codeIndented'
        )
          continue;
        if (token.type === 'listOrdered' || token.type === 'listUnordered') {
          const items = [];
          for (const child of token.children) {
            if (child.type === 'listItemPrefix') items.push({ prefix: child, blocks: [] });
            else if (!layoutTokens.has(child.type)) items.at(-1)?.blocks.push(child);
          }
          if (
            items.length > 1 &&
            items.every(
              ({ blocks }) =>
                blocks.length === 1 &&
                blocks[0].type === 'content' &&
                blocks[0].children.length === 1 &&
                blocks[0].children[0].type === 'paragraph',
            )
          ) {
            for (let index = 1; index < items.length; index++) {
              const previousEnd = items[index - 1].blocks[0].endLine;
              const nextStart = items[index].prefix.startLine;
              for (const blank of token.children.filter(
                ({ type, startLine }) =>
                  type === 'lineEndingBlank' && startLine > previousEnd && startLine < nextStart,
              ))
                onError({ lineNumber: blank.startLine, fixInfo: { deleteCount: -1 } });
            }
          }
        }
        visit(token.children);
      }
    };
    visit(params.parsers.micromark.tokens);
  },
};
