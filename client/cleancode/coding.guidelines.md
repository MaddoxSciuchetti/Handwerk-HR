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

-always move a mutation inside a hook together with react hook form.

---

Major functional refactor in the login component. I did this because my login logic changed in terms of that it was not only a user login and signup but a login, a login over a link, a org signup. My tests continiued to pass after this change.

---

Do not use the normal button html element. Also do not use complicated state logic when not necessary. This means you can change the state with using the same state setter function e.g. setting it to false than do this instead of creating a new state that closes the other state.

---

Do not use ternary operators at your whim. Use them specifcally when they are need to express the logic that you want to express. Do not use it for simple things that can be done without the ternary operator
