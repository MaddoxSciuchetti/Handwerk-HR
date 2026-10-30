import { printEmploymentContract } from '@/controllers/contractPrint.controller';
import { getEngagementContract } from '@/services/employmentContract.service';
import { generateDocumentPdf } from '@/services/documentPdf';
import { Request, Response } from 'express';

jest.mock('@/services/employmentContract.service', () => ({ getEngagementContract: jest.fn() }));
jest.mock('@/services/documentPdf', () => ({ generateDocumentPdf: jest.fn() }));

const request = { orgId: 'org', params: { workerId: 'worker', engagementId: 'engagement' } } as unknown as Request;
function response() {
  return { setHeader: jest.fn(), type: jest.fn().mockReturnThis(), send: jest.fn() } as unknown as Response;
}

it('renders the saved contract in organization scope without preparing another stored PDF', async () => {
  const contract = { document: { version: 1 }, values: { name: 'Anna' }, sentAt: null, status: 'draft' };
  jest.mocked(getEngagementContract).mockResolvedValue(contract as never);
  const bytes = Buffer.from('%PDF');
  jest.mocked(generateDocumentPdf).mockResolvedValue({ bytes } as never);
  const res = response();
  await printEmploymentContract(request, res, jest.fn());
  expect(getEngagementContract).toHaveBeenCalledWith({ organizationId: 'org', workerId: 'worker', engagementId: 'engagement' });
  expect(generateDocumentPdf).toHaveBeenCalledWith(contract.document, contract.values);
  expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'inline; filename="Arbeitsvertrag.pdf"');
  expect(res.send).toHaveBeenCalledWith(bytes);
});

it('does not regenerate a sent contract in place of its stored PDF', async () => {
  jest.mocked(getEngagementContract).mockResolvedValue({ sentAt: '2026-10-01', status: 'ready' } as never);
  const next = jest.fn();
  await printEmploymentContract(request, response(), next);
  expect(generateDocumentPdf).not.toHaveBeenCalled();
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Bitte drucken Sie das gespeicherte Vertrags-PDF.' }));
});

it('handles a missing contract without generating a PDF', async () => {
  jest.mocked(getEngagementContract).mockResolvedValue(null);
  const next = jest.fn();
  await printEmploymentContract(request, response(), next);
  expect(generateDocumentPdf).not.toHaveBeenCalled();
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Vertrag nicht gefunden.' }));
});
