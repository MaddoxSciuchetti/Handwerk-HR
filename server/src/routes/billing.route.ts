import {
    createBillingPortalSession,
    createCheckoutSession,
    getBillingSubscription,
} from "@/controllers/billing.controller";
import { Router } from "express";

const billingRoutes = Router();

billingRoutes.get("/subscription", getBillingSubscription);
billingRoutes.post("/checkout", createCheckoutSession);
billingRoutes.post("/portal", createBillingPortalSession);

export default billingRoutes;
