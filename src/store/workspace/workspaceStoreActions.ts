import type { StateCreator } from 'zustand';
import { createCollectionActions } from './collectionActions';
import { createDraftActions } from './draftActions';
import { createRequestActions } from './requestActions';
import { createResponseActions } from './responseActions';
import { createSetterActions } from './setterActions';
import { createTabActions } from './tabActions';
import type { WorkspaceState } from './workspaceStoreTypes';

type WorkspaceSet = Parameters<StateCreator<WorkspaceState>>[0];
type WorkspaceGet = Parameters<StateCreator<WorkspaceState>>[1];

export const createWorkspaceActions = (
  set: WorkspaceSet,
  get: WorkspaceGet,
) => ({
  ...createSetterActions(set, get),
  ...createCollectionActions(set, get),
  ...createRequestActions(set, get),
  ...createTabActions(set, get),
  ...createResponseActions(set, get),
  ...createDraftActions(set, get),
});
