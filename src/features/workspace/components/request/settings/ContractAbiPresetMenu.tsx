import type React from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../../../components';

interface ContractAbiPresetMenuProps {
  savedAbis: Array<{ id: string; name: string; abi: string }>;
  onLoadPreset: (preset: 'ERC20' | 'ERC721' | 'ERC1155') => void;
  onLoadSavedAbi: (abi: string, name: string) => void;
  onManageAbi: () => void;
}

export const ContractAbiPresetMenu: React.FC<ContractAbiPresetMenuProps> = ({
  savedAbis,
  onLoadPreset,
  onLoadSavedAbi,
  onManageAbi,
}) => {
  return (
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
        onClick={onManageAbi}
        className="text-primary-500 hover:text-primary-600 font-medium"
      >
        Manage ABI
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onLoadPreset('ERC20')}>
        ERC20 Preset
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onLoadPreset('ERC721')}>
        ERC721 Preset
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onLoadPreset('ERC1155')}>
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
              onClick={() => onLoadSavedAbi(savedAbi.abi, savedAbi.name)}
              className="truncate"
              title={savedAbi.name}
            >
              <span className="truncate">{savedAbi.name}</span>
            </DropdownMenuItem>
          ))}
        </>
      )}
    </DropdownMenu>
  );
};
