import type React from 'react';
import { TrashIcon } from '../../../../../assets/svgs';
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../../../components';
import type { RequestItem } from '../../../types';
import {
  EnvironmentAwareInput,
  EnvironmentAwareTextarea,
} from '../../environment/EnvironmentAwareField';
import { JsonUiEditor } from './JsonUiEditor';

interface RestBodyTabProps {
  activeRequest: RequestItem;
  activeJsonMode: 'text' | 'ui';
  onJsonModeChange: (mode: 'text' | 'ui') => void;
  onBeautifyBody: () => void;
  onUpdateActiveRequest: (updates: Partial<RequestItem>) => void;
}

export const RestBodyTab: React.FC<RestBodyTabProps> = ({
  activeRequest,
  activeJsonMode,
  onJsonModeChange,
  onBeautifyBody,
  onUpdateActiveRequest,
}) => {
  return (
    <TabsContent value="body" className="mt-0">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={
                !activeRequest.bodyType || activeRequest.bodyType === 'raw'
                  ? 'primary'
                  : 'ghost'
              }
              size="sm"
              className="h-7 px-3 text-xs rounded-md"
              onClick={() => onUpdateActiveRequest({ bodyType: 'raw' })}
            >
              Raw (JSON)
            </Button>
            <Button
              variant={
                activeRequest.bodyType === 'form-data' ? 'primary' : 'ghost'
              }
              size="sm"
              className="h-7 px-3 text-xs rounded-md"
              onClick={() => onUpdateActiveRequest({ bodyType: 'form-data' })}
            >
              Form Data
            </Button>
            <Button
              variant={
                activeRequest.bodyType === 'x-www-form-urlencoded'
                  ? 'primary'
                  : 'ghost'
              }
              size="sm"
              className="h-7 px-3 text-xs rounded-md"
              onClick={() =>
                onUpdateActiveRequest({ bodyType: 'x-www-form-urlencoded' })
              }
            >
              URL Encoded
            </Button>
          </div>

          {(!activeRequest.bodyType || activeRequest.bodyType === 'raw') && (
            <div className="flex items-center gap-2">
              <Tabs
                defaultValue="text"
                value={activeJsonMode}
                onValueChange={(val) => onJsonModeChange(val as 'text' | 'ui')}
              >
                <TabsList className="h-7 rounded-md p-0.5">
                  <TabsTrigger
                    value="text"
                    className="h-6 rounded-sm px-2.5 text-[10px]"
                  >
                    Text
                  </TabsTrigger>
                  <TabsTrigger
                    value="ui"
                    className="h-6 rounded-sm px-2.5 text-[10px]"
                  >
                    UI
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[10px] rounded-lg"
                onClick={onBeautifyBody}
                disabled={activeJsonMode === 'ui'}
              >
                Beautify
              </Button>
            </div>
          )}
          {activeRequest.bodyType && activeRequest.bodyType !== 'raw' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[10px] rounded-lg"
              onClick={() => {
                onUpdateActiveRequest({
                  formData: [
                    ...(activeRequest.formData || []),
                    { key: '', value: '' },
                  ],
                });
              }}
            >
              + Form Field
            </Button>
          )}
        </div>

        {!activeRequest.bodyType || activeRequest.bodyType === 'raw' ? (
          activeJsonMode === 'ui' ? (
            <JsonUiEditor
              body={activeRequest.body}
              onChange={(body) => onUpdateActiveRequest({ body })}
            />
          ) : (
            <EnvironmentAwareTextarea
              className="font-mono text-xs h-64"
              placeholder="Raw JSON Request Body"
              value={activeRequest.body || ''}
              onChange={(e) => onUpdateActiveRequest({ body: e.target.value })}
            />
          )
        ) : (
          <div className="space-y-3">
            {(activeRequest.formData || []).map((field, idx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: form fields have no unique natural identifier before keying
                key={idx}
                className="flex gap-2 items-center"
              >
                <EnvironmentAwareInput
                  placeholder="Key"
                  value={field.key}
                  onChange={(e) => {
                    const updated = [...(activeRequest.formData || [])];
                    updated[idx].key = e.target.value;
                    onUpdateActiveRequest({ formData: updated });
                  }}
                />
                <EnvironmentAwareInput
                  placeholder="Value"
                  value={field.value}
                  onChange={(e) => {
                    const updated = [...(activeRequest.formData || [])];
                    updated[idx].value = e.target.value;
                    onUpdateActiveRequest({ formData: updated });
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = (activeRequest.formData || []).filter(
                      (_, i) => i !== idx,
                    );
                    onUpdateActiveRequest({ formData: updated });
                  }}
                  className="h-9 w-9 rounded p-0 text-primary-500/60 hover:text-primary-500 mt-0"
                  title="Remove field"
                >
                  <TrashIcon
                    title="Remove field"
                    className="w-4 h-4 shrink-0"
                  />
                </Button>
              </div>
            ))}
            {(!activeRequest.formData ||
              activeRequest.formData.length === 0) && (
              <p className="text-xs text-foreground/50 italic py-2">
                No form data fields added yet.
              </p>
            )}
          </div>
        )}
      </div>
    </TabsContent>
  );
};
