import { describe, expect, test } from 'bun:test';
import { getRequestSaveTargetCollectionId } from '../requestSaveTarget';

const collections = [
  {
    id: 'one',
    name: 'One',
    requests: [
      {
        id: 'request-one',
        name: 'Duplicate name',
        type: 'GET',
        target: 'https://one.example.com',
      },
    ],
  },
  {
    id: 'two',
    name: 'Two',
    requests: [
      {
        id: 'request-two',
        name: 'Duplicate name',
        type: 'GET',
        target: 'https://two.example.com',
      },
    ],
  },
];

describe('request save target', () => {
  test('keeps an existing request in its collection even when another request has the same name', () => {
    expect(
      getRequestSaveTargetCollectionId('request-two', 'one', collections),
    ).toBe('two');
  });

  test('uses the selected collection only for a new request', () => {
    expect(
      getRequestSaveTargetCollectionId('r-new-request', 'one', collections),
    ).toBe('one');
  });
});
