import type React from 'react';
import { useMemo } from 'react';
import { TrashIcon } from '../../../../assets/svgs';
import {
  Button,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  useToast,
} from '../../../../components';
import { useWorkspaceStore } from '../../../../store';
import { ERC20_ABI, ERC721_ABI } from '../../constants';
import type { AbiItem } from '../../types';
import {
  EnvironmentAwareInput,
  EnvironmentAwareTextarea,
} from '../environment/EnvironmentAwareField';

export const RequestSettings: React.FC = () => {
  const { toast } = useToast();
  const { collections, activeTabId, drafts, updateActiveRequest } =
    useWorkspaceStore();

  // Find active request
  const activeRequest = useMemo(() => {
    if (drafts[activeTabId]) return drafts[activeTabId];

    for (const col of collections) {
      const req = col.requests.find((r) => r.id === activeTabId);
      if (req) return req;
    }
    return null;
  }, [collections, activeTabId, drafts]);

  // Helper: Get parsed functions list
  const activeFunctions = useMemo<AbiItem[]>(() => {
    if (!activeRequest?.abi) return [];
    try {
      const parsed = JSON.parse(activeRequest.abi) as AbiItem[];
      return parsed.filter(
        (item) =>
          item.type === 'function' &&
          (activeRequest.type === 'READ'
            ? item.stateMutability === 'view' ||
              item.stateMutability === 'pure' ||
              item.constant === true
            : item.stateMutability !== 'view' &&
              item.stateMutability !== 'pure' &&
              item.constant !== true),
      );
    } catch {
      return [];
    }
  }, [activeRequest]);

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
  const loadPresetAbi = (preset: 'ERC20' | 'ERC721') => {
    const selectedAbi = preset === 'ERC20' ? ERC20_ABI : ERC721_ABI;
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

  return (
    <div className="w-full lg:w-1/2 flex flex-col min-h-0 border border-foreground/10 rounded-2xl bg-white/5 dark:bg-black/5 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider mb-3">
        Request Settings
      </h3>

      {/* ABI Configuration (Web3) */}
      {(activeRequest.type === 'READ' || activeRequest.type === 'WRITE') && (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-foreground/75">
                Contract ABI
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => loadPresetAbi('ERC20')}
                  className="h-6 px-1 text-[10px] text-primary-500 hover:text-primary-600 cursor-pointer"
                >
                  Load ERC20 Preset
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => loadPresetAbi('ERC721')}
                  className="h-6 px-1 text-[10px] text-primary-500 hover:text-primary-600 cursor-pointer"
                >
                  Load ERC721 Preset
                </Button>
              </div>
            </div>
            <Textarea
              placeholder="Paste contract ABI array (JSON format)"
              className="font-mono text-xs h-32"
              value={activeRequest.abi || ''}
              onChange={(e) =>
                updateActiveRequest({
                  abi: e.target.value,
                  functionName: '',
                  args: {},
                })
              }
            />
          </div>

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
                  value: f.name,
                  label: `${f.name}(${(f.inputs || []).map((i) => i.type).join(', ')})`,
                }))}
              />
            </div>
          ) : (
            <div className="p-3 bg-primary-500/10 border border-primary-500/20 text-primary-600 rounded-xl text-xs">
              Please paste a valid ABI JSON array containing{' '}
              {activeRequest.type === 'READ'
                ? 'read (view/pure)'
                : 'write (payable/nonpayable)'}{' '}
              functions.
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
                  return (
                    <div key={inputName} className="space-y-1">
                      <EnvironmentAwareInput
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
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* REST Params Configuration (GET/POST) */}
      {(activeRequest.type === 'GET' || activeRequest.type === 'POST') && (
        <div className="space-y-4">
          <Tabs defaultValue="queryParams">
            <TabsList className="mb-2">
              <TabsTrigger value="queryParams">Query Params</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
              {activeRequest.type === 'POST' && (
                <TabsTrigger value="body">Body</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="queryParams">
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

            <TabsContent value="headers">
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

            <TabsContent value="body">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-foreground/75 block">
                    POST Payload (JSON)
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
          </Tabs>
        </div>
      )}
    </div>
  );
};
