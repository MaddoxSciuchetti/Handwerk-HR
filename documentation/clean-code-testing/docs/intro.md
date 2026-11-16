# Clean code & testing — start here

If you want to add code to this project, improve the README, or change architecture, clone this repo, create a feature branch, and push changes. Read the files below first. Fill out [`.github/pull_request_template.md`](../../../.github/pull_request_template.md) on every pull request. PRs without the template are not reviewed or merged.

- High-level style guide for first contributions: [Style guide](style-guide.md)
- Clean-code principles with live examples: [Principles](principles.md)
- Demo map principle → file (for walkthroughs): [Compliance walkthrough](compliance-walkthrough.md)
- Decisions made in this project: [Decisions](decisions.md)
- Tests: [Tests](tests.md)
- CI/CD: [CI/CD](ci.cd.md)

### What is this project about?

This database manages the lifecycle of a handyman that is responsible for repairing heating, ventilation and air-conditioning systems at a HVAC company. Due to turnover being high in the trades industry, companies frequently have to onboard and offboard their workers, each event taking a series of tasks (preparing contract, ordering car) that an office worker has to coordinate. This database tracks the workers, the lifecycle they are in and the tasks within each event.

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
