# OutlookPilot implementation tasks

Use this queue to implement the ten milestones in [plan.md](plan.md). The planner assigns and reviews work. A worker implements one numbered task at a time. An **operator** supplies the target device, credentials, consent and test mailbox for live checks. Check off tasks only after their evidence is available.

## How to take a task

1. The planner picks the first unchecked task whose prerequisites are ready. Within a section, assume the preceding tasks are prerequisites unless stated otherwise. The offline bootstrap and simulated reads can start while live setup is pending. Use synthetic messages in CI.
2. Give the worker the task ID, the merged base commit, the nearest existing code and test paths, and the acceptance example below. On a fresh repository the first worker establishes these paths. Later workers reuse them. Read [AGENTS.md](AGENTS.md) and the corresponding numbered section of the plan.
3. Implement only the named behavior on a descriptive English branch. For a feature, add a failing behavioral test, observe the expected failure, implement the change, and run the test suite in CI. Mock Graph, time or the identity provider at their boundaries when useful. Use real SQLite and separate processes for persistence and concurrency checks.
4. If a prerequisite is missing or two contracts disagree, return the exact missing input or conflicting examples to the planner. Keep unresolved architecture choices with the planner. Never substitute a mock result for live acceptance.
5. Open a PR to main with the task ID, changed behavior, test command and result, and anything the next worker needs. Mark the task complete in that PR when its check passes. The user merges. Clean up your branch after merge.

Example first assignment: **B1**. Start from the repository root, create the TypeScript toolchain, and demonstrate a clean install and build. Stop before adding the MCP server. For **B3**, supply the resulting CLI entry path and the CI test command in the handoff.

## 1. Target environment and fixtures

- [ ] **A1 · Record the live target (operator).** Supply OS, MCP client/version and account type. Identify the OS credential store and whether the agent can access the review terminal or profile files. Record the trust assumption for human approval.
- [ ] **A2 · Register the desktop app (operator).** Use a public client, personal and organizational accounts, and a loopback redirect. Confirm the client ID and redirect are available locally and record whether tenant admin consent is needed.
- [ ] **A3 · Prepare repeatable mailbox data (operator).** In a dedicated mailbox create a child folder, one message to reply to and three distinct newsletter messages. Identify a controlled recipient. Verify the starting positions in Outlook and retain a reset recipe without real addresses in Git.

## 2. Local process and CI

- [x] **B1 · Bootstrap TypeScript.** Pin a supported Node LTS, commit a lockfile and add build, type-check and test commands. From a clean checkout install locked dependencies and run all three commands.
- [x] **B2 · Wire CI.** Run those commands on pushes and PRs. Verify a failing test makes the job fail on the branch and that the final revision passes.
- [x] **B3 · Start MCP over stdio.** Register the CLI entry point and use the official SDK for `outlookpilot serve`. A process test starts the built binary, initializes MCP, lists tools and exits cleanly. Any diagnostics go to stderr.
- [ ] **B4 · Connect the target client (operator; needs A1 and B3).** Provide a minimal example client configuration. Confirm that the real client launches the built entry point and lists tools.

## 3. Authentication and account binding

- [ ] **C1 · Interactive login.** Connect the login command to MSAL Node browser login with PKCE and the registered loopback redirect. An identity-provider test double verifies the initial delegated mail scope is `Mail.Read` and denied consent produces an actionable error.
- [ ] **C2 · Share the protected cache.** Use the target OS credential backend and bind the profile to the selected account and tenant. A second process can select the same account. A missing backend reports an error without persisting plaintext credentials.
- [ ] **C3 · Acquire a token silently.** Use the bound account to call the Graph v1.0 inbox endpoint under `/me`. Test a successful response, a mismatched account, and a required re-login. Only mailbox data or a sanitized error reaches callers.
- [ ] **C4 · Log out.** Remove the bound account from the cache and clear its profile binding. A fresh process now requests login. Open-plan invalidation is added in F5.
- [ ] **C5 · Verify the live login (operator; needs A1–A3).** Log in on the target device, restart the process, read the inbox and log out. Record whether silent access succeeded before logout and required login afterwards. Resolve live identity failures before taking on write features.

