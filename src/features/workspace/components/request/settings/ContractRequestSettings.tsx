import type React from 'react';
import { useWorkspaceStore } from '../../../../../store';
import { getNativeTokenSymbol } from '../../../constants';
import type { RequestItem } from '../../../types';
import { EnvironmentAwareInput } from '../../environment/EnvironmentAwareField';
import { ContractAbiForm } from './ContractAbiForm';
import { ContractParamsForm } from './ContractParamsForm';

interface ContractRequestSettingsProps {
  activeRequest: RequestItem;
}

export const ContractRequestSettings: React.FC<
  ContractRequestSettingsProps
> = ({ activeRequest }) => {
  const { updateActiveRequest } = useWorkspaceStore();

  const isNativeTransfer = activeRequest.type === 'SEND';
  const isWeb3Request =
    activeRequest.type === 'READ' || activeRequest.type === 'WRITE';

  return (
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
              The connected wallet will show the recipient, amount, network, and
              estimated fee for confirmation before sending.
            </div>
          </div>
        )}

        {isWeb3Request && (
          <div className="space-y-4">
            <ContractAbiForm activeRequest={activeRequest} />
            <ContractParamsForm activeRequest={activeRequest} />
          </div>
        )}
      </div>
    </>
  );
};
