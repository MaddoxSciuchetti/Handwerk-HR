import { STRIPE_SECRET_KEY } from "@/constants/env";
import Stripe from "stripe";

export const stripe = new Stripe(STRIPE_SECRET_KEY);
