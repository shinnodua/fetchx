export type ApiRequestBody = BodyInit | null | undefined;

export interface ApiRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: ApiRequestBody;
}

export interface ApiResponse<TData = unknown> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: TData;
  proxied: boolean;
}

export interface ProxyResponseBody {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  bodyType: 'json' | 'text' | 'empty';
}
