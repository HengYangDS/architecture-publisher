---
subject: architecture-publisher:terms
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Terms

Each concept the edition, the page and the reader file name, the word each language names it by, and the keys
of the product's words that use it. This table is the product's vocabulary: `tests/terms.test.mjs` refuses a key
listed here whose text in a language does not hold that language's word, accents aside.

| Concept           | `en`              | `zh-CN`  | `zh-TW`  | `es`                   | `ko`        | Keys                                                                                                                     |
| ----------------- | ----------------- | -------- | -------- | ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| edition           | edition           | 图册     | 圖冊     | edición                | 판          | `edition.edition`, `edition.attached`, `edition.license`, `edition.colophonNote`, `reader.noEdition`                     |
| plate             | plate             | 图版     | 圖版     | lámina                 | 도판        | `edition.plateCount`, `edition.plate`, `edition.readingNote`, `edition.indexLead`, `reader.unplated`, `reader.noEdition` |
| overview          | overview          | 总览     | 總覽     | panorama               | 개요        | `edition.overview`, `reader.notCarried`                                                                                  |
| view              | view              | 视图     | 視圖     | vista                  | 뷰          | `page.overview`, `reader.unselected`                                                                                     |
| component         | component         | 组件     | 元件     | componente             | 구성 요소   | `page.component`, `edition.indexLead`, `reader.beyond`, `edition.readingNote`                                            |
| group             | group             | 分组     | 分組     | grupo                  | 그룹        | `page.group`, `reader.beyond`                                                                                            |
| relation          | relation          | 关系     | 關係     | relación               | 관계        | `page.relations`, `reader.beyond`                                                                                        |
| statement         | statement         | 陈述     | 陳述     | enunciado              | 진술        | `reader.statements`, `reader.unselected`, `reader.unplated`, `reader.noEdition`, `reader.beyond`                         |
| guide             | guide             | 导读     | 導讀     | guía                   | 가이드      | `reader.guide`, `reader.noGuide`, `reader.notCarried`, `reader.transitional`                                             |
| delivery          | delivery          | 交付物   | 交付物   | entrega                | 산출물      | `reader.delivery`, `reader.noEdition`, `reader.verify`                                                                   |
| manifest          | manifest          | 清单     | 清單     | manifiesto             | 매니페스트  | `edition.manifest`, `edition.colophonNote`, `reader.verify`                                                              |
| pinned commit     | pin               | 固定提交 | 固定提交 | revisión fijada        | 고정 리비전 | `reader.pin`, `reader.noCheckout`, `reader.check`                                                                        |
| checkout          | checkout          | 检出目录 | 簽出目錄 | copia de trabajo       | 체크아웃    | `reader.noCheckout`, `reader.check`                                                                                      |
| commit            | commit            | 提交     | 提交     | commit                 | 커밋        | `edition.commit`                                                                                                         |
| acceptance record | acceptance record | 验收记录 | 驗收記錄 | registro de aceptación | 승인 기록   | `edition.colophon`, `edition.colophonNote`                                                                               |
| reviewer          | reviewer          | 审阅者   | 審閱者   | revisor                | 검토자      | `edition.reviewer`                                                                                                       |
| repository        | repository        | 仓库     | 儲存庫   | repositorio            | 저장소      | `edition.repository`, `reader.noCheckout`                                                                                |
| model             | model             | 模型     | 模型     | modelo                 | 모델        | `reader.model`, `edition.attached`, `reader.noGuide`, `reader.check`                                                     |
| web page          | page              | 网页     | 網頁     | página                 | 페이지      | `edition.page`, `edition.readingNote`                                                                                    |
| contents          | contents          | 目录     | 目錄     | contenido              | 목차        | `edition.contents`                                                                                                       |
| index             | index             | 索引     | 索引     | índice                 | 색인        | `edition.index`, `edition.readingNote`                                                                                   |
| data              | data              | 数据     | 資料     | datos                  | 데이터      | `edition.data`, `reader.data`                                                                                            |
| scope             | scope             | 范围     | 範圍     | alcance                | 범위        | `edition.scope`, `reader.scope`                                                                                          |
