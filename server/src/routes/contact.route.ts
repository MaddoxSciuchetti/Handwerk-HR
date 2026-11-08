import { postContactInquiryHandler } from "@/controllers/contact.controller";
import { Router } from "express";

const contactRoutes = Router();

contactRoutes.post("/inquiry", postContactInquiryHandler);

export default contactRoutes;
