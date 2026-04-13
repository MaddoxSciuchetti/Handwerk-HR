Definition of done:

Context:

In this project there are two levels. Issue levels and Engagement levels. Issue level describes the level that a issue can have (Aufgabe). Engagement level describes the progress level that the actual created worker has. We are going to focus in this implementation on the issue level (In the ui it will refer to Aufgaben because that is the german wording for it)

High level of what this feature should do:

-The owner of the company can create their own issue levels
-The owner can update those issue levels
-The owner can delete those issue levels
-Owner cannot delete all items - there must always be one issue level to choose from

Frontend requirements:

-uses same table component as the other components
-Inside the header of the table there is a primary button at the left with a input box (they are aligned left and not spread apart only with gap)
-The Statuses are being displayed in a row inside the table
-The Status name on the left with a icon infront of it
-You can hover over the status

Details:

Four rows are seeded by default when the org is created (this is being fetched from endpoint): POST /v2/register/org
Fetch those 4 issue levels using this endpoint: GET /org/statuses?entityType=issue
When hovering over item delete icon pops up to delete the status level at endpoint: DELETE org/statuses/:id
-This passes along the id of the clicked item and deletes it
-The id will be there from the intial fetched items that all have a id
-When the Hinzufügen Button level is added the new name of the status and create that status at POST org/statuses
-The user can also edit the status by clicking on top of it (use a state to controll if it is a text or if it is a input that is shown)
-When outside the box is clicked send the update to PATCH /org/statuses/:id
-Ensure with zod validation that the issue level has a name

Ensure that the above endpoints can only be authroized when the role is Owner. Not anyone else can make those updates.
