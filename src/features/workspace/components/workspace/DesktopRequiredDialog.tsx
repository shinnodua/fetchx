import type React from 'react';
import { Button, Dialog } from '../../../../components';

interface DesktopRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopRequiredDialog: React.FC<DesktopRequiredDialogProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="GitHub workspaces need FetchX Desktop"
      description="GitHub credentials and repository sync are kept in your operating system keychain."
    >
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-foreground/65">
          Open FetchX Desktop to connect a GitHub account, use a personal access
          token, and sync collection files.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              window.location.assign('fetchx://');
            }}
          >
            Open desktop app
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
