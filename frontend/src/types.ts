export interface PingRecord {
  id: string;
  intervalKey: string;
  createdAt: string;
  requestPayload: Record<string, unknown>;
  responseStatus: number | null;
  responseBody: Record<string, unknown> | null;
  responseBodyTruncated: boolean;
  latencyMs: number | null;
  success: boolean;
  errorMessage: string | null;
}

export interface PingsResponse {
  data: PingRecord[];
  total: number;
  limit: number;
  offset: number;
}
