import type { RequestItem } from '../types';

export const copyLinkAddress = (request: RequestItem): string => {
  let url = request.target || '';
  const activeParams = (request.queryParams || []).filter(
    (p) => p.key && p.key.trim() !== '',
  );
  if (activeParams.length > 0) {
    const separator = url.includes('?') ? '&' : '?';
    const paramString = activeParams
      .map(
        (p) =>
          `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(
            p.value || '',
          )}`,
      )
      .join('&');
    url += `${separator}${paramString}`;
  }
  return url;
};

export const copyAsFetch = (request: RequestItem): string => {
  const method = (request.type || 'GET').toUpperCase();
  const url = copyLinkAddress(request);
  const headersObj: Record<string, string> = {};
  const activeHeaders = (request.headers || []).filter(
    (h) => h.key && h.key.trim() !== '',
  );
  for (const h of activeHeaders) {
    headersObj[h.key.trim()] = h.value || '';
  }

  const options: {
    method: string;
    headers: Record<string, string>;
    body?: string;
  } = {
    method,
    headers: headersObj,
  };

  if (method !== 'GET' && request.body && request.body.trim() !== '') {
    options.body = request.body;
  }

  return `fetch("${url.replace(/"/g, '\\"')}", ${JSON.stringify(options, null, 2)});`;
};

export const copyAsCurlBash = (request: RequestItem): string => {
  const method = (request.type || 'GET').toUpperCase();
  const url = copyLinkAddress(request);

  // Handle contract read/write fallbacks
  if (method === 'READ' || method === 'WRITE') {
    return `# Contract ${method} Call\n# Target: ${url}\n# Function: ${request.functionName || 'none'}`;
  }

  const parts = ['curl'];

  if (method !== 'GET') {
    parts.push(`-X ${method}`);
  }

  // Wrap url in single quotes and escape single quotes within the URL
  parts.push(`'${url.replace(/'/g, "'\\''")}'`);

  const activeHeaders = (request.headers || []).filter(
    (h) => h.key && h.key.trim() !== '',
  );
  for (const header of activeHeaders) {
    parts.push(
      `-H '${header.key.trim()}: ${(header.value || '').replace(/'/g, "'\\''")}'`,
    );
  }

  if (method !== 'GET' && request.body && request.body.trim() !== '') {
    parts.push(`-d '${request.body.replace(/'/g, "'\\''")}'`);
  }

  return parts.join(' \\\n  ');
};

export const copyAsCurlCmd = (request: RequestItem): string => {
  const method = (request.type || 'GET').toUpperCase();
  const url = copyLinkAddress(request);

  if (method === 'READ' || method === 'WRITE') {
    return `rem Contract ${method} Call\nrem Target: ${url}\nrem Function: ${request.functionName || 'none'}`;
  }

  const parts = ['curl'];
  if (method !== 'GET') {
    parts.push(`-X ${method}`);
  }

  parts.push(`"${url.replace(/"/g, '\\"')}"`);

  const activeHeaders = (request.headers || []).filter(
    (h) => h.key && h.key.trim() !== '',
  );
  for (const header of activeHeaders) {
    parts.push(
      `-H "${header.key.trim()}: ${(header.value || '').replace(/"/g, '\\"')}"`,
    );
  }

  if (method !== 'GET' && request.body && request.body.trim() !== '') {
    const escapedBody = request.body
      .replace(/"/g, '\\"')
      .replace(/\r?\n/g, ' ');
    parts.push(`-d "${escapedBody}"`);
  }

  return parts.join(' ^\n  ');
};

export const copyAsCurlPowerShell = (request: RequestItem): string => {
  const method = (request.type || 'GET').toUpperCase();
  const url = copyLinkAddress(request);

  if (method === 'READ' || method === 'WRITE') {
    return `# Contract ${method} Call\n# Target: ${url}\n# Function: ${request.functionName || 'none'}`;
  }

  const parts = ['curl.exe'];
  if (method !== 'GET') {
    parts.push(`-X ${method}`);
  }

  parts.push(`'${url.replace(/'/g, "''")}'`);

  const activeHeaders = (request.headers || []).filter(
    (h) => h.key && h.key.trim() !== '',
  );
  for (const header of activeHeaders) {
    parts.push(
      `-H '${header.key.trim()}: ${(header.value || '').replace(/'/g, "''")}'`,
    );
  }

  if (method !== 'GET' && request.body && request.body.trim() !== '') {
    parts.push(`-d '${request.body.replace(/'/g, "''")}'`);
  }

  return parts.join(' `\n  ');
};

export const copyRequestHeaders = (request: RequestItem): string => {
  const activeHeaders = (request.headers || []).filter(
    (h) => h.key && h.key.trim() !== '',
  );
  return activeHeaders
    .map((h) => `${h.key.trim()}: ${h.value || ''}`)
    .join('\n');
};

export const copyResponse = (request: RequestItem): string => {
  if (
    !request.response ||
    request.response.data === undefined ||
    request.response.data === null
  ) {
    return '';
  }
  if (typeof request.response.data === 'string') {
    return request.response.data;
  }
  return JSON.stringify(request.response.data, null, 2);
};
