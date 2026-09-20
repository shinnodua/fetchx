import type React from 'react';
import { TrashIcon } from '../../../../../assets/svgs';
import { Button, TabsContent } from '../../../../../components';
import { trackEvent } from '../../../../../services/analytics/googleAnalytics';
import type { RequestItem } from '../../../types';
import { EnvironmentAwareInput } from '../../environment/EnvironmentAwareField';

interface RestHeadersTabProps {
  headers: RequestItem['headers'];
  onUpdateHeaders: (headers: RequestItem['headers']) => void;
}

export const RestHeadersTab: React.FC<RestHeadersTabProps> = ({
  headers,
  onUpdateHeaders,
}) => {
  return (
    <TabsContent value="headers" className="mt-0">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-foreground/75">
            Request Headers
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[10px] rounded-lg"
            onClick={() => {
              trackEvent({ screen: 'workspace', action: 'add_header' });
              onUpdateHeaders([...(headers || []), { key: '', value: '' }]);
            }}
          >
            + Header
          </Button>
        </div>

        {(headers || []).map((header, idx) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: headers have no unique natural identifier before keying
            key={idx}
            className="flex gap-2 items-center"
          >
            <EnvironmentAwareInput
              placeholder="Header Name"
              value={header.key}
              onChange={(e) => {
                const updated = [...(headers || [])];
                updated[idx].key = e.target.value;
                onUpdateHeaders(updated);
              }}
            />
            <EnvironmentAwareInput
              placeholder="Value"
              value={header.value}
              onChange={(e) => {
                const updated = [...(headers || [])];
                updated[idx].value = e.target.value;
                onUpdateHeaders(updated);
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const updated = (headers || []).filter((_, i) => i !== idx);
                onUpdateHeaders(updated);
              }}
              className="h-9 w-9 rounded p-0 text-primary-500/60 hover:text-primary-500"
              title="Remove header"
            >
              <TrashIcon title="Remove header" className="w-4 h-4 shrink-0" />
            </Button>
          </div>
        ))}
      </div>
    </TabsContent>
  );
};
