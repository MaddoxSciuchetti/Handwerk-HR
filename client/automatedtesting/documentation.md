Purpose of this document is to keep track of changing tests

Test Driven development for clearer intent

-Commit 0a108a1 which adds a new sidebar and a new provider. This changes the entire outcome of how the sidebar looks and how a user interacts with it. Integration and unit tests passes. End to end test fails.
-The solution was to change how the test was written. Effort was low as only the expectation of what is visible had to change
