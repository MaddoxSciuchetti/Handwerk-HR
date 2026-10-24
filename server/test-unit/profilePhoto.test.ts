import type { Request, Response } from 'express';
import { getProfilePhoto } from '@/controllers/user.controller';
import { queryProfilePhoto } from '@/services/user.service';
import { generatePresignedUrl } from '@/config/aws';

jest.mock('@/config/aws', () => ({
    generatePresignedUrl: jest.fn(),
    uploadFileToS3: jest.fn(),
}));
jest.mock('@/lib/prisma', () => ({ prisma: {} }));
jest.mock('@/services/user.service', () => ({
    queryProfilePhoto: jest.fn(),
}));

it.each([null, { avatarUrl: null }, { avatarUrl: '' }, { avatarUrl: 'invalid' }])(
    'returns a successful empty photo when none is available: %p',
    async (photo) => {
        (queryProfilePhoto as jest.Mock).mockResolvedValue(photo);
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();
        await getProfilePhoto({ userId: 'user-1' } as Request, res as unknown as Response, next);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith('');
        expect(generatePresignedUrl).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    },
);

it('still signs an uploaded profile photo', async () => {
    (queryProfilePhoto as jest.Mock).mockResolvedValue({ avatarUrl: 'https://bucket.example/avatar.png' });
    (generatePresignedUrl as jest.Mock).mockResolvedValue('https://signed.example/avatar.png');
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await getProfilePhoto({ userId: 'user-1' } as Request, res as unknown as Response, next);
    expect(generatePresignedUrl).toHaveBeenCalledWith('avatar.png');
    expect(res.json).toHaveBeenCalledWith('https://signed.example/avatar.png');
    expect(next).not.toHaveBeenCalled();
});
