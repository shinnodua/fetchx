import type React from 'react';
import { Badge, Button, Card, CardTitle } from '../../../components';

interface WorkspaceEmptyStateProps {
  onResetDemoCollections: () => void;
}

export const WorkspaceEmptyState: React.FC<WorkspaceEmptyStateProps> = ({
  onResetDemoCollections,
}) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto space-y-6">
    <Badge variant="primary" className="mx-auto">
      Call3.dev Workspace
    </Badge>
    <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
      Interactive Web3 & API Client
    </h1>
    <p className="text-foreground/60 text-sm max-w-md leading-relaxed">
      Open a request from the collections sidebar, or create a new collection to
      get started. You can run read and write operations on contracts using your
      connected wallet, or fetch HTTP endpoints.
    </p>
    <Card variant="glass" className="w-full text-left p-6">
      <CardTitle className="text-base mb-2">Getting Started</CardTitle>
      <ul className="text-xs text-foreground/75 space-y-2.5 list-disc pl-4">
        <li>
          Connect your Web3 Wallet in the top header (RainbowKit) to run write
          contract calls.
        </li>
        <li>
          Import standard presets (ERC-20, ERC-721) to quickly populate ABIs.
        </li>
        <li>
          Add query parameters, custom HTTP headers, or request bodies for API
          testing.
        </li>
      </ul>
    </Card>
    <Button
      variant="primary"
      size="sm"
      onClick={onResetDemoCollections}
      className="cursor-pointer"
    >
      Reset Demo Collections
    </Button>
  </div>
);
