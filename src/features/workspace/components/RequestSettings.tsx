import type React from 'react';
import { useMemo } from 'react';
import {
  Button,
  Input,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  useToast,
} from '../../../components';
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';
import { ERC20_ABI, ERC721_ABI } from '../constants';
import type { AbiItem } from '../types';

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
                <button
                  type="button"
                  onClick={() => loadPresetAbi('ERC20')}
                  className="text-[10px] text-primary-500 hover:text-primary-600 font-medium cursor-pointer"
                >
                  Load ERC20 Preset
                </button>
                <button
                  type="button"
                  onClick={() => loadPresetAbi('ERC721')}
                  className="text-[10px] text-primary-500 hover:text-primary-600 font-medium cursor-pointer"
                >
                  Load ERC721 Preset
                </button>
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
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs">
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
                      <Input
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
                    <Input
                      placeholder="Key"
                      value={param.key}
                      onChange={(e) => {
                        const updated = [...(activeRequest.queryParams || [])];
                        updated[idx].key = e.target.value;
                        updateActiveRequest({ queryParams: updated });
                      }}
                    />
                    <Input
                      placeholder="Value"
                      value={param.value}
                      onChange={(e) => {
                        const updated = [...(activeRequest.queryParams || [])];
                        updated[idx].value = e.target.value;
                        updateActiveRequest({ queryParams: updated });
                      }}
                    />
                    <button
                      onClick={() => {
                        const updated = (
                          activeRequest.queryParams || []
                        ).filter((_, i) => i !== idx);
                        updateActiveRequest({ queryParams: updated });
                      }}
                      className="p-2 rounded hover:bg-red-500/10 text-red-500/60 hover:text-red-500 mt-0"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <title>Trash icon</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
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
                    <Input
                      placeholder="Header Name"
                      value={header.key}
                      onChange={(e) => {
                        const updated = [...(activeRequest.headers || [])];
                        updated[idx].key = e.target.value;
                        updateActiveRequest({ headers: updated });
                      }}
                    />
                    <Input
                      placeholder="Value"
                      value={header.value}
                      onChange={(e) => {
                        const updated = [...(activeRequest.headers || [])];
                        updated[idx].value = e.target.value;
                        updateActiveRequest({ headers: updated });
                      }}
                    />
                    <button
                      onClick={() => {
                        const updated = (activeRequest.headers || []).filter(
                          (_, i) => i !== idx,
                        );
                        updateActiveRequest({ headers: updated });
                      }}
                      className="p-2 rounded hover:bg-red-500/10 text-red-500/60 hover:text-red-500"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <title>Trash icon</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
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
                <Textarea
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
