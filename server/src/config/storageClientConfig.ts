import type { S3ClientConfig } from "@aws-sdk/client-s3";

export function storageClientConfig(
    env: NodeJS.ProcessEnv = process.env,
): S3ClientConfig {
    const accessKeyId = env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = env.AWS_SECRET_ACCESS_KEY?.trim();
    const sessionToken = env.AWS_SESSION_TOKEN?.trim();

    if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
        throw new Error(
            "S3 configuration requires both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or neither when using an AWS profile/IAM role.",
        );
    }

    return {
        region: env.AWS_REGION,
        ...(accessKeyId && secretAccessKey
            ? {
                  credentials: {
                      accessKeyId,
                      secretAccessKey,
                      ...(sessionToken ? { sessionToken } : {}),
                  },
              }
            : {}),
    };
}
