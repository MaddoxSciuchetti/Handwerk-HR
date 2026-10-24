import { microsoft365LicenseAvailability } from "./licenses";
import { loadMicrosoft365Config } from "@/services/integrations/runtime";
import { microsoftGraphToken } from "@/services/microsoft365Account";
jest.mock("@/services/integrations/runtime", () => ({
  loadMicrosoft365Config: jest.fn(),
}));
jest.mock("@/services/microsoft365Account", () => ({
  microsoftGraphToken: jest.fn(),
}));
const config = loadMicrosoft365Config as jest.Mock;
const token = microsoftGraphToken as jest.Mock;
const sku = {
  skuId: "sku",
  skuPartNumber: "BUSINESS",
  appliesTo: "User",
  capabilityStatus: "Enabled",
  consumedUnits: 7,
  prepaidUnits: { enabled: 10 },
};
let fetchMock: jest.SpyInstance;
beforeEach(() => {
  config.mockResolvedValue({ licenseSkuId: "SKU" });
  token.mockResolvedValue("token");
  fetchMock = jest
    .spyOn(global, "fetch")
    .mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ value: [sku] }),
    } as Response);
});
afterEach(() => jest.restoreAllMocks());
it("returns free seats for the configured SKU and organization", async () => {
  expect(await microsoft365LicenseAvailability("org")).toMatchObject({
    available: 3,
    error: null,
  });
  expect(config).toHaveBeenCalledWith("org");
});
it.each([
  { consumedUnits: 10 },
  { consumedUnits: 12 },
  { capabilityStatus: "Suspended" },
  { appliesTo: "Company" },
])("handles unavailable seats: %j", async (patch) => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ value: [{ ...sku, ...patch }] }),
  } as Response);
  expect(await microsoft365LicenseAvailability("org")).toMatchObject({
    available: 0,
    error: null,
  });
});
it("does not confuse an unknown SKU with zero seats", async () => {
  config.mockResolvedValue({ licenseSkuId: "other" });
  expect(await microsoft365LicenseAvailability("org")).toMatchObject({
    available: null,
    error: expect.stringContaining("nicht gefunden"),
  });
});
it("explains missing permissions", async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 403 } as Response);
  expect(await microsoft365LicenseAvailability("org")).toMatchObject({
    available: null,
    error: expect.stringContaining("LicenseAssignment.Read.All"),
  });
});
it("handles network failures", async () => {
  fetchMock.mockRejectedValue(new Error("offline"));
  expect(await microsoft365LicenseAvailability("org")).toMatchObject({
    available: null,
    error: expect.any(String),
  });
});
it("rejects malformed license data", async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ value: [{ ...sku, consumedUnits: null }] }),
  } as Response);
  expect(await microsoft365LicenseAvailability("org")).toMatchObject({
    available: null,
    error: expect.any(String),
  });
});
it("does not contact Microsoft without configuration", async () => {
  config.mockResolvedValue(null);
  expect(await microsoft365LicenseAvailability("org")).toMatchObject({
    available: null,
  });
  expect(fetchMock).not.toHaveBeenCalled();
});
