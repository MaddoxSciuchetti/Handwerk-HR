# Onboarding requirements

## Arbeitsvertrag unterschrieben zurück + Dokumente BSB + BSB Fibel

- Several master contracts can be stored
- An engagement can carry one or more master contracts
- A contract can be of status "draft" or "signed"
- Changes in master contract propagate over to child contracts only when in "draft"
- Changes in child contract via input boxes do not propagate upwards
- Changes in contracts can be made via hand
- When a trigger goes off (that the email with the fragebogen returned -> 1. Data gets automatically inputted into the child contract boxes under the respective engagement 2. If data already exists ask to overwrite or not
- The contract can be sent out once all fields are filled out
- Another trigger listens to when a email comes in with the filled out contract
- The conract is being showed embeeded into the page and user confirms
- The step is complete when the signed contract and the required documents are back and attached to the employee.
- The successfull confirmation of the user that the signed contract has arrived leads to the unlock of all the other onboarding steps apart from Personalfragebogen which is also inside temporary



## Personalfragebogen inkl. notwendiger Dokumente erhalten

- The questionnaire can be created in the product and sent digitally to the new tradesperson.
- Sending a questionaire to the person creates a temporary engagement(zu erwaraten something like this)
- The form collects the data the later steps need, including the values that fill the contract fields.
- When the completed form comes back, the answers are written onto the employee record. A person does not retype them.
- Required supporting documents come back with the form and are stored on the employee.



## Arbeitsmaterialien bereitgestellt (Bestellung Werkzeug)

- The system can talk to more than one material dealer.
- Context about what this person is doing etc is stored under the engagement
- It receives the tradesperson’s work and the materials that work needs, and uses that context to build the list.
- It compares prices across the connected dealers.
- It assembles one order from that comparison.
- The step is complete when the order has been placed and the materials are recorded as provided.
- A material list gets stored under this engagement



## Arbeitsplatz eingerichtet

- No Automation

## Software-Zugänge (Engine, Office 365) Mailadresse

- The trigger is confirmation of the user that the contract is signed , which means the employee will join the company
- The system creates the ENGINE4 user on the company’s ENGINE4 instance.
- The system creates the Microsoft 365 user and assigns the license that includes mail and Teams.
- The new mail address is stored on the employee.

## Computer eingerichtet (ConPro)

- No Automation 

## Handy + Tablet einrichten

- No Automation 

## Schlüssel / Transponder übergeben

- No automation 

## Werkzeug QR-Codes registrieren

- No automation



## Auto bereitstellen

- No automation



## Arbeitskleidung

- The system orders the employee’s workwear through the Strauss procurement connection.
- Sizes and items come from employee data, including the Personalfragebogen where those values exist.
- The step is complete when the order is accepted by Strauss and stored on the employee.



## Visitenkarten

- No automation 



## Willkommensmail an das Team

- After the employee’s Microsoft 365 account exists, the system sends the welcome mail to the team.
- The mail is sent through Microsoft 365, not through a separate mail provider.
- The step is complete when Microsoft 365 accepts the message.
- This is done at about 8am in the morning after the day the contract has been signed



## Einarbeitungsplan erstellt

- No automation 



## "Easy Park" einrichten

- Easy park does not provide a public REST api. 
- B2B customers can create a contract that allows them special access (question is what this includes)



## Telefonnummer kaufen für einen neuen Mitarbeiter

- Telekom does not provide a public REST api
- 

