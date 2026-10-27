import { defaultQuestionnaireSender, stagingOnboardingMail } from '@/services/questionnaireSender';
jest.mock('@/constants/env', () => ({ EMAIL_SENDER: 'hello@example.test', FRONTENDURL: 'https://production.example.test' }));
const flags = jest.requireMock('@/constants/env');
const originalEnv = { ...process.env };
afterEach(() => { process.env = { ...originalEnv }; flags.FRONTENDURL = 'https://production.example.test'; });
it('keeps production sender selection and Microsoft delivery', () => {
    process.env.NODE_ENV = 'production'; delete process.env.APP_ENV; delete process.env.RENDER_SERVICE_NAME;
    expect(defaultQuestionnaireSender()).toBeNull();
    expect(stagingOnboardingMail()).toBe(false);
});
it.each(['APP_ENV', 'NODE_ENV'])('uses Resend when %s identifies staging', (key) => {
    process.env[key] = 'staging';
    expect(defaultQuestionnaireSender()).toBe('hello@example.test');
    expect(stagingOnboardingMail()).toBe(true);
});
it('recognizes staging even with NODE_ENV=production', () => {
    process.env.NODE_ENV = 'production'; flags.FRONTENDURL = 'https://bsb-onboarding-frontend-development.onrender.com/';
    expect(defaultQuestionnaireSender()).toBe('hello@example.test');
});
it('recognizes the staging Render service', () => {
    process.env.RENDER_SERVICE_NAME = 'BSB-Onboarding-Backend-Development'; expect(defaultQuestionnaireSender()).toBe('hello@example.test');
});
