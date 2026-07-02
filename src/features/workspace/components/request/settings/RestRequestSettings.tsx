import type React from 'react';
import { useState } from 'react';
import { TrashIcon } from '../../../../../assets/svgs';
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
} from '../../../../../components';
import { trackEvent } from '../../../../../services/analytics/googleAnalytics';
import { useWorkspaceStore } from '../../../../../store';
import { methodSupportsBody } from '../../../constants';
import type { RequestItem } from '../../../types';
import { beautifyJson } from '../../../utils/json';
import {
  EnvironmentAwareInput,
  EnvironmentAwareTextarea,
} from '../../environment/EnvironmentAwareField';
import { JsonUiEditor } from './JsonUiEditor';

interface RestRequestSettingsProps {
  activeRequest: RequestItem;
}

export const RestRequestSettings: React.FC<RestRequestSettingsProps> = ({
  activeRequest,
}) => {
  const { toast } = useToast();
  const { updateActiveRequest } = useWorkspaceStore();
  const [restTabsByRequestId, setRestTabsByRequestId] = useState<
    Record<string, string>
  >({});
  const [jsonModeByRequestId, setJsonModeByRequestId] = useState<
    Record<string, 'text' | 'ui'>
  >({});

  const supportsBody = methodSupportsBody(activeRequest.type);
  const savedRestTab = restTabsByRequestId[activeRequest.id];
  const activeRestTab =
    supportsBody && savedRestTab === 'body'
      ? savedRestTab
      : savedRestTab === 'headers'
        ? savedRestTab
        : 'queryParams';

  const activeJsonMode = jsonModeByRequestId[activeRequest.id] || 'text';

  const handleRestTabChange = (value: string) => {
    setRestTabsByRequestId((currentTabs) => ({
      ...currentTabs,
      [activeRequest.id]: value,
    }));
  };

  const handleJsonModeChange = (mode: 'text' | 'ui') => {
    if (mode === 'ui') {
      try {
        const body = activeRequest.body?.trim();
        if (body) {
          const parsed = JSON.parse(body);
          if (
            typeof parsed !== 'object' ||
            parsed === null ||
            Array.isArray(parsed)
          ) {
            throw new Error('Only JSON objects are supported in UI mode.');
          }
        }
      } catch (e: unknown) {
        toast({
          title: 'Invalid JSON',
          description:
            (e instanceof Error ? e.message : '') ||
            'Fix the request body syntax before switching to UI mode.',
          type: 'error',
        });
        return;
      }
    }
    setJsonModeByRequestId((current) => ({
      ...current,
      [activeRequest.id]: mode,
    }));
  };

  const beautifyBody = () => {
    const body = activeRequest.body?.trim();
    if (!body) {
      toast({
        title: 'Nothing to Beautify',
        description: 'Paste a JSON request body first.',
        type: 'error',
      });
      return;
    }

    try {
      const beautified = beautifyJson(body);
      updateActiveRequest({ body: beautified });
      toast({
        title: 'Body Beautified',
        description: 'Formatted request body as JSON.',
        type: 'success',
      });
    } catch {
      toast({
        title: 'Invalid JSON',
        description: 'Fix the request body syntax before beautifying.',
        type: 'error',
      });
    }
  };

  return (
    <Tabs
      key={`${activeRequest.id}-${activeRequest.type}`}
      defaultValue="queryParams"
      value={activeRestTab}
      onValueChange={handleRestTabChange}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-foreground/10 bg-background/80 px-4 py-1.5 backdrop-blur">
        <h3 className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">
          Request Settings
        </h3>
        <TabsList className="h-9 rounded-lg">
          <TabsTrigger
            value="queryParams"
            className="h-7 rounded-md px-3 text-xs"
          >
            Query Params
          </TabsTrigger>
          <TabsTrigger value="headers" className="h-7 rounded-md px-3 text-xs">
            Headers
          </TabsTrigger>
          {supportsBody && (
            <TabsTrigger value="body" className="h-7 rounded-md px-3 text-xs">
              Body
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <TabsContent value="queryParams" className="mt-0">
          <div className="space-y-3">
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
                  updateActiveRequest({
                    queryParams: [
                      ...(activeRequest.queryParams || []),
                      { key: '', value: '' },
                    ],
                  });
                }}
              >
                + Parameter
              </Button>
            </div>

            {(activeRequest.queryParams || []).map((param, idx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: query parameters have no unique natural identifier before keying
                key={idx}
                className="flex gap-2 items-center"
              >
                <EnvironmentAwareInput
                  placeholder="Key"
                  value={param.key}
                  onChange={(e) => {
                    const updated = [...(activeRequest.queryParams || [])];
                    updated[idx].key = e.target.value;
                    updateActiveRequest({ queryParams: updated });
                  }}
                />
                <EnvironmentAwareInput
                  placeholder="Value"
                  value={param.value}
                  onChange={(e) => {
                    const updated = [...(activeRequest.queryParams || [])];
                    updated[idx].value = e.target.value;
                    updateActiveRequest({ queryParams: updated });
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = (activeRequest.queryParams || []).filter(
                      (_, i) => i !== idx,
                    );
                    updateActiveRequest({ queryParams: updated });
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

        <TabsContent value="headers" className="mt-0">
          <div className="space-y-3">
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
                  updateActiveRequest({
                    headers: [
                      ...(activeRequest.headers || []),
                      { key: '', value: '' },
                    ],
                  });
                }}
              >
                + Header
              </Button>
            </div>

            {(activeRequest.headers || []).map((header, idx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: headers have no unique natural identifier before keying
                key={idx}
                className="flex gap-2 items-center"
              >
                <EnvironmentAwareInput
                  placeholder="Header Name"
                  value={header.key}
                  onChange={(e) => {
                    const updated = [...(activeRequest.headers || [])];
                    updated[idx].key = e.target.value;
                    updateActiveRequest({ headers: updated });
                  }}
                />
                <EnvironmentAwareInput
                  placeholder="Value"
                  value={header.value}
                  onChange={(e) => {
                    const updated = [...(activeRequest.headers || [])];
                    updated[idx].value = e.target.value;
                    updateActiveRequest({ headers: updated });
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const updated = (activeRequest.headers || []).filter(
                      (_, i) => i !== idx,
                    );
                    updateActiveRequest({ headers: updated });
                  }}
                  className="h-9 w-9 rounded p-0 text-primary-500/60 hover:text-primary-500"
                  title="Remove header"
                >
                  <TrashIcon
                    title="Remove header"
                    className="w-4 h-4 shrink-0"
                  />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="body" className="mt-0">
          <div className="space-y-3">
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
                  onClick={() => updateActiveRequest({ bodyType: 'raw' })}
                >
                  Raw (JSON)
                </Button>
                <Button
                  variant={
                    activeRequest.bodyType === 'form-data' ? 'primary' : 'ghost'
                  }
                  size="sm"
                  className="h-7 px-3 text-xs rounded-md"
                  onClick={() => updateActiveRequest({ bodyType: 'form-data' })}
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
                    updateActiveRequest({ bodyType: 'x-www-form-urlencoded' })
                  }
                >
                  URL Encoded
                </Button>
              </div>

              {(!activeRequest.bodyType ||
                activeRequest.bodyType === 'raw') && (
                <div className="flex items-center gap-2">
                  <Tabs
                    defaultValue="text"
                    value={activeJsonMode}
                    onValueChange={(val) =>
                      handleJsonModeChange(val as 'text' | 'ui')
                    }
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
                    onClick={beautifyBody}
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
                    updateActiveRequest({
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
                  onChange={(body) => updateActiveRequest({ body })}
                />
              ) : (
                <EnvironmentAwareTextarea
                  className="font-mono text-xs h-64"
                  placeholder="Raw JSON Request Body"
                  value={activeRequest.body || ''}
                  onChange={(e) =>
                    updateActiveRequest({ body: e.target.value })
                  }
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
                        updateActiveRequest({ formData: updated });
                      }}
                    />
                    <EnvironmentAwareInput
                      placeholder="Value"
                      value={field.value}
                      onChange={(e) => {
                        const updated = [...(activeRequest.formData || [])];
                        updated[idx].value = e.target.value;
                        updateActiveRequest({ formData: updated });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = (activeRequest.formData || []).filter(
                          (_, i) => i !== idx,
                        );
                        updateActiveRequest({ formData: updated });
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
      </div>
    </Tabs>
  );
};
