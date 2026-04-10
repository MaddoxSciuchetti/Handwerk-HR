Decisions made in this project:

Render Deployement, Neon Database Provider, Godaddy website hosting
React framework for development
Tailwind for fast utitliy styling inline

Express backend -> understand http server structure

Notes from clean code:

test the core business functionality
Check code before you push it
DRY
keeping it simple
avoid comments and costrings

automated testing:

quicker feedback loop, saves manual work, unit tests show you examples of how a api endpoint is working, documents code, continious delivery

frontend testing (end to end, integration, unit tests)
selenium, puppeteer -> hit certain buttons that than take a screenshot of the result
interface testing with the dom

Reason example etc

After feedback:

-Make components resuable. There should not be one element inside it that is specific to the instance when it is being used. Use typescript for this.
Example:

-Use custom compound components to ensure maximum flexibility
-Always use a value as a key when mapping over a item. This prevents unessary rerenders (can confuse the dom)
-Ensure that no more than 6 props are being used for a component. If a component has more think about how you would refactor this

-always remove dead code we have git history in case it is needed
