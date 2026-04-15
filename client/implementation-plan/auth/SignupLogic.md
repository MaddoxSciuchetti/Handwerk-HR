Success Condition:

Expected UX:
The user should be able to Login normally into their account. User also has the option to create a organization.

Frontend:

Entry Point: Register.tsx

-User should be guided through a two step form
-First step involves the user adding the regular register details
-Here only displayname needs to be added (ensure naming is consistent)
-Ensure that this is include in the registerSchema z.displayName().min()
-Here also use the register schema that is already in place in the backend

-Second step involves the user entering the orgs data
-This will require a new zod schema
-Ensure to use the zod schema from the org that is already present in the backend (do not create a new one just import this one from auth.schemas.ts)

-The structure should be one entry OrgSignup Component
-State for keeping track if one 1st or 2nd page
-Depending on state render the user signup or org signup

Backend:

Endpoint: /v2/register/org POST
-current Zod validation at endpoint expects:
-email,
-password,
-userAgent,
-confirmpassword (that must match the other one),
-firstname
-lastname

-displayname should be included and marked as required in the registerSchema on the backend
