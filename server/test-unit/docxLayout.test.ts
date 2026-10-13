import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

it("preserves Word layout across checkboxes, signature rows, tables, and page boundaries", async () => {
  const { stdout } = await promisify(execFile)(
    process.execPath,
    ["--import", "tsx", path.resolve(__dirname, "docxLayout.verify.ts")],
    { cwd: path.resolve(__dirname, ".."), timeout: 30000 },
  );
  expect(stdout).toContain("Paired checkbox/date row alignment passed");
  expect(stdout).toContain("Combined inline and tab signature geometry passed");
  expect(stdout).toContain(
    "Saved Word page boundaries and inline text/marks passed",
  );
}, 35000);
