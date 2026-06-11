import type React from 'react';
import { useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Input,
  Textarea,
  useToast,
} from '../../../../../components';
import { fetchContractInfo } from '../../../../../services/api';
import { useAbiStore, useWorkspaceStore } from '../../../../../store';
import { ERC20_ABI, ERC721_ABI, ERC1155_ABI } from '../../../constants';
import type { RequestItem } from '../../../types';
import { formatContractAbi } from '../../../utils/contractAbi';
import { ManageAbisDialog } from '../dialogs/ManageAbisDialog';

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
  const [contractNamesByRequestId, setContractNamesByRequestId] = useState<
    Record<string, string>
  >({});

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
    });
    toast({
      title: 'ABI Preset Loaded',
      description: `Loaded standard ${preset} interface.`,
      type: 'success',
    });
  };

  const loadSavedAbi = (abi: string, name: string) => {
    updateActiveRequest({
      abi,
      functionName: '',
      args: {},
    });
    toast({
      title: 'Saved ABI Loaded',
      description: `Loaded "${name}" successfully.`,
      type: 'success',
    });
  };

  const openSaveAbiDialog = () => {
    if (!formattedActiveAbi) return;

    const contractName = contractNamesByRequestId[activeRequest.id];
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
      });
      setContractNamesByRequestId((currentNames) => ({
        ...currentNames,
        [activeRequest.id]: info.name,
      }));
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
    });
  };

  const handleContractAbiPaste = (
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) => {
    const clipboardValue = event.clipboardData.getData('text');
    const formattedAbi = formatContractAbi(clipboardValue);
    if (!formattedAbi) return;

    event.preventDefault();
    updateContractAbi(formattedAbi);
  };

  const pasteContractAbi = async () => {
    try {
      const clipboardValue = await navigator.clipboard.readText();
      const formattedAbi = formatContractAbi(clipboardValue);
      if (!formattedAbi) {
        toast({
          title: 'Invalid Contract ABI',
          description: 'Clipboard content does not contain a valid ABI.',
          type: 'error',
        });
        return;
      }

      updateContractAbi(formattedAbi);
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
            onClick={loadContractAbi}
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
            <DropdownMenuItem onClick={() => setManageAbiOpen(true)}>
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
      <div className="relative">
        <Textarea
          placeholder="Paste ABI JSON, artifact, explorer response, or human-readable signatures"
          className="h-32 pt-10 font-mono text-xs"
          value={activeRequest.abi || ''}
          onPaste={handleContractAbiPaste}
          onChange={(event) => updateContractAbi(event.target.value)}
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

      <Dialog
        isOpen={isSaveAbiOpen}
        onClose={() => setIsSaveAbiOpen(false)}
        title="Save Contract ABI"
        description="Choose a name for this ABI preset. Saving with an existing name updates that preset."
      >
        <div className="space-y-4">
          <Input
            label="ABI Name"
            value={savedAbiName}
            onChange={(event) => setSavedAbiName(event.target.value)}
            placeholder="Contract name or address"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsSaveAbiOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveAbi}
              disabled={!savedAbiName.trim()}
            >
              Save ABI
            </Button>
          </div>
        </div>
      </Dialog>
      <ManageAbisDialog />
    </div>
  );
};
