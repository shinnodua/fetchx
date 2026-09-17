import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Textarea,
  useToast,
} from '../../../../../components';
import { trackEvent } from '../../../../../services/analytics/googleAnalytics';
import {
  decodeContractBytecodeAbi,
  fetchContractInfo,
  isFetchxApiConfigured,
} from '../../../../../services/api';
import { useAbiStore, useWorkspaceStore } from '../../../../../store';
import { ERC20_ABI, ERC721_ABI, ERC1155_ABI } from '../../../constants';
import type { RequestItem } from '../../../types';
import {
  formatContractAbi,
  isContractBytecode,
} from '../../../utils/contractAbi';
import { ManageAbisDialog } from '../dialogs/ManageAbisDialog';
import { SaveAbiDialog } from '../dialogs/SaveAbiDialog';

interface ContractAbiFormProps {
  activeRequest: RequestItem;
}

export const ContractAbiForm: React.FC<ContractAbiFormProps> = ({
  activeRequest,
}) => {
  const { toast } = useToast();
  const { updateActiveRequest, abiLoading, setAbiLoading } =
    useWorkspaceStore();
  const { savedAbis, saveAbi, setManageAbiOpen } = useAbiStore();
  const [isSaveAbiOpen, setIsSaveAbiOpen] = useState(false);
  const [savedAbiName, setSavedAbiName] = useState('');
  const decodingBytecodeKeysRef = useRef(new Set<string>());

  const formattedActiveAbi = useMemo(
    () => formatContractAbi(activeRequest.abi || ''),
    [activeRequest.abi],
  );

  const loadPresetAbi = (preset: 'ERC20' | 'ERC721' | 'ERC1155') => {
    const selectedAbi =
      preset === 'ERC20'
        ? ERC20_ABI
        : preset === 'ERC721'
          ? ERC721_ABI
          : ERC1155_ABI;
    updateActiveRequest({
      abi: JSON.stringify(selectedAbi, null, 2),
      functionName: '',
      args: {},
      contractName: `${preset} Preset`,
    });
    toast({
      title: 'ABI Preset Loaded',
      description: `Loaded standard ${preset} interface.`,
      type: 'success',
    });
    trackEvent({ screen: 'workspace', action: 'load_preset_abi', preset });
  };

  const loadSavedAbi = (abi: string, name: string) => {
    updateActiveRequest({
      abi,
      functionName: '',
      args: {},
      contractName: name,
    });
    toast({
      title: 'Saved ABI Loaded',
      description: `Loaded "${name}" successfully.`,
      type: 'success',
    });
  };

  const openSaveAbiDialog = () => {
    if (!formattedActiveAbi) return;

    const contractName = activeRequest.contractName;
    const defaultName =
      contractName ||
      (activeRequest.name !== 'Untitled Request' ? activeRequest.name : '') ||
      activeRequest.target.trim() ||
      'Custom ABI';
    setSavedAbiName(defaultName);
    setIsSaveAbiOpen(true);
  };

  const handleSaveAbi = () => {
    const name = savedAbiName.trim();
    if (!name || !formattedActiveAbi) return;

    const isUpdate = savedAbis.some(
      (savedAbi) => savedAbi.name.toLowerCase() === name.toLowerCase(),
    );
    saveAbi(name, formattedActiveAbi);
    setIsSaveAbiOpen(false);
    toast({
      title: isUpdate ? 'ABI Preset Updated' : 'ABI Preset Saved',
      description: `"${name}" is available under Load Preset ABI.`,
      type: 'success',
    });
  };

  const loadContractAbi = async () => {
    const address = activeRequest.target.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      toast({
        title: 'Invalid Contract Address',
        description: 'Enter a valid contract address before loading its ABI.',
        type: 'error',
      });
      return;
    }

    setAbiLoading(true);
    try {
      const info = await fetchContractInfo(
        address,
        activeRequest.network || '1',
      );
      updateActiveRequest({
        abi: info.abi,
        functionName: '',
        args: {},
        contractName: info.name,
      });
      toast({
        title: 'ABI Loaded',
        description: `Loaded ABI for "${info.name}" successfully.`,
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'ABI Load Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Could not load the contract ABI.',
        type: 'error',
      });
    } finally {
      setAbiLoading(false);
    }
  };

  const updateContractAbi = (abi: string) => {
    updateActiveRequest({
      abi,
      functionName: '',
      args: {},
      ...(abi.trim() === '' ? { contractName: undefined } : {}),
    });
  };

  const tryDecodeBytecode = async (value: string) => {
    const bytecode = value.trim();
    if (!isContractBytecode(bytecode)) return;
    if (!isFetchxApiConfigured()) return;

    const address = activeRequest.target.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      toast({
        title: 'Contract Address Required',
        description:
          'Enter a valid contract address before decoding contract bytecode.',
        type: 'error',
      });
      return;
    }

    const requestId = activeRequest.id;
    const network = activeRequest.network || '1';
    const decodeKey = `${requestId}:${network}:${address}:${bytecode}`;
    if (decodingBytecodeKeysRef.current.has(decodeKey)) return;

    decodingBytecodeKeysRef.current.add(decodeKey);
    setAbiLoading(true);
    try {
      const decodedAbi = await decodeContractBytecodeAbi(
        bytecode,
        address,
        network,
      );
      const formattedAbi = formatContractAbi(decodedAbi);
      const workspaceState = useWorkspaceStore.getState();
      const currentAbi = workspaceState.drafts[requestId]?.abi?.trim();
      if (workspaceState.activeTabId !== requestId || currentAbi !== bytecode) {
        return;
      }

      if (!formattedAbi) {
        toast({
          title: 'ABI Decode Failed',
          description:
            'No contract functions could be inferred from this bytecode.',
          type: 'error',
        });
        return;
      }

      workspaceState.updateActiveRequest({
        abi: formattedAbi,
        functionName: '',
        args: {},
        contractName: 'Inferred ABI',
      });
      toast({
        title: 'Bytecode ABI Decoded',
        description: 'Loaded the ABI inferred from contract bytecode.',
        type: 'success',
      });
    } catch (error) {
      const workspaceState = useWorkspaceStore.getState();
      if (
        workspaceState.activeTabId === requestId &&
        workspaceState.drafts[requestId]?.abi?.trim() === bytecode
      ) {
        toast({
          title: 'ABI Decode Failed',
          description:
            error instanceof Error
              ? error.message
              : 'Could not decode the contract bytecode.',
          type: 'error',
        });
      }
    } finally {
      decodingBytecodeKeysRef.current.delete(decodeKey);
      setAbiLoading(false);
    }
  };

  const handleContractAbiPaste = (
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) => {
    const clipboardValue = event.clipboardData.getData('text');
    const formattedAbi = formatContractAbi(clipboardValue);
    if (formattedAbi) {
      event.preventDefault();
      updateContractAbi(formattedAbi);
      return;
    }

    if (isContractBytecode(clipboardValue)) {
      event.preventDefault();
      updateContractAbi(clipboardValue.trim());
      void tryDecodeBytecode(clipboardValue);
    }
  };

  const pasteContractAbi = async () => {
    try {
      const clipboardValue = await navigator.clipboard.readText();
      const formattedAbi = formatContractAbi(clipboardValue);
      if (formattedAbi) {
        updateContractAbi(formattedAbi);
        return;
      }

      if (isContractBytecode(clipboardValue)) {
        updateContractAbi(clipboardValue.trim());
        void tryDecodeBytecode(clipboardValue);
        return;
      }

      toast({
        title: 'Invalid Contract ABI',
        description:
          'Clipboard content does not contain a valid ABI or contract bytecode.',
        type: 'error',
      });
    } catch {
      toast({
        title: 'Clipboard Access Failed',
        description: 'Allow clipboard access, then try pasting again.',
        type: 'error',
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-xs font-semibold text-foreground/75">
          Contract ABI
        </label>
        <div className="flex items-center gap-1">
          {formattedActiveAbi && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px] text-secondary-600 hover:text-secondary-700 cursor-pointer"
              onClick={openSaveAbiDialog}
            >
              SAVE
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] text-secondary-600 hover:text-secondary-700 cursor-pointer"
            onClick={() => {
              trackEvent({ screen: 'workspace', action: 'load_abi' });
              void loadContractAbi();
            }}
            isLoading={abiLoading}
          >
            LOAD ABI
          </Button>
          <DropdownMenu
            align="right"
            className="w-56"
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px] text-primary-500 hover:text-primary-600 cursor-pointer"
              >
                LOAD PRESET ABI
              </Button>
            }
          >
            <DropdownMenuItem
              onClick={() => setManageAbiOpen(true)}
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              Manage ABI
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => loadPresetAbi('ERC20')}>
              ERC20 Preset
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => loadPresetAbi('ERC721')}>
              ERC721 Preset
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => loadPresetAbi('ERC1155')}>
              ERC1155 Preset
            </DropdownMenuItem>
            {savedAbis.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                  Saved ABIs
                </div>
                {savedAbis.map((savedAbi) => (
                  <DropdownMenuItem
                    key={savedAbi.id}
                    onClick={() => loadSavedAbi(savedAbi.abi, savedAbi.name)}
                    className="truncate"
                    title={savedAbi.name}
                  >
                    <span className="truncate">{savedAbi.name}</span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenu>
        </div>
      </div>
      {activeRequest.contractName && (
        <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-secondary-500/20 bg-secondary-500/5 px-2.5 py-1 text-xs text-secondary-700 dark:text-secondary-300">
          <span className="font-semibold text-foreground/50">Contract:</span>
          <span className="font-mono font-medium">
            {activeRequest.contractName}
          </span>
        </div>
      )}
      <div className="relative">
        <Textarea
          placeholder="Paste ABI JSON, contract bytecode, artifact, explorer response, or human-readable signatures"
          className="h-32 pt-10 font-mono text-xs"
          value={activeRequest.abi || ''}
          onPaste={handleContractAbiPaste}
          onChange={(event) => updateContractAbi(event.target.value)}
          onBlur={(event) => void tryDecodeBytecode(event.target.value)}
        />
        <div className="absolute right-2 top-2 z-40 flex items-center gap-1 rounded-lg bg-background/90 p-0.5 shadow-sm backdrop-blur-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 rounded-md !px-2 text-[10px]"
            onClick={pasteContractAbi}
          >
            Paste
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 rounded-md !px-2 text-[10px]"
            disabled={!activeRequest.abi}
            onClick={() => updateContractAbi('')}
          >
            Clear
          </Button>
        </div>
      </div>

      <SaveAbiDialog
        isOpen={isSaveAbiOpen}
        onClose={() => setIsSaveAbiOpen(false)}
        savedAbiName={savedAbiName}
        setSavedAbiName={setSavedAbiName}
        onSave={handleSaveAbi}
      />
      <ManageAbisDialog />
    </div>
  );
};
