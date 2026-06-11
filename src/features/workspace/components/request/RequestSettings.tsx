import type React from 'react';
import { useMemo, useState } from 'react';
import { TrashIcon } from '../../../../assets/svgs';
import {
  Button,
  Dialog,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Input,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  useToast,
} from '../../../../components';
import { fetchContractInfo } from '../../../../services/api';
import { useAbiStore, useWorkspaceStore } from '../../../../store';
import {
  ERC20_ABI,
  ERC721_ABI,
  ERC1155_ABI,
  getNativeTokenSymbol,
  isRestMethod,
  methodSupportsBody,
} from '../../constants';
import type { AbiItem } from '../../types';
import {
  formatContractAbi,
  isReadContractFunction,
  isWriteContractFunction,
  parseContractAbi,
} from '../../utils/contractAbi';
import {
  type ContractArgValueMode,
  convertDecimalStringToHex,
  convertHexStringToDecimal,
  getArgDecimalsKey,
  getArgValueModeKey,
  isIntegerAbiType,
  isStringAbiType,
} from '../../utils/contractArgs';
import {
  EnvironmentAwareInput,
  EnvironmentAwareTextarea,
} from '../environment/EnvironmentAwareField';
import { ManageAbisDialog } from './ManageAbisDialog';

export const RequestSettings: React.FC = () => {
  const { toast } = useToast();
  const { collections, activeTabId, drafts, updateActiveRequest } =
    useWorkspaceStore();
  const { savedAbis, saveAbi, setManageAbiOpen } = useAbiStore();
  const [restTabsByRequestId, setRestTabsByRequestId] = useState<
    Record<string, string>
  >({});
  const [isAbiLoading, setIsAbiLoading] = useState(false);
  const [isSaveAbiOpen, setIsSaveAbiOpen] = useState(false);
  const [savedAbiName, setSavedAbiName] = useState('');
  const [contractNamesByRequestId, setContractNamesByRequestId] = useState<
    Record<string, string>
  >({});

  // Find active request
  const activeRequest = useMemo(() => {
    if (drafts[activeTabId]) return drafts[activeTabId];

    for (const col of collections) {
      const req = col.requests.find((r) => r.id === activeTabId);
      if (req) return req;
    }
    return null;
  }, [collections, activeTabId, drafts]);

  const parsedActiveAbi = useMemo(
    () => parseContractAbi(activeRequest?.abi || ''),
    [activeRequest?.abi],
  );

  // Helper: Get parsed functions list
  const activeFunctions = useMemo<AbiItem[]>(() => {
    if (!parsedActiveAbi) return [];

    return parsedActiveAbi.filter((item) =>
      activeRequest?.type === 'READ'
        ? isReadContractFunction(item)
        : isWriteContractFunction(item),
    );
  }, [activeRequest?.type, parsedActiveAbi]);

  const abiFunctionCount =
    parsedActiveAbi?.filter((item) => item.type === 'function').length ?? 0;
  const hasFallbackAbiItem =
    parsedActiveAbi?.some(
      (item) => item.type === 'fallback' || item.type === 'receive',
    ) ?? false;

  const formattedActiveAbi = useMemo(
    () => formatContractAbi(activeRequest?.abi || ''),
    [activeRequest?.abi],
  );

  // Helper: Find selected function object
  const activeSelectedFunction = useMemo<AbiItem | null>(() => {
    if (!activeRequest?.functionName || activeFunctions.length === 0)
      return null;
    return (
      activeFunctions.find((f) => f.name === activeRequest.functionName) || null
    );
  }, [activeRequest, activeFunctions]);

  // Reset function arguments when function name changes
  const handleFunctionChange = (funcName: string) => {
    updateActiveRequest({ functionName: funcName, args: {} });
  };

  // Preset ABI load
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
    if (!activeRequest || !formattedActiveAbi) return;

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
    if (!activeRequest) return;

    const address = activeRequest.target.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      toast({
        title: 'Invalid Contract Address',
        description: 'Enter a valid contract address before loading its ABI.',
        type: 'error',
      });
      return;
    }

    setIsAbiLoading(true);
    try {
      const info = await fetchContractInfo(
        address,
        activeRequest?.network || '1',
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
      setIsAbiLoading(false);
    }
  };

  const beautifyBody = () => {
    const body = activeRequest?.body?.trim();
    if (!body) {
      toast({
        title: 'Nothing to Beautify',
        description: 'Paste a JSON request body first.',
        type: 'error',
      });
      return;
    }

    try {
      updateActiveRequest({ body: JSON.stringify(JSON.parse(body), null, 2) });
      toast({
        title: 'Body Beautified',
        description: 'Formatted request body as JSON.',
        type: 'success',
      });
    } catch {
      toast({
        title: 'Invalid JSON',
        description: 'Fix the request body syntax before beautifying.',
        type: 'error',
      });
    }
  };

  if (!activeRequest) return null;

  const isRestRequest = isRestMethod(activeRequest.type);
  const isWeb3Request =
    activeRequest.type === 'READ' || activeRequest.type === 'WRITE';
  const isNativeTransfer = activeRequest.type === 'SEND';
  const supportsBody = methodSupportsBody(activeRequest.type);
  const savedRestTab = restTabsByRequestId[activeRequest.id];
  const activeRestTab =
    supportsBody && savedRestTab === 'body'
      ? savedRestTab
      : savedRestTab === 'headers'
        ? savedRestTab
        : 'queryParams';

  const handleRestTabChange = (value: string) => {
    setRestTabsByRequestId((currentTabs) => ({
      ...currentTabs,
      [activeRequest.id]: value,
    }));
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

  const handleStringModeChange = (
    inputName: string,
    nextMode: ContractArgValueMode,
  ) => {
    const modeKey = getArgValueModeKey(inputName);
    const currentMode =
      (activeRequest.args?.[modeKey] as ContractArgValueMode | undefined) ??
      'hex';
    if (currentMode === nextMode) return;

    const currentValue = activeRequest.args?.[inputName] || '';
    const nextValue =
      nextMode === 'hex'
        ? convertDecimalStringToHex(currentValue)
        : convertHexStringToDecimal(currentValue);

    updateActiveRequest({
      args: {
        ...(activeRequest.args || {}),
        [inputName]: nextValue,
        [modeKey]: nextMode,
      },
    });
  };

  return (
    <div className="w-full lg:w-1/2 flex-1 flex flex-col min-h-0 overflow-hidden border border-foreground/10 rounded-2xl bg-white/5 dark:bg-black/5">
      {isRestRequest ? (
        <Tabs
          key={`${activeRequest.id}-${activeRequest.type}`}
          defaultValue="queryParams"
          value={activeRestTab}
          onValueChange={handleRestTabChange}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-foreground/10 bg-background/80 px-4 py-1.5 backdrop-blur">
            <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">
              Request Settings
            </h3>
            <TabsList className="h-9 rounded-lg">
              <TabsTrigger
                value="queryParams"
                className="h-7 rounded-md px-3 text-xs"
              >
                Query Params
              </TabsTrigger>
              <TabsTrigger
                value="headers"
                className="h-7 rounded-md px-3 text-xs"
              >
                Headers
              </TabsTrigger>
              {supportsBody && (
                <TabsTrigger
                  value="body"
                  className="h-7 rounded-md px-3 text-xs"
                >
                  Body
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            <TabsContent value="queryParams" className="mt-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-foreground/75">
                    Query Parameters
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[10px] rounded-lg"
                    onClick={() =>
                      updateActiveRequest({
                        queryParams: [
                          ...(activeRequest.queryParams || []),
                          { key: '', value: '' },
                        ],
                      })
                    }
                  >
                    + Parameter
                  </Button>
                </div>

                {(activeRequest.queryParams || []).map((param, idx) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: query parameters have no unique natural identifier before keying
                    key={idx}
                    className="flex gap-2 items-center"
                  >
                    <EnvironmentAwareInput
                      placeholder="Key"
                      value={param.key}
                      onChange={(e) => {
                        const updated = [...(activeRequest.queryParams || [])];
                        updated[idx].key = e.target.value;
                        updateActiveRequest({ queryParams: updated });
                      }}
                    />
                    <EnvironmentAwareInput
                      placeholder="Value"
                      value={param.value}
                      onChange={(e) => {
                        const updated = [...(activeRequest.queryParams || [])];
                        updated[idx].value = e.target.value;
                        updateActiveRequest({ queryParams: updated });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = (
                          activeRequest.queryParams || []
                        ).filter((_, i) => i !== idx);
                        updateActiveRequest({ queryParams: updated });
                      }}
                      className="h-9 w-9 rounded p-0 text-primary-500/60 hover:text-primary-500 mt-0"
                      title="Remove parameter"
                    >
                      <TrashIcon
                        title="Remove parameter"
                        className="w-4 h-4 shrink-0"
                      />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="headers" className="mt-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-foreground/75">
                    Request Headers
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[10px] rounded-lg"
                    onClick={() =>
                      updateActiveRequest({
                        headers: [
                          ...(activeRequest.headers || []),
                          { key: '', value: '' },
                        ],
                      })
                    }
                  >
                    + Header
                  </Button>
                </div>

                {(activeRequest.headers || []).map((header, idx) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: headers have no unique natural identifier before keying
                    key={idx}
                    className="flex gap-2 items-center"
                  >
                    <EnvironmentAwareInput
                      placeholder="Header Name"
                      value={header.key}
                      onChange={(e) => {
                        const updated = [...(activeRequest.headers || [])];
                        updated[idx].key = e.target.value;
                        updateActiveRequest({ headers: updated });
                      }}
                    />
                    <EnvironmentAwareInput
                      placeholder="Value"
                      value={header.value}
                      onChange={(e) => {
                        const updated = [...(activeRequest.headers || [])];
                        updated[idx].value = e.target.value;
                        updateActiveRequest({ headers: updated });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = (activeRequest.headers || []).filter(
                          (_, i) => i !== idx,
                        );
                        updateActiveRequest({ headers: updated });
                      }}
                      className="h-9 w-9 rounded p-0 text-primary-500/60 hover:text-primary-500"
                      title="Remove header"
                    >
                      <TrashIcon
                        title="Remove header"
                        className="w-4 h-4 shrink-0"
                      />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="body" className="mt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-foreground/75 block">
                    {activeRequest.type} Payload (JSON)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[10px] rounded-lg"
                    onClick={beautifyBody}
                  >
                    Beautify
                  </Button>
                </div>
                <EnvironmentAwareTextarea
                  className="font-mono text-xs h-64"
                  placeholder="Raw JSON Request Body"
                  value={activeRequest.body || ''}
                  onChange={(e) =>
                    updateActiveRequest({ body: e.target.value })
                  }
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      ) : (
        <>
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-foreground/10 bg-background/80 px-4 py-1.5 backdrop-blur">
            <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">
              Request Settings
            </h3>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {isNativeTransfer && (
              <div className="space-y-4">
                <EnvironmentAwareInput
                  label={`Amount (${getNativeTokenSymbol(activeRequest.network)})`}
                  inputMode="decimal"
                  placeholder="0.0"
                  value={activeRequest.args?.nativeAmount || ''}
                  onChange={(event) =>
                    updateActiveRequest({
                      args: {
                        ...(activeRequest.args || {}),
                        nativeAmount: event.target.value,
                      },
                    })
                  }
                />
                <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/10 p-3 text-xs text-secondary-700 dark:text-secondary-300">
                  The connected wallet will show the recipient, amount, network,
                  and estimated fee for confirmation before sending.
                </div>
              </div>
            )}

            {/* ABI Configuration (Web3) */}
            {isWeb3Request && (
              <div className="space-y-4">
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
                        isLoading={isAbiLoading}
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
                        >
                          Manage ABI
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => loadPresetAbi('ERC20')}
                        >
                          ERC20 Preset
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => loadPresetAbi('ERC721')}
                        >
                          ERC721 Preset
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => loadPresetAbi('ERC1155')}
                        >
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
                                onClick={() =>
                                  loadSavedAbi(savedAbi.abi, savedAbi.name)
                                }
                                className="truncate"
                                title={savedAbi.name}
                              >
                                <span className="truncate">
                                  {savedAbi.name}
                                </span>
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
                      onChange={(event) =>
                        updateContractAbi(event.target.value)
                      }
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

                {/* Function Selector */}
                {activeFunctions.length > 0 ? (
                  <div>
                    <label className="text-xs font-semibold text-foreground/75 mb-1.5 block">
                      Function Call
                    </label>
                    <Select
                      placeholder="Select ABI Function"
                      value={activeRequest.functionName || ''}
                      onChange={handleFunctionChange}
                      options={activeFunctions.map((f) => ({
                        value: f.name || '',
                        label: `${f.name || 'anonymous'}(${(f.inputs || []).map((i) => i.type).join(', ')})`,
                      }))}
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-primary-500/10 border border-primary-500/20 text-primary-600 rounded-xl text-xs">
                    {!parsedActiveAbi
                      ? 'Please paste a valid contract ABI.'
                      : abiFunctionCount === 0
                        ? `ABI parsed successfully, but it contains no named functions${hasFallbackAbiItem ? ' and only exposes a fallback/receive entry point' : ''}. For a proxy contract, paste the implementation contract ABI.`
                        : `This ABI does not contain ${activeRequest.type === 'READ' ? 'read' : 'write'} functions.`}
                  </div>
                )}

                {/* Parameter Form Fields */}
                {activeSelectedFunction && (
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-semibold text-foreground/75 block">
                      Parameters
                    </label>
                    {activeSelectedFunction.inputs?.length === 0 ? (
                      <p className="text-xs text-foreground/40 italic">
                        No parameters required for this function call.
                      </p>
                    ) : (
                      activeSelectedFunction.inputs?.map((input, idx) => {
                        const inputName = input.name || `arg${idx}`;
                        const decimalsKey = getArgDecimalsKey(inputName);
                        const valueModeKey = getArgValueModeKey(inputName);
                        const isIntegerInput = isIntegerAbiType(input.type);
                        const isStringInput = isStringAbiType(input.type);
                        const activeValueMode =
                          (activeRequest.args?.[
                            valueModeKey
                          ] as ContractArgValueMode) || 'hex';
                        return (
                          <div key={inputName} className="space-y-1">
                            <div className="flex items-start gap-2">
                              <EnvironmentAwareInput
                                inputMode={
                                  isStringInput && activeValueMode === 'dec'
                                    ? 'numeric'
                                    : undefined
                                }
                                label={`${inputName} (${input.type})`}
                                placeholder={input.type}
                                value={activeRequest.args?.[inputName] || ''}
                                onChange={(e) =>
                                  updateActiveRequest({
                                    args: {
                                      ...(activeRequest.args || {}),
                                      [inputName]: e.target.value,
                                    },
                                  })
                                }
                              />
                              {isIntegerInput && (
                                <div className="w-20 shrink-0">
                                  <EnvironmentAwareInput
                                    className="px-2 text-center"
                                    inputMode="numeric"
                                    label="Dec."
                                    maxLength={2}
                                    placeholder="0"
                                    value={
                                      activeRequest.args?.[decimalsKey] || ''
                                    }
                                    onChange={(e) =>
                                      updateActiveRequest({
                                        args: {
                                          ...(activeRequest.args || {}),
                                          [decimalsKey]: e.target.value,
                                        },
                                      })
                                    }
                                  />
                                </div>
                              )}
                              {isStringInput && (
                                <div className="w-28 shrink-0">
                                  <div className="flex w-full flex-col gap-1.5">
                                    <span className="ml-1 text-sm font-medium text-foreground/80">
                                      Mode
                                    </span>
                                    <div className="grid h-12 w-full grid-cols-2 items-center overflow-hidden rounded-xl bg-foreground/5 p-1">
                                      <Button
                                        type="button"
                                        variant={
                                          activeValueMode === 'hex'
                                            ? 'primary'
                                            : 'ghost'
                                        }
                                        size="sm"
                                        className="h-9 min-w-0 rounded-lg !px-1 text-xs shadow-none"
                                        whileHover={{ scale: 1 }}
                                        whileTap={{ scale: 1 }}
                                        onClick={() =>
                                          handleStringModeChange(
                                            inputName,
                                            'hex',
                                          )
                                        }
                                      >
                                        Hex
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={
                                          activeValueMode === 'dec'
                                            ? 'primary'
                                            : 'ghost'
                                        }
                                        size="sm"
                                        className="h-9 min-w-0 rounded-lg !px-1 text-xs shadow-none"
                                        whileHover={{ scale: 1 }}
                                        whileTap={{ scale: 1 }}
                                        onClick={() =>
                                          handleStringModeChange(
                                            inputName,
                                            'dec',
                                          )
                                        }
                                      >
                                        Dec
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
