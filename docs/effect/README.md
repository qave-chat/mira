# Effect-TS docs (vendored)

Canonical Effect library docs and examples, vendored from
[`Effect-TS/effect-smol`](https://github.com/Effect-TS/effect-smol) so Claude
Code sessions (and humans) have an authoritative source when writing Effect
code in this repo — independent of what happens to be in `node_modules` or
in any model's training data.

## What's here

| Path                | Source in effect-smol | Purpose                                                    |
| ------------------- | --------------------- | ---------------------------------------------------------- |
| `LLMS.md`           | `/LLMS.md`            | Flat index of every Effect topic with inline code.         |
| `AGENTS.md`         | `/AGENTS.md`          | Upstream contributor guide. Style rules only here.         |
| `ai-docs/README.md` | `/ai-docs/README.md`  | How the `LLMS.md` is generated from the src/ tree.         |
| `ai-docs/src/**`    | `/ai-docs/src/**`     | The real example TypeScript files that `LLMS.md` links to. |

Start at [`LLMS.md`](./LLMS.md) and follow links into `ai-docs/src/`.

## Claude Code integration

The `.claude/skills/effect/` skill at the repo root auto-activates whenever
a session reads or writes Effect code, and instructs Claude to read from this
folder instead of guessing.

## Updating

These files are a point-in-time snapshot. To refresh them, re-run the
download commands in the commit that added this folder (the `gh api` /
`curl` loop against `raw.githubusercontent.com/Effect-TS/effect-smol/main`).

Upstream may add new topic folders; check
<https://github.com/Effect-TS/effect-smol/tree/main/ai-docs/src> when
refreshing and extend the file list accordingly.
