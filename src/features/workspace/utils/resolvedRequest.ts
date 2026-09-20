import type { EnvironmentVariable, RequestItem } from '../types';
import { resolveVariables } from './environment';

export function resolveRequestForExecution(
  request: RequestItem,
  activeVariables: EnvironmentVariable[],
) {
  const resolvedTarget = resolveVariables(request.target, activeVariables);
  const resolvedBody = resolveVariables(request.body || '', activeVariables);
  const resolvedHeaders = (request.headers || []).map((header) => ({
    key: resolveVariables(header.key, activeVariables),
    value: resolveVariables(header.value, activeVariables),
  }));
  const resolvedQueryParams = (request.queryParams || []).map((queryParam) => ({
    key: resolveVariables(queryParam.key, activeVariables),
    value: resolveVariables(queryParam.value, activeVariables),
  }));
  const resolvedArgs = Object.fromEntries(
    Object.entries(request.args || {}).map(([key, value]) => [
      key,
      resolveVariables(value, activeVariables),
    ]),
  );

  return {
    redacted: {
      ...request,
      target: resolvedTarget.redacted,
      body: resolvedBody.redacted,
      headers: resolvedHeaders.map((header) => ({
        key: header.key.redacted,
        value: header.value.redacted,
      })),
      queryParams: resolvedQueryParams.map((queryParam) => ({
        key: queryParam.key.redacted,
        value: queryParam.value.redacted,
      })),
      args: Object.fromEntries(
        Object.entries(resolvedArgs).map(([key, value]) => [
          key,
          value.redacted,
        ]),
      ),
    },
    resolved: {
      ...request,
      target: resolvedTarget.value,
      body: resolvedBody.value,
      headers: resolvedHeaders.map((header) => ({
        key: header.key.value,
        value: header.value.value,
      })),
      queryParams: resolvedQueryParams.map((queryParam) => ({
        key: queryParam.key.value,
        value: queryParam.value.value,
      })),
      args: Object.fromEntries(
        Object.entries(resolvedArgs).map(([key, value]) => [key, value.value]),
      ),
    },
  };
}
