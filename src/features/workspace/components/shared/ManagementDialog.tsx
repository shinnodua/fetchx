import type React from 'react';
import { Dialog } from '../../../../components';
import { cn } from '../../../../utils/cn';

export const managementDialogClassName =
  'flex h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-none flex-col overflow-hidden';

interface ManagementDialogProps {
  children: React.ReactNode;
  description: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  className?: string;
}

export const ManagementDialog: React.FC<ManagementDialogProps> = ({
  children,
  description,
  isOpen,
  onClose,
  title,
  className,
}) => (
  <Dialog
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    description={description}
    className={cn(managementDialogClassName, className)}
  >
    {children}
  </Dialog>
);