## 4. Reading mail

- [x] **D1 · List folders.** Expose `list_folders` for root and child folders. Against a simulated Graph response, a parent ID returns the expected child ID and display name. Include Archive and Deleted Items as selectable destinations.
- [ ] **D2 · Search one page.** Expose `search_mail` with documented supported queries and folder filters. Return at most 25 previews by default. Request immutable message IDs. Reject unsupported filter combinations with a useful error.
- [ ] **D3 · Page results.** Add opaque cursors to search and folder listing. Test two distinct pages and reject an altered cursor or one reused with another account or query. Follow server-held Graph continuation URLs only.
- [ ] **D4 · Read one message.** Expose `read_mail` by immutable ID. Return bounded text, a truncation indicator and a useful missing-message error. A fixture containing HTML, an external image and an instruction yields inert text with no external fetch or mailbox mutation.
- [ ] **D5 · Handle read throttling.** Exercise a Graph read that receives 429 followed by success. Honor Retry-After and cap attempts under repeated throttling. Restrict this retry policy to reads.
- [ ] **D6 · Verify live reads (operator; needs B4, C5).** Find a child folder, retrieve two short pages and read the selected fixture. Verify the original folder and read status in Outlook.

## 5. Drafts

- [ ] **E1 · Enable writing.** Request delegated `Mail.ReadWrite` when the user enables drafts and moves. Verify any denied consent leaves read access usable and does not request `Mail.Send`.
- [ ] **E2 · Create a new draft.** Expose `create_draft` with validated recipients, subject and body. Verify the stored draft ID is returned and no send endpoint is called.
- [ ] **E3 · Create a reply draft.** Use Graph createReply for the selected message and populate the intended reply text. Verify the reply binds to that message and returns the saved draft ID.
- [ ] **E4 · Handle interrupted draft writes.** Inject a timeout after Graph accepts creation. Report the uncertain outcome and never replay creation. If a subsequent edit of a known reply draft fails, report its existing ID.
- [ ] **E5 · Verify both drafts (operator).** Open both in Outlook and check recipients, editability, body and reply conversation. Verify this works without send permission.

## 6. Local approval and execution state

- [ ] **F1 · Persist a plan.** Add the SQLite schema for account, action, IDs, observed versions, expiry and item outcomes. A round trip across two processes preserves these fields without storing mail bodies.
- [ ] **F2 · Implement terminal review decisions.** Accept explicit approval or rejection only from the local review command. Exercise both paths with a synthetic plan. Verify MCP exposes no approval tool. Concrete send and move previews arrive in G2 and H2 before those actions are enabled.
- [ ] **F3 · Claim an approved plan.** Use a conditional database update bound to account, action, approval and expiry. With a fake clock reject pending, rejected, wrong-account, wrong-action and expired plans. The approval window is 15 minutes.
- [ ] **F4 · Verify concurrent claims.** Race two separate processes against one approved plan in a temporary database. Exactly one obtains the execution claim. The other gets the existing operation state.
- [ ] **F5 · Invalidate approvals on logout.** Extend C4 so a previously approved pending operation cannot run after logout and re-login.
- [ ] **F6 · Expose operation status.** Implement `get_operation` for the bound account. Restart and retrieve a synthetic operation with one success and one conflict. Another account cannot retrieve it.

## 7. Send an approved draft

