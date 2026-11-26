# Moderation evaluation set

An evaluation set for automated moderation of the free text Tessera shows:
survey titles, descriptions, prompts and option labels, custom answers, and
anchor links. It combines real on-chain surveys and responses with synthetic
probes, so any classifier can be scored on the same items.

**The items never enter git.** They live in `data/`, which is git-ignored,
because synthetic probes contain harmful text by design. Only this code is
committed.

Each line of a `data/*.jsonl` file is one item (`src/item.ts`). Every item has
a language and a set of labels, each label a harm category with a severity
(`unlawful` or `policy`). An item without labels is acceptable. `nearMiss`
names the categories an acceptable item resembles: the false positives a
classifier must avoid.

A survey whose text lives in its content-anchor document is exported with
that document fetched, verified and applied, as the app shows it. The export
lists any survey whose document it could not fetch, and any item whose text
changed since the last export: its labels and review were made for the old
text.

```sh
# Every survey and response with free text from one backend, labels kept by id
pnpm --filter tessera-moderation-eval export <backend URL> <network>

# Validate every data file and print coverage
pnpm --filter tessera-moderation-eval check

# Review a language: edit data/review-<lang>.md, then import it
pnpm --filter tessera-moderation-eval review export <lang>
pnpm --filter tessera-moderation-eval review import <lang> <your name>
```

Reviews are kept in `data/reviews.jsonl`, apart from the item files, so
regenerating or re-exporting items never drops one.

## Scoring a classifier

Each candidate is an adapter in `src/providers/`, mapping its categories onto
this set's taxonomy; `baseline` flags nothing and is the floor to read others
against. Every provider sees the same rendering of an item. API keys come from
the environment or from a git-ignored `.env` in this package
(`TYPESAFE_API_KEY` for `jev`).

```sh
# Score the labelled items (optionally only some languages) into data/runs/
pnpm --filter tessera-moderation-eval score <provider> [lang…]

# Error rates of a run: thresholds to hide and to queue, a sweep, and splits
pnpm --filter tessera-moderation-eval report data/runs/<file>.jsonl [--target 0.95] [--at 0.5]

# The same, plus every item wrong at --at with its text, into data/reports/
pnpm --filter tessera-moderation-eval report data/runs/<file>.jsonl --mistakes

# Tuning items near the decision in one run, as a named subset in data/subsets/
pnpm --filter tessera-moderation-eval subset data/runs/<file>.jsonl <name> [--low 0.2] [--high 0.8]

# Two runs side by side, and every item whose grade changed
pnpm --filter tessera-moderation-eval compare <run A> <run B> [--subset <name>]
```

`score` and `report` take `--subset <name>` too. The set splits into a
tuning half and a held-out half, keeping each translation with its original
and each label in both halves; a subset holds tuning items only, so a
provider adjusted on it is checked once on the held-out half (`report`
splits its rates by half).

A run can be interrupted and started again: an item already scored on its
current text is skipped, and a failed call is retried. The printed report
holds aggregates only, never item text; with `--mistakes` it goes to a file
in `data/` instead, since it quotes the items.
