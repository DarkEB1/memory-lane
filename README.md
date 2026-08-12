# Memory Lane

A daily memory activity for people living with dementia, built from their own family's
photographs and voices — with a clinically-faithful spaced retrieval loop inside it.

Three people use it: a **family member** who sets it up and supplies the content, the
**person living with dementia** who does a short session each day, and a
**researcher** who studies what happens.

> **Status: in development. Not a medical device. Never used with a patient.**

---

## What this app claims, and what it does not

This project began from a common intuition — that actively exercising important memories
might slow the progression of dementia. We commissioned a deep review of the literature
before writing any feature code. **That intuition is not supported by the evidence**, and
the design changed accordingly.

**What the evidence does support:**

> Spaced retrieval training reliably teaches and helps maintain *specific, chosen,
> personally relevant facts and face–name associations* in people with mild-to-moderate
> Alzheimer's — for those items and nothing beyond them — and doing it together, from a
> family's own photographs and voices, is a structured shared activity that people with
> dementia in the one closely comparable trial rated as improving their relationship with
> their carer.

**What this app does not claim, and will not claim:** that it slows, delays, prevents,
treats or modifies dementia; that it improves memory, attention or "brain health" in
general; that it builds cognitive reserve or preserves synapses; that any benefit
transfers beyond the specific items practised; or that it improves quality of life or
daily functioning. Each of those was tested against the literature and each is either
unsupported or has been tested and found null.

The three interventions most similar to this one — [iCST](https://pubmed.ncbi.nlm.nih.gov/28350796/)
(n=356), [REMCARE](https://pmc.ncbi.nlm.nih.gov/articles/PMC4836678/) (n=488), and the
[Online Life Story Book](https://pmc.ncbi.nlm.nih.gov/articles/PMC8443059/) (n=42) — were
all null on their primary outcomes, and two of them measurably increased carer distress.
We build with that in front of us, not behind us.

The full review, including the findings that are inconvenient for this product, is in
[`docs/research/00-SYNTHESIS.md`](docs/research/00-SYNTHESIS.md). It is deliberately public.

## Design commitments

These come from the evidence review and constrain every feature:

- **A session never ends on a failure.** If the last graded item was a miss, the app
  closes on something the person cannot get wrong.
- **Difficulty is carried by cue support, never by interval.** On a miss the answer is
  supplied warmly and immediately, and the item returns one cue rung easier — not sooner
  and not harder.
- **Nothing is ever automatically retired.** The items most likely to lapse are the most
  important ones — a spouse's name, an address. They degrade to wordless familiarity and
  stay in rotation as moments of connection. Only a human retires an item.
- **The person never grades themselves and never sees a score.** Self-assessment is
  unreliable in dementia; grading is objective, from correctness, cue level and latency.
- **No family face is ever used for measurement.** Measurement happens on a small
  generic probe set, so the scheduler never puts a late spouse's photograph on a timetable.
- **The app is designed for the caregiver's absence**, because the trials show that
  designs depending on caregiver effort fail, and increase caregiver distress when they do.

## Architecture

Single Expo package — one codebase for the browser today and a native iOS app later.

| Layer | Choice |
|---|---|
| Client | Expo SDK 57, React Native 0.86, React 19.2, `react-native-web` |
| Routing | `expo-router` — one file tree, real URLs on web, native stacks on iOS |
| Core logic | `src/domain/` — pure TypeScript, no framework, no backend, no clock, no randomness |
| Offline | `expo-sqlite` (SQLCipher on device); telemetry queued locally and never lost |
| Backend | Supabase — Postgres, Auth, Storage, row-level security |
| Researcher access | Separate schema of de-identified views; re-identification is prevented by an absent grant, not by a `WHERE` clause |

Decision record with the rejected alternatives and why:
[`docs/architecture/00-ADR-PLATFORM.md`](docs/architecture/00-ADR-PLATFORM.md).

`src/domain/` is kept pure by lint rules rather than by convention — it cannot import
React, React Native, Expo or Supabase, and cannot reach `Date`, `Math.random`, `fetch`,
`window` or `document`. Time and randomness are injected. This is what lets the server
recompute scheduler state canonically by replaying the same event log through the same
module, and what makes the logic deterministically testable.

## How this was built

Design decisions were made by adversarial panels rather than by a single pass: competing
proposals, cross-examination with evidence, and a presiding verdict that records what lost
and why. Tests are written by agents who cannot see the implementation, and the
implementation is written by agents who cannot see the tests — enforced by branch
isolation, so neither can special-case its way to green.

## Running it

```bash
npm install
npm run web
```

Requires Node ≥ 20.19.4. Backend setup (local Supabase, requires Docker) is documented in
`supabase/README.md`.

## Before this could be used with a real person

Documented and not yet done: a written MHRA/FDA regulatory opinion on the adaptive
scheduler; REC/IRB approval; a US biometric-law position covering photographs of relatives
who are not users; a DPIA; and a patient and public involvement panel including people
living with dementia. See §10 of the evidence synthesis.

## Licence

MIT. See [LICENSE](LICENSE).
