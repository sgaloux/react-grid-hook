import * as react from "react";
import React from "react";
import sortBy from "lodash/fp/sortBy";
import { AssertionError } from "assert";
import { IColumn } from "./IColumn";
import { IUseTableOptions } from "./IUseTableOptions";

export type SortType = "NONE" | "ASC" | "DESC";

interface IColumnInfo<T> extends IColumn<T> {
  sortInfo: SortType;
  toggleSort: () => void;
}

interface ISetDataOptions {
  totalCount: number;
  nbPages: number;
  pageIndex: number;
}

// export interface IUseTableStateReturnType<T>
//   extends Pick<IUseTableOptions<T>, "enablePagination" | "enableFilter"> {
//   data: T[];
//   page: T[];
//   pageIndex: number;
//   pageSize: number;
//   nbPages: number;
//   forceTake: number;
//   forceSkip: number;
//   totalCount: number;
//   sortKeys: {
//     [key: string]: SortType;
//   };
//   globalFilter: string;
//   sortKeysStrings: string[];
//   availablePageSizes: number[];
//   pageNumbers: number[];
//   columns: Array<IColumnInfo<T>>;
//   canGoNextPage: boolean;
//   canGoPreviousPage: boolean;
//   setPageSize: (size: number) => void;
//   goToNextPage: () => void;
//   goToPreviousPage: () => void;
//   goToPage: (pageIndex: number) => void;
//   setData: (data: T[], options?: ISetDataOptions) => void;
//   toggleSort: (fieldName: string) => void;
//   setGlobalFilter: (filter: string) => void;
// }

interface IUseTableState<T> extends IUseTableOptions<T> {
  pageIndex: number;
  totalCount: number;
  globalFilter: string;
  page: T[];
  sortKeys: {
    [key: string]: SortType;
  };
}

