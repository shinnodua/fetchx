import type React from 'react';
import { useRef, useState } from 'react';
import { Button } from '../../../../components/ui/Button';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { Dialog } from '../../../../components/ui/Dialog';
import { useToast } from '../../../../components/ui/Toast';
import { useWorkspaceStore } from '../../../../store';
import type { CollectionItem } from '../../types';
import {
  createCollectionsExportPayload,
  parseCollectionsImportPayload,
} from '../../utils/collectionTransfer';

export const CollectionTransferButtons: React.FC = () => {
  const { toast } = useToast();
  const { collections, importCollections } = useWorkspaceStore();
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const [exportOpen, setExportOpen] = useState(false);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    [],
  );

  const [importOpen, setImportOpen] = useState(false);
  const [pendingCollections, setPendingCollections] = useState<
    CollectionItem[]
  >([]);
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);

  const openExportDialog = () => {
    setSelectedCollectionIds(collections.map((collection) => collection.id));
    setExportOpen(true);
  };

  const toggleExportCollection = (collectionId: string) => {
    setSelectedCollectionIds((currentIds) =>
      currentIds.includes(collectionId)
        ? currentIds.filter((id) => id !== collectionId)
        : [...currentIds, collectionId],
    );
  };

  const handleExportCollections = () => {
    const selectedCollections = collections.filter((collection) =>
      selectedCollectionIds.includes(collection.id),
    );
    if (selectedCollections.length === 0) return;

    const payload = createCollectionsExportPayload(selectedCollections);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `call3-collections-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const handleImportFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const importedCollections = parseCollectionsImportPayload(
        await file.text(),
      );
      if (importedCollections.length === 0) {
        toast({
          title: 'Import warning',
          description: 'No collections found in the selected file.',
          type: 'error',
        });
        return;
      }
      setPendingCollections(importedCollections);
      setSelectedImportIds(importedCollections.map((col) => col.id));
      setImportOpen(true);
    } catch (error) {
      toast({
        title: 'Import failed',
        description:
          error instanceof Error
            ? error.message
            : 'The selected file could not be imported.',
        type: 'error',
      });
    }
  };

  const toggleImportCollection = (collectionId: string) => {
    setSelectedImportIds((currentIds) =>
      currentIds.includes(collectionId)
        ? currentIds.filter((id) => id !== collectionId)
        : [...currentIds, collectionId],
    );
  };

  const handleConfirmImport = () => {
    const filteredCollections = pendingCollections.filter((collection) =>
      selectedImportIds.includes(collection.id),
    );
    if (filteredCollections.length === 0) return;

    importCollections(filteredCollections);
    toast({
      title: 'Collections imported',
      description: `${filteredCollections.length} collection${
        filteredCollections.length === 1 ? '' : 's'
      } added to the sidebar.`,
      type: 'success',
    });
    setImportOpen(false);
    setPendingCollections([]);
    setSelectedImportIds([]);
  };

  return (
    <>
      <div className="flex items-center gap-2 sm:ml-4 ml-1">
        <Button
          variant="glass"
          size="sm"
          className="h-8 rounded-lg px-3 text-xs"
          onClick={openExportDialog}
          disabled={collections.length === 0}
        >
          Export
        </Button>
        <Button
          variant="glass"
          size="sm"
          className="h-8 rounded-lg px-3 text-xs"
          onClick={() => importFileInputRef.current?.click()}
        >
          Import
        </Button>
        <input
          ref={importFileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportFileChange}
        />
      </div>

      <Dialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Collections"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setSelectedCollectionIds(
                  collections.map((collection) => collection.id),
                )
              }
              className="cursor-pointer"
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCollectionIds([])}
              className="cursor-pointer"
            >
              Clear
            </Button>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-foreground/10 p-3">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-foreground/5"
              >
                <Checkbox
                  checked={selectedCollectionIds.includes(collection.id)}
                  onChange={() => toggleExportCollection(collection.id)}
                  label={collection.name}
                />
                <span className="shrink-0 text-xs text-foreground/45">
                  {collection.requests.length} req
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setExportOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExportCollections}
              disabled={selectedCollectionIds.length === 0}
              className="cursor-pointer"
            >
              Export
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={importOpen}
        onClose={() => {
          setImportOpen(false);
          setPendingCollections([]);
          setSelectedImportIds([]);
        }}
        title="Import Collections"
        description="Select the collections you want to import into your workspace."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setSelectedImportIds(
                  pendingCollections.map((collection) => collection.id),
                )
              }
              className="cursor-pointer"
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedImportIds([])}
              className="cursor-pointer"
            >
              Clear
            </Button>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-foreground/10 p-3">
            {pendingCollections.map((collection) => (
              <div
                key={collection.id}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-foreground/5"
              >
                <Checkbox
                  checked={selectedImportIds.includes(collection.id)}
                  onChange={() => toggleImportCollection(collection.id)}
                  label={collection.name}
                />
                <span className="shrink-0 text-xs text-foreground/45">
                  {collection.requests.length} req
                  {collection.requests.length === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setImportOpen(false);
                setPendingCollections([]);
                setSelectedImportIds([]);
              }}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmImport}
              disabled={selectedImportIds.length === 0}
              className="cursor-pointer"
            >
              Import
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};
