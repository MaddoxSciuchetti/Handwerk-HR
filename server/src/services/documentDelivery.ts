export type PdfAttachment = {
    filename: string;
    content: Buffer;
    contentType: string;
};
/** A definitive provider rejection: unlike a timeout, retrying is safe. */
export class DeliveryRejected extends Error {}
