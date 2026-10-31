# Clean code & testing — start here

If you want to add code to this project, have improvements to the README.md or for the overall code architecture, clone this repo, create a feature branch and push changes. Ensure that you look at the below listed files to get more context. Also ensure to fill out the pull request template on every pull request that you open. Pull request that do not contain the template will not be looked at and therefore not merged. Below is the template [template](/Users/maddoxsciuchetti/fixies-branch/.github/pull_request_template.md)

- High level style guide that will help you quickly write your first lines in this project [Style guide](style-guide.md)
- Clean code principles and how they are applied in the codebase. Ensure to follow these! [Principles](principles.md)
- Decisions made in this project [Decisions](decisions.md)

- Handling tests in this project [Tests](tests.md)
- CI/CD of this project [workflow](/Users/maddoxsciuchetti/fixies-branch/clean-code-testing/docs/cd.md)

### What is this project about?

This database manages the lifecycle of a handyman that is responsible for repairing heating, ventilation and air-conditioning systems at a hvac company. Due to turnover being high in the trades industry, companies frequently have to onboard and offboard their workers, each event taking a series of tasks (preparing contract, ordering car) that an office worker has to coordinate. This database tracks the workers, the lifecycle they are in and the tasks within each event.

The typical scale consists of 1-10 office workers, 5-50 trades people working with about 5 active engagements. A user may belong to multiple organizations as the organization has the possibility to hire a HR consultant that works on those tasks. There is overall a low concurrency OLTP workload during business hours which is also the only time when the OLTP workload is measurable.

### Implemented use cases

| Use case                                                                  | Implemented? |
| ------------------------------------------------------------------------- | ------------ |
| Users can register, verify email, and log in with persistent sessions     | Yes          |
| Users can reset their password using a one-time code                      | Yes          |
| A user can create an organization and becomes its first admin             | Yes          |
| A user can invite others to an organization with a role (admin or worker) | Yes          |
| A user can belong to multiple organizations                               | Yes          |
| New members default to user unless the invite specifies admin             | Yes          |
| Each organization has one subscription                                    | Yes          |
| The organization’s billing payment method stays in sync with Stripe       | Yes          |
| The app stores invoices consistent with Stripe                            | Yes          |
| A user can add workers to their organization                              | Yes          |
| A user can create engagements (onboarding, transfer, offboarding)         | Yes          |
| A worker can have multiple engagements over time                          | Yes          |
| Each engagement has a status and a responsible user                       | Yes          |
| A user can create issues on an engagement                                 | Yes          |
| Every issue has a required creator and an optional assignee               | Yes          |
| Users can comment on issues                                               | Yes          |
| Changes to issues are recorded in an audit trail                          | Yes          |
| Users get notified when assigned to an issue or when issue status changes | No           |
