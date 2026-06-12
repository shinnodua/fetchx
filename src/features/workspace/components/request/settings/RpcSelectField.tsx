import type React from 'react';
import { Select } from '../../../../../components';
import { useRpcStore } from '../../../../../store';
import { findRpcOption, getRpcSelectOptions } from '../../../utils/rpcOptions';

const MANAGE_RPCS_OPTION_VALUE = '__manage_rpcs';

interface RpcSelectFieldProps {
  value: string;
  onChange: (fields: { network: string; customRpcId?: string }) => void;
  disabled?: boolean;
}

export const RpcSelectField: React.FC<RpcSelectFieldProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const { customRpcs, setManageRpcOpen } = useRpcStore();

  return (
    <Select
      options={[
        {
          value: MANAGE_RPCS_OPTION_VALUE,
          label: 'Manage RPCs',
          separatorAfter: true,
          className: 'text-primary-500 hover:text-primary-600 font-medium',
        },
        ...getRpcSelectOptions(customRpcs),
      ]}
      value={value}
      onChange={(nextValue) => {
        if (nextValue === MANAGE_RPCS_OPTION_VALUE) {
          setManageRpcOpen(true);
          return;
        }

        const rpc = findRpcOption(nextValue, customRpcs);
        if (!rpc) return;

        onChange({
          network: rpc.chainId,
          customRpcId: rpc.isDefault ? undefined : rpc.id,
        });
      }}
      disabled={disabled}
    />
  );
};
