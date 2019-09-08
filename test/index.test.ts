import { renderHook, act } from "@testing-library/react-hooks";
import { useTableState } from "../src/useTableState";

test("Should store basic grid data", () => {
  const { result } = renderHook(() =>
    useTableState({
      data: [{ a: 1 }]
    })
  );

  expect(result.current.data.length).toBe(1);
});
