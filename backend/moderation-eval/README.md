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
