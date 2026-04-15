Current status:

1. Table that fetches the current workers from the db. The endpoint for this is /worker. On success this returns the worker containing information

Implementation Steps:

-User creates worker at to "/worker" Endpoint POST
-Update types to match the new types that we have created for the worker (For reference use the Schema)
-Query invalidation happens
-Added worker shows in the table

Hints:

-Form that enables this is in @WorkerForm.tsx
-Ensure the resuable FormField component is being used

// Second implementation:

The user hovers over the item element.
The box shows up.
The user clicks inside this box and the box highlights full into blue (simple backround fill on click)
At the bottom of the screen a tooltip shows with containing actions the user can take 1. Delete the selected items (if it is more than one item the user can delete those) 2.
