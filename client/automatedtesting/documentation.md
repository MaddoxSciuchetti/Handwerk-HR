Purpose of this document is to keep track of changing tests

Test Driven development for clearer intent

Changes Implemented

adds a new sidebar and a new provider. This changes the entire outcome of how the sidebar looks and how a user interacts with it. Integration and unit tests passes. End to end test fails.

What It Broke / How Test Behaviour Changed

E2E test did not work anymore.

e.g. The existing test failed because the return value of compareChoices() included a trailing \n character that the expected string did not account for. This caused the equality check to return false even though the logic was correct.

What I Did To Fix It

-The solution was to change how the test was written, as no longer the email was being displayed in the sidebar but the first name. The code need to change to adapt to the new sidebar integration and therefore render the correct firstname instead of the email (Change of outcome and of the functionality). The above changes made all tests pass.
Effort was low as only the expectation of what is visible had to change

-Commit 0a108a1 - 2991768 which

---

Decided to create my own components -> this let to me having to change the aria labels. My test managed this changes needed to be reflected in the test which managed to go well.

---

I decided to create a completely new table where i also removed how filteres were being applied. This made me need to change my tests again so that they adapt to the new functional requirements

---

Integrate breking changes into the new signup flow. A user can no longer signup with with normal required fields. The user now can only signup when creating a entire new org (this required more changes than intially thought (details regarding the implementation will follow)

---

automated tests did not work anymore when changing the overall sidebar layout ansd siwciehd how everything looks
