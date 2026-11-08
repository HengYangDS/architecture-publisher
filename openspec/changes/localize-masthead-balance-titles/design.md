## Context

See [proposal.md](proposal.md). The house class typesets both the overview checked alone and the print edition.
In the edition it already reads the record `edition.json`, whose `words.built` is the build line in the model's
language; its foot uses the record's `words.foot` the same way. The cover sets `r.title` in one block 900 pt wide
at the cover size, and Typst may break CJK text between any two characters, so it breaks where the line fills.

## Goals / Non-Goals

**Goals:**

- No word the publisher sets on an edition is in another language than the model's.
- No CJK cover title leaves a lone character on its last line.

**Non-Goals:**

- Changing how an English or other space-separated title wraps.
- Balancing card text on plates, whose lines the engine measures and Typst must set as measured.
- Localizing the overview checked alone, which has no edition record.

## Decisions

- **The masthead reads the record it already has.** In the edition the class sets `words.built`; outside it, the
  English line it sets today, so the check's measured boxes do not change. A model that pins no revision has no build
  line, so its masthead, like its contents page, sets none, where 0.10.0 printed a bare "As built at".
- **Balance only what the writing system lets break anywhere.** A title holding Han, Kana or Hangul and wider than
  its column breaks at the space whose two lines both fit and whose wider line is narrowest. Without one, it is set
  in a column the title's width divided by the lines it needs, plus half an em, so greedy breaking fills every line
  nearly alike. Latin titles break at spaces already, and stay as they are.

## Risks / Trade-offs

- [A balanced column is narrower than the cover's] → The title's lines are measured in the same faces Typst sets,
  and each still fits the 900 pt column, so the cover's layout below the title does not move.
- [A title with several spaces could balance at an unexpected space] → Only splits whose both lines fit count, and
  the narrowest wider line wins, which for "AIGW 客户端投影" is "AIGW / 客户端投影".
