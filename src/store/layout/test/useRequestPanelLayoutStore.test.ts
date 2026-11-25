import { describe, expect, test } from 'bun:test';
import { startRequestPanelDrag } from '../../../features/workspace/hooks/requestPanelDrag';
import { copyAsCurlBash } from '../../../features/workspace/utils/requestExport';
import {
  getRequestPanelKeyboardRatio,
  getRequestPanelLayout,
} from '../../../features/workspace/utils/requestPanelLayout';
import {
  getCollectionsDigest,
  serializeCollectionForRepository,
} from '../../../features/workspace/utils/workspaceRepositoryFormat';
import { useWorkspaceStore } from '../../workspace/useWorkspaceStore';
import { createRequestPanelLayoutStore } from '../useRequestPanelLayoutStore';

describe('request layout isolation', () => {
  test('drag commit, keyboard adjustment and reset leave request/export/sync state untouched', () => {
    const state = useWorkspaceStore.getState();
    const exports = () =>
      state.collections.map(serializeCollectionForRepository);
    const requestExports = () =>
      state.collections.flatMap((col) => col.requests.map(copyAsCurlBash));
    const before = {
      exports: exports(),
      requestExports: requestExports(),
      digest: getCollectionsDigest(state.collections),
      drafts: JSON.stringify(state.drafts),
      workspaces: JSON.stringify(state.workspaces),
    };
    let writes = 0;
    const store = createRequestPanelLayoutStore(() => ({
      getItem: () => null,
      setItem: () => {
        writes += 1;
      },
    }));
    class Target extends EventTarget {
      setPointerCapture() {}
      hasPointerCapture() {
        return true;
      }
      releasePointerCapture() {}
    }
    const events = new EventTarget();
    startRequestPanelDrag({
      pointerId: 1,
      startX: 0,
      layout: getRequestPanelLayout(1224, 1400, 0.5),
      target: new Target(),
      events,
      style: { cursor: '', userSelect: '' },
      onPreview: () => {},
      onCommit: store.getState().setPreferredRatio,
      onFinish: () => {},
    });
    events.dispatchEvent(
      Object.assign(new Event('pointermove'), { pointerId: 1, clientX: 120 }),
    );
    expect(writes).toBe(0);
    events.dispatchEvent(
      Object.assign(new Event('pointerup'), { pointerId: 1, clientX: 120 }),
    );
    expect(store.getState().preferredRatio).toBe(0.6);
    const keyboard = getRequestPanelKeyboardRatio(
      { key: 'ArrowRight' },
      getRequestPanelLayout(1224, 1400, store.getState().preferredRatio),
    );
    expect(keyboard).not.toBeNull();
    if (keyboard !== null) store.getState().setPreferredRatio(keyboard);
    store.getState().setPreferredRatio(0.5);
    expect(writes).toBe(3);
    expect(useWorkspaceStore.getState()).toBe(state);
    expect({
      exports: exports(),
      requestExports: requestExports(),
      digest: getCollectionsDigest(state.collections),
      drafts: JSON.stringify(state.drafts),
      workspaces: JSON.stringify(state.workspaces),
    }).toEqual(before);
  });
});
