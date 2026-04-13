Requirements:

Some of the below implementations are already implemented. In that case it is important that you wire
the functionality up to the desired outcome that i am describing in the below text.
@client/src/features/settings/employees/Employees.tsx:21-33

Backend:

On button click the email gets sent to POST: "/org/invite"
-Endpoint checks (the endpoint already is there):
-Does the org exist in the db in the first place
-Checks if the email is already in the db
-Add another check that ensures the request is coming from the authorized owner (this means that the role should be Owner)
-This prevents any body except the owner inside the org to take changes on the database
-When checks pass it is being ensured that the member has a role (is the member the user wanting the link or who is this person)
-than the token is being generated
-the row inside the invidation table is being created containing the tokenHash
-invite url is being composed from the frontendurl and the raw token
-is sent

Frontend:

-The user types in the email
-On submission a toaster shows displaying success message

Flow of the user accepting the invite:

-The user clicks on the link
-Pre validation checks the status of the link and if it is still valid? GET /invites/:token
-Once this returns a 200 the signup page displays
-This signup page should use existing components from the other signup page but is inherently different
-Differences inlucde:
-User can enter their displayname
-Add display name in the zod validation for that endpoint
-Ensure that the same validation is also present in the frontend
-Once the signup button is clicked the following endpoint is hit:

- When the user signs up this endpoint is hit POST /invites/:token/accept
  -The user than gets signed up
  -Prompt the user with a sucess page that links to the login page
