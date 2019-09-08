import * as React from "react";
import * as lodash from "lodash";
import { IColumn } from "./interfaces/IColumn";
import { IUseTableOptions } from "./interfaces/IUseTableOptions";
import { SortType } from "./types/SortType";
import { object } from "prop-types";

interface IColumnInfo<T> extends IColumn<T> {
  sortInfo: SortType;
  toggleSort: () => void;
}

interface ISetDataOptions {
  totalCount: number;
  nbPages: number;
  pageIndex: number;
}

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
  const [tableState, setTableState] = React.useState<IUseTableState<T>>({
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

  // Compute basic total count and page data
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
      const sortKeyFields = Object.keys(sortKeys).filter(
        d => sortKeys[d] !== "NONE"
      );

      const sortKeyOrderBy = sortKeyFields
        .map(d => sortKeys[d])
        .filter(s => s !== "NONE")
        .map(s => (s === "ASC" ? "asc" : "desc"));

      const sortedDataResults = lodash.orderBy(
        data as any,
        sortKeyFields,
        sortKeyOrderBy
      );

      return sortedDataResults as T[];
    } else {
      return data;
    }
  }, [data, serverMode, sortKeys]);

  // COMPUTE PAGE CONTENT AND PAGE COUNT
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
    (fieldName: string, sortOrder?: SortType) => {
      if (!fieldName) return;

      const currentKeySort = sortKeys[fieldName] || "NONE";
      let nextSortKeys = { ...sortKeys };
      let nextSort: SortType = "NONE";
      if (sortOrder !== undefined) {
        nextSort = sortOrder;
      } else {
        if (currentKeySort === "NONE") {
          nextSort = "ASC";
        } else if (currentKeySort === "ASC") {
          nextSort = "DESC";
        }
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
