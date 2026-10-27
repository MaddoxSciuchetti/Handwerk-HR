import { postMailTemplate, putMailTemplateDetails } from './mailTemplate.controller';
import { createMailTemplate, updateMailTemplateDetails } from '@/services/mailTemplate';
jest.mock('@/services/mailTemplate', () => ({ createMailTemplate: jest.fn(), updateMailTemplateDetails: jest.fn() }));
it.each([false, true])('accepts an empty description when saving email template details (edit=%s)', async (edit) => {
    (createMailTemplate as jest.Mock).mockResolvedValue({ id: 'mail' });
    (updateMailTemplateDetails as jest.Mock).mockResolvedValue({ id: 'mail' });
    const req = { orgId: 'org', params: { id: 'mail' }, body: { name: 'Welcome', description: '' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await (edit ? putMailTemplateDetails : postMailTemplate)(req as any, res as any, next);
    expect(next).not.toHaveBeenCalled();
    expect(edit ? updateMailTemplateDetails : createMailTemplate).toHaveBeenCalledWith(...(edit ? ['org', 'mail', req.body] : ['org', req.body]));
    expect(res.status).toHaveBeenCalledWith(edit ? 200 : 201);
});
