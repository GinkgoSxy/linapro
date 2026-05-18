export interface DictType {
  id: number;
  name: string;
  type: string;
  status: number;
  isBuiltin: number;
  allowTenantOverride: boolean;
  remark: string;
  sourceTenantId: number;
  isFallback: boolean;
  canEdit: boolean;
  canOverride: boolean;
  overrideMode: 'createTenantOverride' | 'none';
  createdAt: string;
  updatedAt: string;
}

export interface DictTypeListParams {
  pageNum?: number;
  pageSize?: number;
  name?: string;
  type?: string;
  ids?: number[];
}

export interface DictTypeListResult {
  items: DictType[];
  total: number;
}
