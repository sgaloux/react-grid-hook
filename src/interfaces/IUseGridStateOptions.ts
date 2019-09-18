import { SortType } from "../types/SortType";

export interface IUseGridStateOptions<T> {
  data: T[];
  columns: Array<keyof T>;
  pageSize: number;
  availablePageSizes?: number[];
  sortKeys: {
    [key: string]: SortType;
  };
  serverMode?: boolean;
  enableMultiSort?: boolean;
  enableFilter?: boolean;
  enablePagination?: boolean;
}
