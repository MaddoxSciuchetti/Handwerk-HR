import type { Request, Response } from "express";
import { previewMasterPdf } from "@/controllers/documentMaster.controller";
import { generateDocumentPdf } from "@/services/documentPdf";
import { getDocumentMaster } from "@/services/documentMaster.service";
import { fromSegments, currentDocumentDate } from "../../shared/document";

jest.mock("@/services/documentPdf", () => ({ generateDocumentPdf: jest.fn() }));
jest.mock("@/services/documentMaster.service", () => ({
  getDocumentMaster: jest.fn(),
}));
jest.mock("@/services/importStyledDocument", () => ({}));
jest.mock("@/services/microsoft365/sharePointDocuments", () => ({}));
jest.mock("@/services/microsoftTeams/connection", () => ({
  TeamsError: class extends Error {},
}));
jest.mock("@/services/documentFonts", () => ({}));
jest.mock("@/config/aws", () => ({}));
jest.mock("@/services/styledDocument", () => ({
  parseStyledDocument: (document: unknown) => document,
}));

it.each(["GET", "POST"])(
  "%s preview omits empty input labels and preserves automatic dates",
  async (method) => {
    const document = fromSegments([
      { type: "input", key: "salutation", label: "Anrede" },
      { type: "input", key: "name", label: "VornameNachname" },
      {
        type: "input",
        key: "description",
        label: "Beschreibung",
        fieldType: "points",
      },
      { type: "input", key: "choice", label: "Auswahl", fieldType: "checkbox" },
      {
        type: "input",
        key: "date",
        label: "Datum",
        fieldType: "date",
        dateMode: "today",
      },
    ]);
    const bytes = Buffer.from("%PDF-preview");
    (getDocumentMaster as jest.Mock).mockResolvedValue({ document });
    (generateDocumentPdf as jest.Mock).mockResolvedValue({ bytes });
    const req = {
      method,
      orgId: "org",
      params: { id: "master" },
      body: { document },
    } as unknown as Request;
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;
    const next = jest.fn();
    await previewMasterPdf(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(generateDocumentPdf).toHaveBeenLastCalledWith(document, {
      date: currentDocumentDate(),
    });
    expect(res.send).toHaveBeenCalledWith(bytes);
  },
);
