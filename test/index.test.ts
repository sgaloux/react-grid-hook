import { renderHook, act } from "@testing-library/react-hooks";
import { useTableState } from "../src/useTableState";
import { TestData } from "./testUtils";

test("Should store basic grid data", () => {
  const { result } = renderHook(() =>
    useTableState({
      data: TestData
    })
  );
  expect(result.current.data.length).toBe(100);
});

describe("Client mode", () => {
  it("Should generate pages number accordingly", () => {
    const { result } = renderHook(() =>
      useTableState({ data: TestData, pageSize: 5, serverMode: false })
    );
    expect(result.current.pageSize).toBe(5);
    expect(result.current.nbPages).toBe(20);
    expect(result.current.pageNumbers.length).toBe(20);

    act(() => result.current.goToNextPage());

    expect(result.current.page[0]).toBe(TestData[5]);

    act(() => result.current.goToPreviousPage());
    expect(result.current.page[0]).toBe(TestData[0]);

    act(() => result.current.goToPage(5));
    expect(result.current.page[0]).toBe(TestData[20]);
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
      useTableState({ data: data, serverMode: false })
    );

    // data not sorted
    act(() => {
      result.current.toggleSort("name");
    });

    expect(result.current.sortKeys["name"]).toBeTruthy();
    expect(result.current.page[0].id).toBe(4);
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
      useTableState({ data: data, serverMode: false, enableMultiSort: true })
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
  });
});

describe("Server mode", () => {
  it("Should set data as expected", () => {
    const { result } = renderHook(() =>
      useTableState({
        serverMode: true
      })
    );

    expect(result.current.page.length).toBe(0);

    act(() => {
      result.current.setData(TestData);
    });

    expect(result.current.page.length).toBe(100);
  });
});
