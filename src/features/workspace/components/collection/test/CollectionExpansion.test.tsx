import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { CollectionExpansion } from '../CollectionExpansion';

describe('CollectionExpansion', () => {
  test('keeps collapsed content mounted for animation but hidden and inert', () => {
    const html = renderToStaticMarkup(
      <CollectionExpansion expanded={false}>
        Request content
      </CollectionExpansion>,
    );
    expect(html).toContain('Request content');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('inert=""');
    expect(html).toContain('grid-rows-[0fr]');
    expect(html).toContain('overflow-hidden');
  });

  test('makes expanded content visible and interactive', () => {
    const html = renderToStaticMarkup(
      <CollectionExpansion expanded>Request content</CollectionExpansion>,
    );
    expect(html).toContain('aria-hidden="false"');
    expect(html).not.toContain('inert=');
    expect(html).toContain('grid-rows-[1fr]');
    expect(html).toContain('transition-[grid-template-rows,opacity]');
    expect(html).toContain('motion-reduce:transition-none');
  });
});
