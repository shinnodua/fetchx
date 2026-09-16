import { describe, expect, test } from 'bun:test';
import type { StateCreator } from 'zustand';

import { createDraftActions } from '../draftActions';
import type { WorkspaceState } from '../workspaceStoreTypes';
import { createRequest } from '../workspaceStoreUtils';

type WorkspaceSet = Parameters<StateCreator<WorkspaceState>>[0];
type WorkspaceGet = Parameters<StateCreator<WorkspaceState>>[1];

const createTestWorkspaceState = (): WorkspaceState => ({
  collections: [],
  tabs: [],
  activeTabId: '',
  searchTerm: '',
  newColOpen: false,
  newColName: '',
  newReqOpen: false,
  importReqOpen: false,
  importContractOpen: false,
  targetColId: '',
  newReqName: '',
  newReqType: 'GET',
  tabToClose: null,
  drafts: {},
  collapsedCollectionIds: [],
  collectionsPanelWidth: 320,
  collectionsPanelCollapsed: false,
  requestToRevealId: null,
  abiLoading: false,
  setSearchTerm: () => {},
  setCollections: () => {},
  setNewColOpen: () => {},
  setNewColName: () => {},
  setNewReqOpen: () => {},
  setImportReqOpen: () => {},
  setImportContractOpen: () => {},
  setTargetColId: () => {},
  setNewReqName: () => {},
  setNewReqType: () => {},
  toggleCollectionCollapsed: () => {},
  setCollectionsPanelWidth: () => {},
  setCollectionsPanelCollapsed: () => {},
  setRequestToRevealId: () => {},
  addCollection: () => {},
  renameCollection: () => {},
  duplicateCollection: () => {},
  deleteCollection: () => {},
  importCollections: () => {},
  addRequest: () => {},
  addCustomRequest: () => {},
  renameRequest: () => {},
  duplicateRequest: () => {},
  deleteRequest: () => {},
  openTab: () => {},
  closeTab: () => {},
  closeTabs: () => {},
  reorderTabs: () => {},
  revealRequestInSidebar: () => {},
  setActiveTabId: () => {},
  updateActiveRequest: () => {},
  addLog: () => {},
  saveActiveResponse: () => false,
  toggleSavedResponsesCollapsed: () => {},
  deleteSavedResponse: () => {},
  saveDraft: () => {},
  discardDraft: () => {},
  discardDraftChanges: () => {},
  addNewTab: () => {},
  initializeDraft: () => {},
  setTabToClose: () => {},
  setAbiLoading: () => {},
});

describe('workspace draft actions', () => {
  test('keeps existing console logs when active response is replaced', () => {
    const request = createRequest('r-logs', 'Logs', 'GET', {
      response: {
        status: 'Pending',
        data: null,
        duration: 0,
        logs: ['[10:00:00] Sending request'],
      },
    });
    let state: WorkspaceState = {
      ...createTestWorkspaceState(),
      activeTabId: request.id,
      drafts: { [request.id]: request },
    };
    const set = ((partial) => {
      const nextState =
        typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...nextState };
    }) as WorkspaceSet;
    const get = (() => state) as WorkspaceGet;

    createDraftActions(set, get).updateActiveRequest({
      response: {
        status: '200 OK',
        data: { ok: true },
        duration: 30,
        logs: ['[10:00:01] Response received'],
      },
    });

    expect(state.drafts[request.id].response?.logs).toEqual([
      '[10:00:00] Sending request',
      '[10:00:01] Response received',
    ]);
  });

  test('moves a saved request into the selected collection', () => {
    const request = createRequest('r-1', 'Profile', 'GET');
    let state: WorkspaceState = {
      ...createTestWorkspaceState(),
      activeTabId: request.id,
      collections: [
        { id: 'source', name: 'Source', requests: [request] },
        { id: 'target', name: 'Target', requests: [] },
      ],
      drafts: {
        [request.id]: { ...request, target: 'https://api.example.com/profile' },
      },
    };
    const set = ((partial) => {
      const nextState =
        typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...nextState };
    }) as WorkspaceSet;
    const get = (() => state) as WorkspaceGet;

    createDraftActions(set, get).saveDraft(request.id, 'target');

    expect(state.collections[0].requests).toEqual([]);
    expect(state.collections[1].requests).toMatchObject([
      { id: request.id, target: 'https://api.example.com/profile' },
    ]);
  });
});
