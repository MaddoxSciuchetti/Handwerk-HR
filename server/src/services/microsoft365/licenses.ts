import { loadMicrosoft365Config } from "@/services/integrations/runtime";
import { microsoftGraphToken } from "@/services/microsoft365Account";
import { z } from "zod";

const subscriptions = z.object({
  value: z.array(
    z.object({
      skuId: z.string(),
      skuPartNumber: z.string(),
      appliesTo: z.string(),
      capabilityStatus: z.string(),
      consumedUnits: z.number().int().nonnegative(),
      prepaidUnits: z.object({ enabled: z.number().int().nonnegative() }),
    }),
  ),
});

export async function microsoft365LicenseAvailability(organizationId: string) {
  const unavailable = (error: string) => ({ available: null, error });
  try {
    const config = await loadMicrosoft365Config(organizationId);
    if (!config)
      return unavailable(
        "Bitte die Administration bitten, die Microsoft-Integration vollständig einzurichten.",
      );
    let authError =
      "Microsoft-Lizenzen konnten nicht geprüft werden. Bitte die Administration bitten, die Microsoft-Anmeldung zu prüfen.";
    const token = await microsoftGraphToken(config, (message) => {
      authError = message;
    });
    if (!token) return unavailable(authError);
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/subscribedSkus?$select=skuId,skuPartNumber,appliesTo,capabilityStatus,consumedUnits,prepaidUnits",
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (response.status === 403)
      return unavailable(
        "Bitte die Administration bitten, die Microsoft-Berechtigung LicenseAssignment.Read.All und die Administratorzustimmung zu prüfen.",
      );
    if (!response.ok)
      return unavailable(
        "Microsoft-Lizenzen konnten nicht geladen werden. Bitte erneut versuchen.",
      );
    const parsed = subscriptions.safeParse(await response.json());
    if (!parsed.success)
      return unavailable(
        "Microsoft hat keine gültigen Lizenzdaten geliefert. Bitte erneut versuchen.",
      );
    const sku = parsed.data.value.find(
      (item) => item.skuId.toLowerCase() === config.licenseSkuId.toLowerCase(),
    );
    if (!sku)
      return unavailable(
        "Die konfigurierte Microsoft-Lizenz wurde nicht gefunden. Bitte die Administration bitten, die Lizenz-SKU zu prüfen.",
      );
    return {
      available:
        sku.appliesTo === "User" && sku.capabilityStatus === "Enabled"
          ? Math.max(0, sku.prepaidUnits.enabled - sku.consumedUnits)
          : 0,
      occupied: sku.consumedUnits,
      skuPartNumber: sku.skuPartNumber,
      error: null,
    };
  } catch {
    return unavailable(
      "Microsoft-Lizenzen konnten nicht geladen werden. Bitte erneut versuchen.",
    );
  }
}
