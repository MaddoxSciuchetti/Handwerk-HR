What you need for this implementation:

Server.ts endpoint that has /template and all of its sub routes

Requirements:

-Owner should be able to create a tempalte and give it a name
-This name appears in the tabe
-He can edit the name of this template

How the frontend should look like

-There is a table (the one that is being used for the settings page)
-It contains the same Hinzufüge Input pair as the isse and engagement page have
-The row is similiar to all the othes it contains:
-A growing flex item on the left
-The hover delete icon on the right hand side of the row
-When clicking on the actual name there is again a state condition that creates a input box where
the user can type in the new name for the template

Walk through of the functionalities:

-Creates template: at POST /template/
-Delete Template at POST /template/:id
-Fetches Template at GET /template/
-updates Template name at PUT /template/:id (this endpoint i do think does not exist)

Advanced functionality:

Requirements:

-Owner should be able to click on the template
-When this happens a new page opens
-page shows all tasks created for this template
-Owner can delete tasks, update, create and edit tasks
-Owner can go back with a simple back button

How the frontend should look like:

-Same Table component as the others used
-Display of the actual tasks in a row
-Table header consists of left growing flex item say task Name and a plus icon on the right
-When plus icon is clicked a sidebar should open
-This sidebar contains the following fields
-Responsibility of the template task
-The priority of the task upon first creation
-One can hover over the actual template tasks
-Two icons popup
-Delete or Edit icon
-If edit than show the same sidebar where the template task can be edited
-If Delete than the template task is being directly deleted

Walk through of the functionalities:

-Creates template task: POST /template/:templateId/task (Plus button in the top right)
-Gets the template task GET /template/templateId/tasks (When on the page)
-Updates the template task PUT /template/task/:id
-Delete the template task at DELETE /template/:id
