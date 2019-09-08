import { IColumn } from "./IColumn";

export interface IUseTableOptions<T> {
  data: T[];
  columns: Array<IColumn<T>>;
  pageSize: number;
  availablePageSizes?: number[];
  serverMode?: boolean;
  enableMultiSort?: boolean;
  enableFilter?: boolean;
  enablePagination?: boolean;
}
