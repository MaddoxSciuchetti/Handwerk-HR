This database manages the lifecycle of a handyman that is responsible for repairing heating, ventilation and air-conditioning systems at a hvac company. Due to turnover being high in the trades industry, companies frequently have to onboard and offboard their workers, each event taking a series of tasks (preparing contract, ordering car) that an office worker has to coordinate. This database tracks the workers, the lifecycle they are in and the tasks within each event.

The typical scale consists of 1-10 office workers, 5-50 trades people working with about 5 active engagements. A user may belong to multiple organizations as the organization has the possibility to hire a HR consultant that works on those tasks. There is overall a low concurrency OLTP workload during business hours which is also the only time when the OLTP workload is measurable.

| Requirement                                                                                                                       | Implemented?                     |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Users can register, verify their email, log in, and stay logged in across multiple devices.                                       | Yes                              |
| Users can reset their password via a one-time verification code.                                                                  | Yes                              |
| A user can create an organization. The creator becomes its first admin.                                                           | Yes                              |
| A user can invite other users to an organization, assigning them a role.                                                          | Yes                              |
| A user can belong to multiple organizations.                                                                                      | Yes                              |
| An admin role is automatically passed when a user creates an organization. Invited users automatically receive the role sub-user. | Yes                              |
| Each organization has exactly one subscription.                                                                                   | No — billing not implemented yet |
| An organization may have one payment method only.                                                                                 | No — billing not implemented yet |
| Invoices are generated against the active payment method.                                                                         | No — billing not implemented yet |
| A user can register a worker for their organization.                                                                              | Yes                              |
| A user can create an engagement for a worker, of type onboarding, transfer, or offboarding.                                       | Yes                              |
| A worker may have multiple engagements over their tenure.                                                                         | Yes                              |
| Each engagement has a status, for example todo, in-progress, completed, and a responsible user.                                   | Yes                              |
| A user can create issues under an engagement.                                                                                     | Yes                              |
| Issues have a creator, mandatory, and an optional assignee.                                                                       | Yes                              |
| A user can comment on issues; comments support threaded replies.                                                                  | Yes                              |
| Issues and engagements track audit logs of all changes for accountability.                                                        | Yes                              |
| Users receive notifications when assigned to an issue or when relevant status changes occur.                                      | Yes                              |