- [ ] **G1 · Snapshot an eligible draft.** Expose `plan_send` for a saved plain-text draft without attachments. Bind its account, ID, changeKey and digest of the reviewed content, including To/Cc/Bcc, subject and body. Test rejection of unsupported drafts.
- [ ] **G2 · Render send review.** Extend terminal review to show sender, all recipients, subject and full text fetched from Graph. Refuse approval if the snapshot changed. Test a Bcc change and a long body.
- [ ] **G3 · Enable sending.** Add explicit opt-in for delegated `Mail.Send`. Verify draft-only profiles cannot execute a send.
- [ ] **G4 · Execute a reviewed send.** Implement `send_draft`: claim the approved plan, re-read the draft and compare its snapshot, persist the attempt, then send. A recipient change yields a conflict and zero sends. A Graph 202 yields “accepted for sending.”
- [ ] **G5 · Recover an uncertain send.** Interrupt after Graph receives the request but before local success is recorded. After restart an uncertain attempt stays unknown. Repeating the tool call causes zero further sends.
- [ ] **G6 · Confirm live delivery (operator).** Approve a test draft and change its recipient in Outlook. Verify execution rejects it. Create a fresh plan for a controlled recipient, approve and send. Verify arrival separately from Graph acceptance.

## 8. Move selected messages

- [ ] **H1 · Build a cleanup plan.** Expose `plan_cleanup` for explicit immutable IDs and an existing destination. Deduplicate, reject more than 100 distinct IDs and snapshot each version and original folder. Verify the boundary with 100 and 101 IDs.
- [ ] **H2 · Render cleanup review.** Show account, destination, count and the entire inspectable selection in the terminal. Validate versions when showing the review. Test two similar subjects with different IDs.
- [ ] **H3 · Execute one move.** Implement the single-item path of `apply_cleanup` using an approved claim. Recheck version and folder, persist the attempt, then move. Verify changed or missing items receive individual results. Cleanup to Deleted Items uses a move.
- [ ] **H4 · Process a fixed selection.** Extend execution to all approved items. With three planned IDs, one manually moved ID and a fourth newly arrived mail, exactly two Graph moves occur. Repeating the completed operation returns its stored results.
- [ ] **H5 · Prepare a reversal.** Use recorded source folders to propose new move plans for successful items. Verify restoring a moved item requires fresh approval and uses its current version.
- [ ] **H6 · Verify live destinations (operator).** Run H4 with test messages, then move a fixture to a custom folder and another to Deleted Items. Reverse one approved move and check the resulting folders in Outlook.

## 9. Recovery and retained data

- [ ] **I1 · Reconcile interrupted moves.** Kill the process between the Graph move and local success. On restart locate the immutable ID and compare its folder with the plan. An item already at the destination completes without another move. An ambiguous item requires review.
- [ ] **I2 · Resume remaining items.** Repeat I1 mid-plan. Reconcile started items and finish unstarted items for the same execution. Verify one result per approved ID and no repeated successful move.
- [ ] **I3 · Expire old history.** Purge completed operations after 30 days. With a fake clock verify old completed rows are removed while active operations and recent history remain.
- [ ] **I4 · Protect local data.** Restrict profile access to the OS user. Exercise success and Graph error paths using recognizable synthetic tokens, addresses, subjects and bodies. Verify these markers are absent from logs and SQLite.

## 10. Installation and acceptance

- [ ] **J1 · Write the operator walkthrough.** Cover clean install, Microsoft registration, login, client configuration, review, status and logout. Document cloud-model exposure of retrieved mail and the remaining race between the final draft check and Graph send.
- [ ] **J2 · Test Outlook.com (operator).** From a fresh profile use J1 to find and read mail, draft and send a reviewed reply, then move selected newsletters. Record the commit, platform, client version, date and observed outcomes.
- [ ] **J3 · Test Microsoft 365 (operator).** Repeat J2 for an Exchange Online account. Record tenant consent restrictions or missing access as open items.
- [ ] **J4 · Review delivery (planner).** Match CI results to the tested commit and the live evidence to each supported account type. Report remaining failures by task ID. Update milestone checkboxes in plan.md only for acceptance criteria actually met.
