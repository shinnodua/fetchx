import type React from 'react';
import { useState } from 'react';
import {
  Button,
  Dialog,
  Input,
  Select,
  Textarea,
  useToast,
} from '../../../../../components';
import { fetchContractInfo } from '../../../../../services/api';
import { useRpcStore, useWorkspaceStore } from '../../../../../store';
import { METHOD_OPTIONS } from '../../../constants';
import type { RequestItem } from '../../../types';
import { parseRequestImportContent } from '../../../utils/requestImport';
import { getSelectedRpcId } from '../../../utils/rpcOptions';
import { RpcSelectField } from '../settings/RpcSelectField';
import { ManageRpcsDialog } from './ManageRpcsDialog';

export const WorkspaceDialogs: React.FC = () => {
  const {
    newColOpen,
    newColName,
    newReqOpen,
    importReqOpen,
    importContractOpen,
    targetColId,
    newReqName,
    newReqType,
    tabToClose,
    setNewColOpen,
    setNewColName,
    setNewReqOpen,
    setImportReqOpen,
    setImportContractOpen,
    setNewReqName,
    setNewReqType,
    setTabToClose,
    addCollection,
    addRequest,
    addCustomRequest,
    discardDraftChanges,
    closeTab,
  } = useWorkspaceStore();

  const { toast } = useToast();
  const customRpcs = useRpcStore((state) => state.customRpcs);
  const [importContent, setImportContent] = useState('');
  const [importError, setImportError] = useState('');

  const [contractAddress, setContractAddress] = useState('');
  const [contractNetwork, setContractNetwork] = useState('1');
  const [contractCustomRpcId, setContractCustomRpcId] = useState<
    string | undefined
  >(undefined);
  const [contractImportError, setContractImportError] = useState('');
  const [isImportLoading, setIsImportLoading] = useState(false);

  const closeImportDialog = () => {
    setImportReqOpen(false);
    setImportContent('');
    setImportError('');
  };

  const closeContractDialog = () => {
    setImportContractOpen(false);
    setContractAddress('');
    setContractNetwork('1');
    setContractCustomRpcId(undefined);
    setContractImportError('');
    setIsImportLoading(false);
  };

  const handleImportContractSubmit = async () => {
    const address = contractAddress.trim();
    if (!address) {
      setContractImportError('Please enter a contract address.');
      return;
    }

    if (!address.startsWith('0x') || address.length !== 42) {
      setContractImportError('Please enter a valid Ethereum address (0x...).');
      return;
    }

    setIsImportLoading(true);
    setContractImportError('');

    try {
      const info = await fetchContractInfo(address, contractNetwork);

      addCustomRequest({
        name: info.name,
        type: 'READ',
        target: info.address,
        network: info.network,
        customRpcId: contractCustomRpcId,
        abi: info.abi,
        functionName: '',
        args: {},
        contractName: info.name,
      });

      if (!info.abi) {
        toast({
          title: 'Unverified ABI',
          description:
            'Contract imported but ABI is unverified. You can paste it manually in Request Settings.',
          type: 'warning',
        });
      } else {
        toast({
          title: 'Contract Imported',
          description: `Contract "${info.name}" imported with ABI successfully.`,
          type: 'success',
        });
      }

      closeContractDialog();
    } catch (err) {
      const error = err as Error;
      setContractImportError(error.message || 'Failed to import contract.');
    } finally {
      setIsImportLoading(false);
    }
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
              dropdownClassName="max-h-none overflow-visible"
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
            variant="outline"
            onClick={() => {
              if (tabToClose) {
                discardDraftChanges(tabToClose);
                setTabToClose(null);
              }
            }}
          >
            Discard
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

      <Dialog
        isOpen={importContractOpen}
        onClose={closeContractDialog}
        title="Import Contract/Program"
        description="Fetch contract info and ABI directly from block explorer by entering its address and network."
      >
        <div className="py-4 space-y-4">
          <Input
            label="Contract Address"
            placeholder="0x..."
            value={contractAddress}
            onChange={(event) => {
              setContractAddress(event.target.value);
              setContractImportError('');
            }}
            disabled={isImportLoading}
          />
          <div>
            <label className="text-sm font-medium text-foreground/80 ml-1 mb-1.5 block">
              RPC
            </label>
            <RpcSelectField
              value={getSelectedRpcId(
                { network: contractNetwork, customRpcId: contractCustomRpcId },
                customRpcs,
              )}
              onChange={(fields) => {
                setContractNetwork(fields.network);
                setContractCustomRpcId(fields.customRpcId);
              }}
              disabled={isImportLoading}
            />
          </div>
          {contractImportError && (
            <span className="text-xs text-primary-600 ml-1 font-medium block">
              {contractImportError}
            </span>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={closeContractDialog}
            disabled={isImportLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImportContractSubmit}
            isLoading={isImportLoading}
          >
            Import
          </Button>
        </div>
      </Dialog>
      <ManageRpcsDialog />
    </>
  );
};
