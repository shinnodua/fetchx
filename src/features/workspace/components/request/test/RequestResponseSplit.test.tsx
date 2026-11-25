import { describe, expect, test } from 'bun:test';

describe('RequestResponseSplit', () => {
  test('server rendering preserves panels and supplies named keyboard controls without browser globals', () => {
    // Other store tests install a partial window; isolate genuine SSR from that fixture.
    const modulePath = new URL('../RequestResponseSplit.tsx', import.meta.url)
      .pathname;
    const result = Bun.spawnSync([
      process.execPath,
      '--eval',
      `import { createElement } from 'react';
       import { renderToStaticMarkup } from 'react-dom/server';
       import { RequestResponseSplit } from ${JSON.stringify(modulePath)};
       console.log(renderToStaticMarkup(createElement(RequestResponseSplit, {
         request: createElement('div', null, 'unsaved request'),
         response: createElement('div', null, 'response payload'),
       })));`,
    ]);
    expect(new TextDecoder().decode(result.stderr)).toBe('');
    expect(result.exitCode).toBe(0);
    const markup = new TextDecoder().decode(result.stdout);
    expect(markup).toContain('unsaved request');
    expect(markup).toContain('response payload');
    expect(markup.indexOf('unsaved request')).toBeLessThan(
      markup.indexOf('response payload'),
    );
    expect(markup).toContain('aria-label="Request settings"');
    expect(markup).toContain('role="separator"');
    expect(markup).toContain('aria-orientation="vertical"');
    expect(markup).toContain('aria-label="Request and response panel widths"');
    expect(markup).toContain('aria-valuetext="Request 50%, response 50%"');
    expect(markup).toContain('tabindex="-1"');
    expect(markup).toContain('Reset panel widths');
    expect(markup).toContain('Press Enter');
    expect(markup).toContain('grid-template-columns:minmax(0, 1fr)');
  });
});
