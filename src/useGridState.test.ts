import { renderHook, act } from "@testing-library/react-hooks";
import { useGridState } from "./useGridState";
import { TestData } from "../test/testUtils";

test("Should store basic grid data", () => {
  const { result } = renderHook(() =>
    useGridState({
      data: TestData
    })
  );
  expect(result.current.data.length).toBe(100);
});

describe("Client mode", () => {
  it("Should navigate between pages correctly", () => {
    const { result } = renderHook(() =>
      useGridState({ data: TestData, pageSize: 5, serverMode: false })
    );
    expect(result.current.pageSize).toBe(5);
    expect(result.current.nbPages).toBe(20);
    expect(result.current.pageNumbers.length).toBe(20);

    const {
      nbPages,
      canGoPreviousPage,
      canGoNextPage,
      pageNumber
    } = result.current;

    expect(result.current.canGoPreviousPage).toBeFalsy();
    expect(result.current.canGoNextPage).toBeTruthy();
    expect(result.current.pageNumber).toBe(1);

    act(() => result.current.goToNextPage());
    expect(result.current.pageNumber).toBe(2);
    expect(result.current.page[0]).toBe(TestData[5]);

    act(() => result.current.goToPreviousPage());
    expect(result.current.page[0]).toBe(TestData[0]);

    act(() => result.current.goToPage(5));
    expect(result.current.page[0]).toBe(TestData[20]);

    act(() => result.current.goToPage(20));

    expect(result.current.canGoNextPage).toBeFalsy();
    expect(result.current.canGoPreviousPage).toBeTruthy();

    act(() => result.current.setPageSize(10));

    expect(result.current.pageNumber).toBe(10);
    expect(result.current.page.length).toBe(10);
  });

  it("Should sort data accordingly", () => {
    const data = [
      { id: 1, name: "z", age: 1 },
      { id: 2, name: "f", age: 12 },
      { id: 3, name: "d", age: 3 },
      { id: 4, name: "a", age: 4 },
      { id: 5, name: "a", age: 5 }
    ];

    const { result } = renderHook(() =>
      useGridState({ data: data, serverMode: false })
    );

    // data not sorted
    act(() => {
      result.current.toggleSort("name");
    });

    expect(result.current.sortKeys["name"]).toBeTruthy();
    expect(result.current.page[0].id).toBe(4);

    act(() => result.current.toggleSort("name"));
    expect(result.current.page[0].id).toBe(1);
  });

  it("Should handle multi sort", () => {
    const data = [
      { id: 1, name: "z", age: 1 },
      { id: 2, name: "f", age: 12 },
      { id: 3, name: "d", age: 3 },
      { id: 4, name: "a", age: 4 },
      { id: 5, name: "a", age: 5 }
    ];

    const { result } = renderHook(() =>
      useGridState({
        data: data,
        serverMode: false,
        enableMultiSort: true,
        columns: ["name"]
      })
    );

    // data not sorted
    act(() => {
      result.current.toggleSort("name");
    });
    act(() => {
      result.current.toggleSort("age", "DESC");
    });

    expect(result.current.sortKeys["name"]).toBeTruthy();
    expect(result.current.page[0].id).toBe(5);
    expect(result.current.page[1].id).toBe(4);

    expect(result.current.columns[0].sortInfo).toBe("ASC");

    act(() => {
      result.current.columns[0].toggleSort();
    });

    expect(result.current.columns[0].sortInfo).toBe("DESC");

    act(() => {
      result.current.setColumns(["age"]);
    });

    expect(result.current.columns[0].fieldName).toBe("age");
  });

  it("Should define default sort on table creation", () => {
    const { result } = renderHook(() =>
      useGridState({
        data: TestData,
        sortKeys: {
          name: "DESC",
          age: "ASC"
        },
        serverMode: false,
        enablePagination: false
      })
    );

    expect(result.current.sortKeys["name"]).toBe("DESC");
    expect(result.current.sortKeys["age"]).toBe("ASC");
    expect(result.current.sortKeysStrings).toContain("name|d");
    expect(result.current.sortKeysStrings).toContain("age");
  });

  it("should define only 1 page when pagination not enabled", () => {
    const { result } = renderHook(() =>
      useGridState({
        data: TestData,
        serverMode: false,
        enablePagination: false
      })
    );

    expect(result.current.page.length).toBe(TestData.length);
  });

  it("should set forceTake and forceSkip correctly", () => {
    const { result } = renderHook(() =>
      useGridState({
        data: TestData,
        serverMode: false,
        enablePagination: false,
        pageSize: 10
      })
    );

    expect(result.current.page.length).toBe(TestData.length);
    expect(result.current.skip).toBe(0);
    expect(result.current.take).toBe(10);

    act(() => result.current.goToPage(3));

    expect(result.current.skip).toBe(20);
    expect(result.current.take).toBe(10);
  });

  it("should filter the data when global filter is set", () => {
    const data = [
      { name: "jean", age: 18 },
      {
        name: "claude",
        age: 50
      },
      { name: "fred", age: 32 }
    ];

    const { result } = renderHook(() =>
      useGridState({
        data,
        serverMode: false
      })
    );

    expect(result.current.page.length).toBe(3);
    act(() => result.current.setGlobalFilter("jean"));

    expect(result.current.page.length).toBe(1);
    expect(result.current.page[0]).toBe(data[0]);
    act(() => result.current.setGlobalFilter("50"));

    expect(result.current.page.length).toBe(1);
    expect(result.current.page[0]).toBe(data[1]);

    act(() => result.current.setGlobalFilter("a"));
    expect(result.current.page.length).toBe(2);
  });
});

describe("Server mode", () => {
  it("Should set data as expected", () => {
    const { result } = renderHook(() =>
      useGridState({
        serverMode: true,
        pageSize: 100
      })
    );

    expect(result.current.page.length).toBe(0);

    act(() => {
      result.current.setData(TestData, { totalCount: 500 });
    });

    expect(result.current.page.length).toBe(100);
    expect(result.current.nbPages).toBe(5);
  });
});
