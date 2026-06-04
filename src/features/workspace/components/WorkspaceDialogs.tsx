import type React from 'react';
import { useState } from 'react';
import { Button, Dialog, Input, Select, Textarea } from '../../../components';
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';
import { METHOD_OPTIONS } from '../constants';
import type { RequestItem } from '../types';
import { parseRequestImportContent } from '../utils/requestImport';

export const WorkspaceDialogs: React.FC = () => {
  const {
    newColOpen,
    newColName,
    newReqOpen,
    importReqOpen,
    targetColId,
    newReqName,
    newReqType,
    tabToClose,
    setNewColOpen,
    setNewColName,
    setNewReqOpen,
    setImportReqOpen,
    setNewReqName,
    setNewReqType,
    setTabToClose,
    addCollection,
    addRequest,
    addCustomRequest,
    closeTab,
  } = useWorkspaceStore();

  const [importContent, setImportContent] = useState('');
  const [importError, setImportError] = useState('');

  const closeImportDialog = () => {
    setImportReqOpen(false);
    setImportContent('');
    setImportError('');
  };

  const handleImportRequestSubmit = () => {
    const content = importContent.trim();
    if (!content) {
      setImportError('Please enter some JSON or a curl command.');
      return;
    }

    let requestDetails: Partial<RequestItem>;
    try {
      requestDetails = parseRequestImportContent(content);
    } catch (err) {
      const error = err as Error;
      setImportError(
        content.toLowerCase().startsWith('curl')
          ? `Failed to parse curl command: ${error.message}`
          : `Invalid JSON format: ${error.message}`,
      );
      return;
    }

    addCustomRequest(requestDetails);
    closeImportDialog();
  };

  return (
    <>
      <Dialog
        isOpen={newColOpen}
        onClose={() => setNewColOpen(false)}
        title="Create Collection"
        description="Provide a descriptive name to group your contract and API requests."
      >
        <div className="py-4 space-y-4">
          <Input
            label="Collection Name"
            placeholder="e.g. My Smart Contracts"
            value={newColName}
            onChange={(event) => setNewColName(event.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => setNewColOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => addCollection(newColName)}>
            Create
          </Button>
        </div>
      </Dialog>

      <Dialog
        isOpen={newReqOpen}
        onClose={() => setNewReqOpen(false)}
        title="Add Request"
        description="Add a new contract interaction or REST endpoint to this collection."
      >
        <div className="py-4 space-y-4">
          <Input
            label="Request Name"
            placeholder="e.g. Query Token Decimals"
            value={newReqName}
            onChange={(event) => setNewReqName(event.target.value)}
          />
          <div>
            <label className="text-sm font-medium text-foreground/80 ml-1 mb-1.5 block">
              Call Type
            </label>
            <Select
              options={METHOD_OPTIONS}
              value={newReqType}
              onChange={setNewReqType}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => setNewReqOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => addRequest(targetColId, newReqName, newReqType)}
          >
            Add Request
          </Button>
        </div>
      </Dialog>

      <Dialog
        isOpen={importReqOpen}
        onClose={closeImportDialog}
        title="Import Request"
        description="Paste a curl command or a JSON request configuration to import it."
      >
        <div className="py-4 space-y-4">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-foreground/80 ml-1">
              Request Payload (JSON or cURL)
            </label>
            <Textarea
              placeholder={`Paste curl or JSON here...\n\nExample JSON:\n{\n  "name": "My API",\n  "type": "GET",\n  "target": "https://api.github.com"\n}`}
              value={importContent}
              onChange={(event) => {
                setImportContent(event.target.value);
                setImportError('');
              }}
              rows={8}
            />
            {importError && (
              <span className="text-xs text-primary-600 ml-1 font-medium">
                {importError}
              </span>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={closeImportDialog}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleImportRequestSubmit}>
            Import
          </Button>
        </div>
      </Dialog>

      <Dialog
        isOpen={!!tabToClose}
        onClose={() => setTabToClose(null)}
        title="Discard Changes?"
        description="This tab contains unsaved changes. Closing it will discard them forever."
      >
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => setTabToClose(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (tabToClose) {
                closeTab(tabToClose);
                setTabToClose(null);
              }
            }}
          >
            Discard & Close
          </Button>
        </div>
      </Dialog>
    </>
  );
};
