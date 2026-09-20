import type React from 'react';
import { useMemo, useState } from 'react';
import { type Abi, encodeFunctionData } from 'viem';
import { CheckIcon, CopyIcon } from '../../../../../assets/svgs';
import { Button, Select, useToast } from '../../../../../components';
import { useEnvironmentStore, useWorkspaceStore } from '../../../../../store';
import type { AbiItem, RequestItem } from '../../../types';
import {
  isReadContractFunction,
  isWriteContractFunction,
  parseContractAbi,
} from '../../../utils/contractAbi';
import {
  type ContractArgValueMode,
  convertDecimalStringToHex,
  convertHexStringToDecimal,
  formatContractArgs,
  getArgDecimalsKey,
  getArgValueModeKey,
  isIntegerAbiType,
  isStringAbiType,
} from '../../../utils/contractArgs';
import { resolveVariables } from '../../../utils/environment';
import { EnvironmentAwareInput } from '../../environment/EnvironmentAwareField';

interface ContractParamsFormProps {
  activeRequest: RequestItem;
  onSimulateRequest?: () => void;
  isLoading?: boolean;
}

export const ContractParamsForm: React.FC<ContractParamsFormProps> = ({
  activeRequest,
  onSimulateRequest,
  isLoading,
}) => {
  const { toast } = useToast();
  const { updateActiveRequest } = useWorkspaceStore();
  const [copiedCalldata, setCopiedCalldata] = useState(false);

  const parsedActiveAbi = useMemo(
    () => parseContractAbi(activeRequest.abi || ''),
    [activeRequest.abi],
  );

  const activeFunctions = useMemo<AbiItem[]>(() => {
    if (!parsedActiveAbi) return [];

    return parsedActiveAbi.filter((item) =>
      activeRequest.type === 'READ'
        ? isReadContractFunction(item)
        : isWriteContractFunction(item),
    );
  }, [activeRequest.type, parsedActiveAbi]);

  const abiFunctionCount =
    parsedActiveAbi?.filter((item) => item.type === 'function').length ?? 0;
  const hasFallbackAbiItem =
    parsedActiveAbi?.some(
      (item) => item.type === 'fallback' || item.type === 'receive',
    ) ?? false;

  const activeSelectedFunction = useMemo<AbiItem | null>(() => {
    if (!activeRequest.functionName || activeFunctions.length === 0)
      return null;
    return (
      activeFunctions.find((f) => f.name === activeRequest.functionName) || null
    );
  }, [activeRequest.functionName, activeFunctions]);

  const handleFunctionChange = (funcName: string) => {
    updateActiveRequest({ functionName: funcName, args: {} });
  };

  const handleCopyCalldata = async () => {
    if (!activeSelectedFunction) return;

    try {
      const envStore = useEnvironmentStore.getState();
      const activeEnv = envStore.environments.find(
        (e) => e.id === envStore.activeEnvironmentId,
      );
      const activeVariables = activeEnv ? activeEnv.variables : [];

      const resolvedArgs = Object.fromEntries(
        Object.entries(activeRequest.args || {}).map(([k, v]) => [
          k,
          resolveVariables(v, activeVariables).value,
        ]),
      );

      const formattedArgs = formatContractArgs(
        activeSelectedFunction.inputs,
        resolvedArgs,
      );

      const calldata = encodeFunctionData({
        abi: parsedActiveAbi as unknown as Abi,
        functionName: activeRequest.functionName || '',
        args: formattedArgs,
      });

      await navigator.clipboard.writeText(calldata);
      setCopiedCalldata(true);
      setTimeout(() => setCopiedCalldata(false), 2000);

      toast({
        title: 'Calldata Copied',
        description: 'Successfully encoded and copied to clipboard.',
        type: 'success',
      });
    } catch (err) {
      toast({
        title: 'Encoding Failed',
        description: err instanceof Error ? err.message : 'Invalid parameters.',
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
    <>
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
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-foreground/75 block">
              Parameters
            </label>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[10px] rounded-lg flex items-center gap-1 cursor-pointer"
                onClick={handleCopyCalldata}
              >
                {copiedCalldata ? (
                  <CheckIcon
                    title="Check"
                    className="w-3.5 h-3.5 text-status-success"
                  />
                ) : (
                  <CopyIcon title="Copy" className="w-3.5 h-3.5" />
                )}
                {copiedCalldata ? 'Copied' : 'Copy Calldata'}
              </Button>
              {activeRequest.type === 'WRITE' && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7 px-2 text-[10px] rounded-lg cursor-pointer border border-foreground/10 hover:border-foreground/20"
                  onClick={onSimulateRequest}
                  isLoading={isLoading}
                >
                  Simulate
                </Button>
              )}
            </div>
          </div>
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
                (activeRequest.args?.[valueModeKey] as ContractArgValueMode) ||
                'hex';
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
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
                          value={activeRequest.args?.[decimalsKey] || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
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
                                activeValueMode === 'hex' ? 'primary' : 'ghost'
                              }
                              size="sm"
                              className="h-9 min-w-0 rounded-lg !px-1 text-xs shadow-none"
                              whileHover={{ scale: 1 }}
                              whileTap={{ scale: 1 }}
                              onClick={() =>
                                handleStringModeChange(inputName, 'hex')
                              }
                            >
                              Hex
                            </Button>
                            <Button
                              type="button"
                              variant={
                                activeValueMode === 'dec' ? 'primary' : 'ghost'
                              }
                              size="sm"
                              className="h-9 min-w-0 rounded-lg !px-1 text-xs shadow-none"
                              whileHover={{ scale: 1 }}
                              whileTap={{ scale: 1 }}
                              onClick={() =>
                                handleStringModeChange(inputName, 'dec')
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
    </>
  );
};
