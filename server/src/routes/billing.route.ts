import {
    createBillingPortalSession,
    createCheckoutSession,
    getBillingSubscription,
    listBillingInvoices,
} from "@/controllers/billing.controller";
import { Router } from "express";

const billingRoutes = Router();

billingRoutes.get("/subscription", getBillingSubscription);
billingRoutes.get("/invoices", listBillingInvoices);
billingRoutes.post("/checkout", createCheckoutSession);
billingRoutes.post("/portal", createBillingPortalSession);

export default billingRoutes;
