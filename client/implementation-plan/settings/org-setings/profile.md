Definition of done:

-Table that shows the most important settings for a individual user
-Left side item (that is flex grow) describes the item on the right
-Right side actual value that you can edit
-When clicking inside the right text it turns to a input and is editable
-When clicking outside the box it automatically saves the contents

Entry point:

the entrypoint where all of this code will go is inside the /features/settings/profile folder. This is the entry component. The root file that es accessed via url is
/Users/maddoxsciuchetti/fixies-branch/client/src/routes/settings/profile.tsx

1. Reuse same table that is being used for the employee invite component
2. Display the following settings data (Get this data from: /user/v2) you may also need /v2/profile/photo to get current profile foto
   1. Display the display name
   2. Display the vorname and nachname (on two seperate rows)
   3. Display the email adress
   4. Profile Foto

Approach to updating information:

-Ensure zod validation when the user inputs values
-email should be verified with existing email schema
-displayname, firstname and lastname should be verified to have more than one character
-profile foto does not need validation because you can only update one image type to it (to my knowledge)
-Tie this update to one endpoint
-Define new endpoint e.g. POST /user/updateProfileInformation that updates this with this new information
-Set state of the the value on the right side to editable
-When the user clicks outside of the box the information gets saved and gets sent to the backend via the endpoint
-The ui optiistically updates itself.
-do not make this complicated. Keep the optimistic updates very slim and readable. Do not create long helper functions. If you decide to create a helper function make sure that it is very short.

Design:

Ensure that each row is the same and uses the component that e.g the other settings page already uses which is the table component
