# Tests

Before pushing a new test ensure that you have run the jest test coverage command. Below is an example of how this test currently runs on a specified file:

`"coverage:webhook-handler": "jest --coverage --collectCoverageFrom=src/controllers/stripeWebhook.controller.ts --collectCoverageFrom=src/services/stripe-webhook/intent-handlers/CheckoutSessionCompleted.ts",`

This is to ensure that no new changes have dramatically worse test coverage than before. Also ensure that you run tests every once in a while.
Below shows the before test coverage result and the after test coverage result.

## Before

![Before](before.png)

## After

![After](<Bildschirmfoto 2026-05-08 um 19.18.44.png>)
