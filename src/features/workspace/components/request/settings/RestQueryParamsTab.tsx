import type React from 'react';
import { TrashIcon } from '../../../../../assets/svgs';
import { Button, TabsContent } from '../../../../../components';
import { trackEvent } from '../../../../../services/analytics/googleAnalytics';
import type { RequestItem } from '../../../types';
import { EnvironmentAwareInput } from '../../environment/EnvironmentAwareField';

interface RestQueryParamsTabProps {
  queryParams: RequestItem['queryParams'];
  onUpdateQueryParams: (queryParams: RequestItem['queryParams']) => void;
}

export const RestQueryParamsTab: React.FC<RestQueryParamsTabProps> = ({
  queryParams,
  onUpdateQueryParams,
}) => {
  return (
    <TabsContent value="queryParams" className="mt-0">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-foreground/75">
            Query Parameters
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[10px] rounded-lg"
            onClick={() => {
              trackEvent({ screen: 'workspace', action: 'add_param' });
              onUpdateQueryParams([
                ...(queryParams || []),
                { key: '', value: '' },
              ]);
            }}
          >
            + Parameter
          </Button>
        </div>

        {(queryParams || []).map((param, idx) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: query parameters have no unique natural identifier before keying
            key={idx}
            className="flex gap-2 items-center"
          >
            <EnvironmentAwareInput
              placeholder="Key"
              value={param.key}
              onChange={(e) => {
                const updated = [...(queryParams || [])];
                updated[idx].key = e.target.value;
                onUpdateQueryParams(updated);
              }}
            />
            <EnvironmentAwareInput
              placeholder="Value"
              value={param.value}
              onChange={(e) => {
                const updated = [...(queryParams || [])];
                updated[idx].value = e.target.value;
                onUpdateQueryParams(updated);
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const updated = (queryParams || []).filter((_, i) => i !== idx);
                onUpdateQueryParams(updated);
              }}
              className="h-9 w-9 rounded p-0 text-primary-500/60 hover:text-primary-500 mt-0"
              title="Remove parameter"
            >
              <TrashIcon
                title="Remove parameter"
                className="w-4 h-4 shrink-0"
              />
            </Button>
          </div>
        ))}
      </div>
    </TabsContent>
  );
};
