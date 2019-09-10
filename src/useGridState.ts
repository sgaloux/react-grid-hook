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
  pageIndex: number;
}

interface IUsegridState<T> extends IUseTableOptions<T> {
  pageIndex: number;
  totalCount: number;
  globalFilter: string;
  page: T[];
  sortKeys: {
    [key: string]: SortType;
  };
}

export const useGridState = <T extends { [key: string]: any }>(
  options?: Partial<IUseTableOptions<T>>
) => {
  const [gridState, setGridState] = React.useState<IUsegridState<T>>({
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
  } = gridState;

  const filterCache = React.useMemo(() => {
    return data.map(obj => {
      const objectKeys = Object.keys(obj);
      return {
        filterText: objectKeys.map(k => (obj[k] + "").toUpperCase()).join(""),
        item: obj
      };
    });
  }, [data]);

  // Compute basic total count and page data
  React.useEffect(() => {
    if (!serverMode) {
      setGridState(s => ({ ...s, totalCount: data.length }));
    } else {
      setGridState(s => ({ ...s, page: data }));
    }
  }, [data, serverMode, setGridState]);

  // COMPUTE SORT and FILTER
  const sortedData = React.useMemo(() => {
    if (!serverMode) {
      const filtered = globalFilter
        ? filterCache
            .filter(d => d.filterText.includes(globalFilter.toUpperCase()))
            .map(d => d.item)
        : data;

      const sortKeyFields = Object.keys(sortKeys).filter(
        d => sortKeys[d] !== "NONE"
      );

      const sortKeyOrderBy = sortKeyFields
        .map(d => sortKeys[d])
        .filter(s => s !== "NONE")
        .map(s => (s === "ASC" ? "asc" : "desc"));

      const sortedDataResults = lodash.orderBy(
        filtered as any,
        sortKeyFields,
        sortKeyOrderBy
      );

      return sortedDataResults as T[];
    } else {
      return data;
    }
  }, [filterCache, serverMode, sortKeys, data, globalFilter]);

  // COMPUTE PAGE CONTENT AND PAGE COUNT
  React.useEffect(() => {
    if (!serverMode) {
      if (enablePagination) {
        const nextnbPages = Math.ceil(totalCount / pageSize);
        const startIndex = (pageIndex - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const nextpage = sortedData.slice(startIndex, endIndex);
        setGridState(s => ({
          ...s,
          page: nextpage,
          nbPages: nextnbPages,
          pageIndex:
            nextnbPages < s.pageIndex && nextnbPages > 0
              ? nextnbPages
              : s.pageIndex
        }));
      } else {
        // Set only 1 page with the size of TotalCount
        setGridState(s => ({ ...s, page: sortedData, nbPages: 1 }));
      }
    } else {
      setGridState(s => ({ ...s, page: sortedData }));
    }
  }, [serverMode, sortedData, pageIndex, pageSize, totalCount, setGridState]);

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
      console.log("GO TO NEXT PAGE", { pageIndex });
      setGridState(s => ({ ...s, pageIndex: s.pageIndex + 1 }));
    }
  }, [canGoNextPage, setGridState]);

  const goToPreviousPage = React.useCallback(() => {
    if (canGoPreviousPage) {
      setGridState(s => ({ ...s, pageIndex: s.pageIndex - 1 }));
    }
  }, [canGoPreviousPage, setGridState]);

  const goToPage = React.useCallback(
    (pgIndex: number) => {
      if (pgIndex > 0 && pgIndex <= nbPages) {
        setGridState(s => ({ ...s, pageIndex: pgIndex }));
      }
    },
    [nbPages, setGridState]
  );

  const setData = React.useCallback(
    (nextData: T[], dataOptions?: ISetDataOptions) => {
      setGridState(s => {
        const nextState = { ...s };
        nextState.data = nextData;
        if (dataOptions) {
          nextState.totalCount = dataOptions.totalCount;
          nextState.pageIndex = dataOptions.pageIndex;
        }
        return nextState;
      });
    },
    [setGridState]
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

      setGridState(s => ({ ...s, sortKeys: nextSortKeys }));
    },
    [enableMultiSort, setGridState, sortKeys]
  );

  const setPageSize = React.useCallback(
    (size: number) => {
      setGridState(s => ({ ...s, pageSize: size }));
    },
    [setGridState]
  );

  const setGlobalFilter = React.useCallback(
    (filter: string) => {
      setGridState(s => ({ ...s, globalFilter: filter, pageIndex: 1 }));
    },
    [setGridState]
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

  const setColumns = React.useCallback((c: IColumn<T>[]) => {
    setGridState(s => ({ ...s, columns: c }));
  }, []);

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
    setColumns,
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
