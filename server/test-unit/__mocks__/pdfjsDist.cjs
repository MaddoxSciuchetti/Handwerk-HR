/** Jest stand-in for pdfjs-dist ESM (import.meta breaks CJS Jest). */
module.exports = {
  getDocument: jest.fn(),
  OPS: {},
};
