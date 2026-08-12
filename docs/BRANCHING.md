# Branching and the blind build process

Two things are happening at once in this repository's history: ordinary modular
development, and a deliberate separation between the agents who write tests and the
agents who write implementations. The branch layout serves both.

## Why blindness needs branches

The rule is that tests are written by someone who cannot see the implementation, and the
implementation is written by someone who cannot see the tests. Stated as a policy, that
rule fails quietly — an implementer with the test file on disk will read it, and will
write code shaped to pass those specific assertions rather than code that is correct.

So it is not a policy here. The test author and the implementer work on **different
branches**, and neither branch ever contains the other's files. An implementer literally
cannot open `tests/unit/scheduler.test.ts`, because on their branch that file does not
exist. The only thing both sides share is `src/contract/`, which is frozen before either
of them starts.

## Branches

| Branch | Contains | Written by |
|---|---|---|
| `main` | Integration. Always green. | Merge only |
| `contract/<module>` | The frozen contract: types, ports, testids, fixtures | Contract author |
| `tests/<module>` | Tests only. Branched from `contract/<module>`. | Test author, blind |
| `impl/<module>` | Implementation only. Branched from `contract/<module>`. | Implementer, blind |
| `verify/<module>` | `tests/` merged into `impl/`. The moment of truth. | Orchestrator |

## The cycle for one module

1. **Freeze the contract.** `contract/<module>` is cut from `main` and carries only
   `src/contract/` additions and the module's section of the specification. Once cut, a
   change here requires a commit prefixed `contract:` and is a deliberate, visible event —
   because it invalidates work on both sides.

2. **Fork twice, in parallel.** `tests/<module>` and `impl/<module>` are both cut from
   `contract/<module>`. They never see each other.

3. **Write, blind.** The test author writes only under `tests/`. The implementer writes
   only under `src/`, `app/` and `supabase/`. Each commits to their own branch.

4. **Verify.** The orchestrator cuts `verify/<module>` from `impl/<module>`, merges
   `tests/<module>` into it, and runs the suite. This is the first moment the two bodies
   of work meet.

5. **Report failures as symptoms, never as source.** If tests fail, the implementer is
   told *what behaviour was wrong* — the inputs, the expected outcome, the actual outcome
   — and never shown the test file. If the specification turns out to be ambiguous rather
   than the code wrong, that is a contract defect: fix `contract/<module>`, and both sides
   rebase. Do not resolve an ambiguity by quietly editing a test to match the code.

6. **Merge to `main`** once `verify/<module>` is green.

## Rules

- **A commit that touches both `tests/` and `src/domain/` is a process failure**, not a
  convenience. It means somebody saw both sides.
- **Never weaken a test to make it pass.** A failing test is either a real defect or a
  contract defect. Both have honest fixes.
- **`main` stays green.** Anything that cannot be merged green stays on its branch.
- **Every module is independently revertable.** One module, one merge — so any module can
  be rolled back without unpicking another.

## Commit messages

Prefix with the module and the side, so history stays legible:

```
scheduler(impl): expanding-interval ladder with cue-rung demotion
scheduler(test): decision table coverage for tier-1 interval ceiling
contract: freeze Scheduler port and ItemState schema
```
