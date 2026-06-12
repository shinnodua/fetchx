import type React from 'react';
import { Button, Dialog, Input } from '../../../../../components';

interface SaveAbiDialogProps {
  isOpen: boolean;
  onClose: () => void;
  savedAbiName: string;
  setSavedAbiName: (name: string) => void;
  onSave: () => void;
}

export const SaveAbiDialog: React.FC<SaveAbiDialogProps> = ({
  isOpen,
  onClose,
  savedAbiName,
  setSavedAbiName,
  onSave,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
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
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={!savedAbiName.trim()}
          >
            Save ABI
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
