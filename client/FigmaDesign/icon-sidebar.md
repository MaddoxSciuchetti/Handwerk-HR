ensure that the feedback item is at the bottom of the sidebar.

Add the following functionality:

When the sidebar collapse button is clicked the sidebar should only collapse until its icons are visible (the sidebar under no circumstance can be gone gone).
Visible should remain the feedback icon, mitarbeiter icon, aufgaben icon , handwerker icon and the profile avatar. Everything else is not there anymore.
Click functionality still works by clicking on the icon or on the profile.

Implementation Hypothesis:1

Add second sidebar state that used the resuable components that are already built. This displays the state where there are only the icons and the avatar.
Click functionality stays same. When the sidebar toggle is clicked it only ever goes back to the icons. When hovering over the icon a tooltip should be shown
that that contains the text that has been removed (this text can be get from the const). It should be small, have primary color background and white text
