import { IColumn } from "./IColumn";
import { SortType } from "../types/SortType";

export interface IUseTableOptions<T> {
  data: T[];
  columns: Array<IColumn<T>>;
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