export const useTableState = <T>(options?: Partial<IUseTableOptions<T>>) => {
  const [tableState, setTableState] = react.useState<IUseTableState<T>>({
    ...{
      data: [],
      columns: [],
      page: [],
      pageIndex: 1,
      nbPages: 1,
      totalCount: 0,
      pageSize: 10,
      serverMode: false,
      availablePageSizes: [10, 25, 50],
      sortKeys: {},
      enableMultiSort: false,
      globalFilter: "",
      enableFilter: true,
      enablePagination: true
    },
    ...options
  });

  const {
    serverMode,
    data,
    pageIndex,
    pageSize,
    availablePageSizes: pagesSizes,
    totalCount,
    page,
    columns,
    enableMultiSort,
    sortKeys,
    globalFilter,
    enableFilter,
    enablePagination
  } = tableState;

  // React.useEffect(() => {
  //   if (!enablePagination) {
  //     setTableState(s => ({ ...s, pageSize: totalCount }));
  //   }
  // }, [enablePagination, totalCount]);

  React.useEffect(() => {
    if (!serverMode) {
      setTableState(s => ({ ...s, totalCount: data.length }));
    } else {
      setTableState(s => ({ ...s, page: data }));
    }
  }, [data, serverMode, setTableState]);

  // COMPUTE SORT
  const sortedData = React.useMemo(() => {
    if (!serverMode) {
      let sortedDataResults = data as any;
      Object.keys(sortKeys)
        .filter(k => sortKeys[k] !== "NONE")
        .forEach(k => {
          sortedDataResults = sortBy(sortedDataResults, sortKeys[k]);
          if (sortKeys[k] === "DESC") {
            sortedDataResults = sortedDataResults.reverse();
          }
        });
      return sortedDataResults as T[];
    } else {
      return data;
    }
  }, [data, serverMode, sortKeys]);

  // COMPUTE PAGE AND PAGE COUNT
  React.useEffect(() => {
    if (!serverMode) {
      if (enablePagination) {
        const nextnbPages = Math.ceil(totalCount / pageSize);
        const startIndex = (pageIndex - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const nextpage = sortedData.slice(startIndex, endIndex);
        setTableState(s => ({ ...s, page: nextpage, nbPages: nextnbPages }));
      } else {
        // Set only 1 page with the size of TotalCount
        setTableState(s => ({ ...s, page: sortedData, nbPages: 1 }));
      }
    } else {
      setTableState(s => ({ ...s, page: sortedData }));
    }
  }, [serverMode, sortedData, pageIndex, pageSize, totalCount, setTableState]);

  const nbPages = React.useMemo(() => Math.ceil(totalCount / pageSize), [
    pageSize,
    totalCount
  ]);

  const canGoNextPage = React.useMemo(() => pageIndex < nbPages, [
    pageIndex,
    nbPages
  ]);

  const canGoPreviousPage = React.useMemo(() => pageIndex > 1, [pageIndex]);

  const goToNextPage = React.useCallback(() => {
    if (canGoNextPage) {
      setTableState(s => ({ ...s, pageIndex: s.pageIndex + 1 }));
    }
  }, [canGoNextPage, setTableState]);

  const goToPreviousPage = React.useCallback(() => {
    if (canGoPreviousPage) {
      setTableState(s => ({ ...s, pageIndex: s.pageIndex - 1 }));
    }
  }, [canGoPreviousPage, setTableState]);

  const goToPage = React.useCallback(
    (pgIndex: number) => {
      if (pgIndex > 0 && pgIndex <= nbPages) {
        setTableState(s => ({ ...s, pageIndex: pgIndex }));
      }
    },
    [nbPages, setTableState]
  );

  const setData = React.useCallback(
    (nextData: T[], dataOptions?: ISetDataOptions) => {
      setTableState(s => {
        const nextState = { ...s };
        nextState.data = nextData;
        if (dataOptions) {
          nextState.totalCount = dataOptions.totalCount;
          nextState.pageIndex = dataOptions.pageIndex;
        }
        return nextState;
      });
    },
    [setTableState]
  );

  const [forceTake, forceSkip] = React.useMemo(
    () => [pageSize, pageSize * pageIndex - 1],
    [pageIndex, pageSize]
  );

  const toggleSort = React.useCallback(
    (fieldName: string) => {
      if (!fieldName) return;
      const currentKeySort = sortKeys[fieldName] || "NONE";
      let nextSortKeys = { ...sortKeys };
      let nextSort: SortType = "NONE";
      if (currentKeySort === "NONE") {
        nextSort = "ASC";
      } else if (currentKeySort === "ASC") {
        nextSort = "DESC";
      }
      if (!enableMultiSort) {
        // Reset other keys
        Object.keys(sortKeys).forEach(k => (nextSortKeys[k] = "NONE"));
      }
      nextSortKeys[fieldName] = nextSort;
      setTableState(s => ({ ...s, sortKeys: nextSortKeys }));
    },
    [enableMultiSort, setTableState, sortKeys]
  );

  const setPageSize = React.useCallback(
    (size: number) => {
      setTableState(s => ({ ...s, pageSize: size }));
    },
    [setTableState]
  );

  const setGlobalFilter = React.useCallback(
    (filter: string) => {
      setTableState(s => ({ ...s, globalFilter: filter, pageIndex: 1 }));
    },
    [setTableState]
  );

  const computedColumns = React.useMemo((): Array<IColumnInfo<T>> => {
    return columns.map(c => {
      let sortInfo: SortType = "NONE";
      if (c.fieldName) {
        sortInfo = sortKeys[c.fieldName as string] || "NONE";
      }
      return {
        ...c,
        sortInfo,
        toggleSort: () => {
          toggleSort(c.fieldName as string);
        }
      };
    });
  }, [columns, sortKeys, toggleSort]);

  const pageNumbers = React.useMemo(
    () =>
      nbPages
        ? Array(nbPages)
            .fill(null)
            .map((x, i) => i + 1)
        : [],
    [nbPages]
  );

  const sortKeysStrings = React.useMemo(
    () =>
      Object.keys(sortKeys)
        .filter(k => sortKeys[k] !== "NONE")
        .map(k => `${k}${sortKeys[k] === "DESC" ? "|d" : ""}`),
    [sortKeys]
  );

  return {
    data,
    page,
    pageIndex,
    pageSize,
    availablePageSizes: pagesSizes!,
    nbPages,
    totalCount,
    sortKeys,
    sortKeysStrings,
    columns: computedColumns,
    canGoNextPage,
    canGoPreviousPage,
    goToNextPage,
    goToPreviousPage,
    setPageSize,
    setGlobalFilter,
    goToPage,
    setData,
    toggleSort,
    forceTake,
    forceSkip,
    pageNumbers,
    globalFilter,
    enableFilter,
    enablePagination
  };
};
