import { BAD_REQUEST, OK } from "@/constants/http";
import appAssert from "@/utils/appAssert";
import catchErrors from "@/utils/catchErrors";
import {
  addDescriptionSentence,
  listDescriptionSentences,
} from "@/services/descriptionSentences.service";

export const getDescriptionSentences = catchErrors(async (req, res) => {
  appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
  return res.status(OK).json(await listDescriptionSentences(req.orgId));
});

export const createDescriptionSentence = catchErrors(async (req, res) => {
  appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
  return res
    .status(OK)
    .json(await addDescriptionSentence(req.orgId, req.body?.sentence));
});
