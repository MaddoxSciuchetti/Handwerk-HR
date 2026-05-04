process.env.NODE_ENV ??= "test";
process.env.STRIPE_SECRET_KEY ??= "sk_test_jest_dummy_key_for_webhook_tests";
process.env.STRIPE_WEBHOOK_SECRET ??=
    "whsec_jest_webhook_secret_value_min_length_ok";
process.env.FRONTEND_URL ??= "http://localhost:5173";
process.env.APP_ORIGIN ??= "http://localhost:5173";
process.env.JWT_SECRET ??= "jest_jwt_secret_min_length_ok";
process.env.JWT_REFRESH_SECRET ??= "jest_refresh_secret_min_length_ok";
process.env.EMAIL_SENDER ??= "test@example.com";
process.env.RESEND_API_KEY ??= "jest_resend";
process.env.DATABASE_URL ??=
    "postgresql://jest:jest@localhost:5432/jest?schema=public";
