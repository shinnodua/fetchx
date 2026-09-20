import { describe, expect, test } from 'bun:test';
import { workspaceChangeTextClassNames } from '../../workspaceChangeStatusClassNames';
import { collectionRequestRowClassName } from '../CollectionItemView';

describe('CollectionItemView', () => {
  test('uses compact request rows in the collection sidebar', () => {
    expect(collectionRequestRowClassName).toContain('gap-1.5');
    expect(collectionRequestRowClassName).toContain('px-1.5');
    expect(collectionRequestRowClassName).toContain('py-0.5');
    expect(collectionRequestRowClassName).toContain('rounded-lg');
    expect(collectionRequestRowClassName).not.toContain('py-1');
  });

  test('uses semantic green and yellow text for GitHub change states', () => {
    expect(workspaceChangeTextClassNames.added).toContain('text-status-added');
    expect(workspaceChangeTextClassNames.modified).toContain(
      'text-status-modified',
    );
  });
});
