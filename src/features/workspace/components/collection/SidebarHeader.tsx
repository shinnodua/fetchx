import type React from 'react';
import { ChevronLeftIcon, PlusIcon, SearchIcon } from '../../../../assets/svgs';
import { Button, Input } from '../../../../components';

interface SidebarHeaderProps {
  collectionsPanelWidth: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setNewColOpen: (open: boolean) => void;
  setCollectionsPanelCollapsed: (collapsed: boolean) => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  collectionsPanelWidth,
  searchTerm,
  setSearchTerm,
  setNewColOpen,
  setCollectionsPanelCollapsed,
}) => {
  return (
    <div className="p-4 border-b border-foreground/10 flex flex-col gap-3 select-none">
      <div className="flex items-center justify-between gap-2 min-w-0 mt-[-8px]">
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          <h2 className="text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500 truncate">
            {collectionsPanelWidth >= 220 ? 'Collections' : 'Cols'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollectionsPanelCollapsed(true)}
            className="h-7 w-7 rounded-lg p-0 text-foreground/40 hover:text-foreground cursor-pointer shrink-0"
            title="Collapse Sidebar"
          >
            <ChevronLeftIcon title="Collapse sidebar" className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 rounded-lg text-xs shrink-0 gap-1.5"
          onClick={() => setNewColOpen(true)}
        >
          <PlusIcon
            title="Add collection"
            className="h-3.5 w-3.5 shrink-0"
            strokeWidth={2}
          />
          {collectionsPanelWidth >= 240 && <span>Collection</span>}
        </Button>
      </div>
      <Input
        placeholder="Search request or path..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        leftIcon={
          <SearchIcon
            title="Search collections"
            className="w-4 h-4 text-foreground/40"
          />
        }
      />
    </div>
  );
};
