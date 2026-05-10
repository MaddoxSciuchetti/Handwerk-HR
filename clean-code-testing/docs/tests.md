# Tests

Before pushing changes ensure that you have

1. Written a test for this new feature
2. Ran the test on this feature
3. Ran jest coverage to see if the changes you did, did not worsen the coverage of the codebase

client:

server:

`"coverage:webhook-handler": "jest --coverage --collectCoverageFrom=src/controllers/stripeWebhook.controller.ts --collectCoverageFrom=src/services/stripe-webhook/intent-handlers/CheckoutSessionCompleted.ts",`

Below is an example of a test coverage result before implementing a refactor and after implementing a refactor. The refacotr could only be safely made due to extensive testing before ensuring that the refactor did not change the functionality of the refactored code

## Before

![Before](before.png)

## After

![After](<Bildschirmfoto 2026-05-08 um 19.18.44.png>)
