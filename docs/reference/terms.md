---
subject: architecture-publisher:terms
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Terms

Each concept the edition, the page and the reader file name, the word English, Simplified Chinese and Traditional
Chinese name it by, and the keys of the product's words that use it. This table is the product's vocabulary in
those languages: `tests/terms.test.mjs` refuses a key listed here whose text in one of them does not hold its word.
Each word is set as code, as the product's words write it.

| Concept           | `en`                | `zh-CN`    | `zh-TW`    | Keys                                                                                                                                     |
| ----------------- | ------------------- | ---------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| edition           | `edition`           | `图册`     | `圖冊`     | `edition.edition`, `edition.attached`, `edition.license`, `edition.colophonNote`, `reader.noEdition`                                     |
| plate             | `plate`             | `图版`     | `圖版`     | `edition.plateCount`, `edition.plate`, `edition.readingNote`, `edition.indexLead`, `reader.unplated`, `reader.noEdition`, `reader.plate` |
| overview          | `overview`          | `总览`     | `總覽`     | `edition.overview`, `reader.notCarried`                                                                                                  |
| view              | `view`              | `视图`     | `視圖`     | `page.overview`, `reader.unselected`, `reader.view`                                                                                      |
| component         | `component`         | `组件`     | `元件`     | `page.component`, `edition.indexLead`, `reader.beyond`, `edition.readingNote`, `reader.component`                                        |
| group             | `group`             | `分组`     | `分組`     | `page.group`, `reader.beyond`, `reader.group`                                                                                            |
| relation          | `relation`          | `关系`     | `關係`     | `page.relations`, `reader.beyond`, `reader.relation`                                                                                     |
| statement         | `statement`         | `陈述`     | `陳述`     | `reader.statements`, `reader.unselected`, `reader.unplated`, `reader.noEdition`, `reader.beyond`                                         |
| guide             | `guide`             | `导读`     | `導讀`     | `reader.guide`, `reader.noGuide`, `reader.notCarried`                                                                                    |
| delivery          | `delivery`          | `交付物`   | `交付物`   | `reader.delivery`, `reader.noEdition`, `reader.verify`                                                                                   |
| manifest          | `manifest`          | `清单`     | `清單`     | `edition.manifest`, `edition.colophonNote`, `reader.verify`                                                                              |
| pinned commit     | `pin`               | `固定提交` | `固定提交` | `reader.pin`, `reader.noCheckout`, `reader.check`                                                                                        |
| checkout          | `checkout`          | `检出目录` | `簽出目錄` | `reader.noCheckout`, `reader.check`                                                                                                      |
| commit            | `commit`            | `提交`     | `提交`     | `edition.commit`                                                                                                                         |
| acceptance record | `acceptance record` | `验收记录` | `驗收記錄` | `edition.colophon`, `edition.colophonNote`                                                                                               |
| reviewer          | `reviewer`          | `审阅者`   | `審閱者`   | `edition.reviewer`                                                                                                                       |
| repository        | `repository`        | `仓库`     | `儲存庫`   | `edition.repository`, `reader.noCheckout`                                                                                                |
| model             | `model`             | `模型`     | `模型`     | `reader.model`, `edition.attached`, `reader.noGuide`, `reader.check`                                                                     |
| web page          | `page`              | `网页`     | `網頁`     | `edition.page`, `edition.readingNote`                                                                                                    |
| contents          | `contents`          | `目录`     | `目錄`     | `edition.contents`                                                                                                                       |
| index             | `index`             | `索引`     | `索引`     | `edition.index`, `edition.readingNote`                                                                                                   |
| data              | `data`              | `数据`     | `資料`     | `edition.data`, `reader.data`                                                                                                            |
| scope             | `scope`             | `范围`     | `範圍`     | `edition.scope`, `reader.scope`                                                                                                          |
