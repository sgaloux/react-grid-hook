import { testWorkingJsEnv } from "../src";

test("working", () => {
  const data = testWorkingJsEnv();
  expect(data).toBeTruthy();
});
