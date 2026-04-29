# mira — skill reference

Every file prefix in this repo has a matching `*.skill.md` next to the
folder that owns the convention. **Read the matching skill before
writing or editing a file with that prefix.** Companion files
(`.test.{ts,tsx}` / `.story.tsx`) are enforced by the
`effect-local/require-companion-*` oxlint rules.

Effect-TS: use the vendored docs in
[`docs/effect/LLMS.md`](./docs/effect/LLMS.md) and the auto-activating
skill at
[`.claude/skills/effect/SKILL.md`](./.claude/skills/effect/SKILL.md) —
don't guess from training data.

IDs: new entity IDs must be KSUIDs prefixed with a three-character entity
code and an underscore, e.g. `ses_381nfd...` for sessions. Pick the three
characters to represent the entity the ID belongs to.

## `apps/client-ui`

| Prefix                            | Skill                                                                                       | Example                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `*.ui.tsx`                        | [src/shared/ui/ui.skill.md](./apps/client-ui/src/shared/ui/ui.skill.md)                     | `src/shared/ui/button.ui.tsx`                     |
| `*.ui.story.tsx`                  | [src/shared/ui/ui.story.skill.md](./apps/client-ui/src/shared/ui/ui.story.skill.md)         | `src/shared/ui/button.ui.story.tsx`               |
| `*.hook.ts`                       | [src/shared/hook/hook.skill.md](./apps/client-ui/src/shared/hook/hook.skill.md)             | `src/shared/hook/use-atom.hook.ts`                |
| `*.util.ts`                       | [src/shared/util/util.skill.md](./apps/client-ui/src/shared/util/util.skill.md)             | `src/shared/util/cn.util.ts`                      |
| `*.route.tsx`                     | [src/module/module.route.skill.md](./apps/client-ui/src/module/module.route.skill.md)       | `src/module/session/session.route.tsx`            |
| `*.atom.ts`                       | [src/module/module.atom.skill.md](./apps/client-ui/src/module/module.atom.skill.md)         | `src/module/session/session.atom-rpc.ts`          |
| `module/<feat>/ui/*.ui.tsx`       | [src/module/module.ui.skill.md](./apps/client-ui/src/module/module.ui.skill.md)             | `src/module/session/ui/session-list.ui.tsx`       |
| `module/<feat>/ui/*.ui.story.tsx` | [src/module/module.ui.story.skill.md](./apps/client-ui/src/module/module.ui.story.skill.md) | `src/module/session/ui/session-list.ui.story.tsx` |
| `module/<feat>/`                  | [src/module/module.skill.md](./apps/client-ui/src/module/module.skill.md)                   | `src/module/session/`                             |

## `apps/server-core`

| Prefix                               | Skill                                                                                                                                    | Example                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `*.rpc.contract.ts` / `.impl.ts`     | [src/module/module.rpc.skill.md](./apps/server-core/src/module/module.rpc.skill.md)                                                      | `src/module/sessions/sessions.rpc.{contract,impl}.ts`     |
| `*.service.contract.ts` / `.impl.ts` | [src/module/module.service.skill.md](./apps/server-core/src/module/module.service.skill.md)                                              | `src/module/sessions/sessions.service.{contract,impl}.ts` |
| `*.repo.contract.ts` / `.impl.ts`    | [src/module/module.repo.skill.md](./apps/server-core/src/module/module.repo.skill.md)                                                    | `src/module/sessions/sessions.repo.{contract,impl}.ts`    |
| `*.schema.ts`                        | [src/module/module.schema.skill.md](./apps/server-core/src/module/module.schema.skill.md)                                                | `src/module/sessions/sessions.schema.ts`                  |
| `*.table.ts`                         | [src/module/module.table.skill.md](./apps/server-core/src/module/module.table.skill.md)                                                  | `src/module/sessions/sessions.table.ts`                   |
| `*.util.ts`                          | [src/module/module.util.skill.md](./apps/server-core/src/module/module.util.skill.md)                                                    | `src/module/company/company.util.ts`                      |
| `*.service.test.ts`                  | [src/module/module.service-test.skill.md](./apps/server-core/src/module/module.service-test.skill.md)                                    | `src/module/sessions/sessions.service.test.ts`            |
| `*.middleware.ts`                    | HTTP middleware via `HttpRouter.middleware<{ provides: … }>()`, colocated with the platform/module that owns the request-scoped service. | `src/platform/auth/auth.middleware.ts`                    |
| `module/<feat>/`                     | [src/module/module.skill.md](./apps/server-core/src/module/module.skill.md)                                                              | `src/module/sessions/`                                    |
