# Offboarding requirements

## Rückgabe Computer/Tablet

- No automation

## Rückgabe PKW

- No automation

## Rückgabe Handy

- No automation



## Rückgabe Schlüssel / Transponder

- No automation



## Rückgabe Werkzeug (wenn unvollständig, was fehlt?)

- No automation



## Rückgabe Arbeitskleidung

- No automation



## Weiterleitung Mail eingerichtet (falls notwendig)

- The system can enable forwarding on the employee’s Microsoft 365 mailbox.
- Forwarding is only applied when the step is marked as necessary for that employee.
- The destination address is stored with the step.
- The step is complete when Microsoft 365 has accepted the forwarding rule, or when the engagement records that forwarding is not needed.



## Crewmeister Zugang sperren

- When the employee enters offboarding, the system deactivates or removes that person’s Crewmeister membership.
- The step is complete when Crewmeister confirms the access is gone.
- A retry does not fail because the membership is already gone.



## Infomail ans Team versendet

- The system sends the departure notice to the team through Microsoft 365.
- The step is complete when Microsoft 365 accepts the message.



## Arbeitszeugnis erstellt & verschickt

- A master reference letter is being stored on the contract

- When the employee’s engagement is in offboarding, the system fills that template and sends the letter.
- Employee data used in the letter comes from the employee record.
- The step is complete when the letter has been generated and the send is accepted.



## Engine4 Zugang sperren

- When the employee enters offboarding, the system disables that person’s ENGINE4 access.
- The step is complete when ENGINE4 confirms the access is disabled.
- A retry does not create a second change once access is already disabled.



## O365 Zugang sperren

- When the employee enters offboarding, the system blocks sign-in for that Microsoft 365 user.
- The mailbox is not deleted by this step. Forwarding, when needed, is the separate mail-forwarding step.
- The step is complete when Graph confirms sign-in is blocked.
- A retry does not fail because the account is already blocked.



## Easy Park entfernen

- No API 

