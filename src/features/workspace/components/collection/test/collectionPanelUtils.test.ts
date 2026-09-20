import { describe, expect, test } from 'bun:test';
import {
  filterCollections,
  getContextMenuPosition,
} from '../collectionPanelUtils';

const collections = [
  {
    id: 'one',
    name: 'Authentication',
    requests: [
      {
        id: 'login',
        name: 'Log in',
        target: 'https://api.example.com/login',
        savedResponses: [{ id: 'response', name: 'Success' }],
      },
    ],
  },
] as never[];

describe('collectionPanelUtils', () => {
  test('keeps matching requests when filtering collections', () => {
    expect(filterCollections(collections, 'success')).toEqual([
      {
        ...collections[0],
        requests: [collections[0].requests[0]],
      },
    ]);
  });

  test('clamps the context menu inside the panel bounds', () => {
    expect(
      getContextMenuPosition({
        clientX: 400,
        clientY: 300,
        panelHeight: 200,
        panelLeft: 100,
        panelWidth: 320,
      }),
    ).toEqual({ x: 152, y: 56 });
  });
});
