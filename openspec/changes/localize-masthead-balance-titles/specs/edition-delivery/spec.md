## ADDED Requirements

### Requirement: Cover title lines

A cover title that holds Han, Kana or Hangul text and is wider than its column
SHALL break at the space whose two lines both fit and whose wider line is
narrowest, or else into lines of balanced width, so no line holds one
character alone. A title in other scripts SHALL break at its spaces.

#### Scenario: A title of eight Han characters

- **WHEN** 数据部门工作指南 is wider than the cover's column
- **THEN** it is set as 数据部门 and 工作指南

#### Scenario: A title with a Latin word

- **WHEN** AIGW 客户端投影 is wider than the cover's column
- **THEN** it is set as AIGW and 客户端投影

#### Scenario: An English title

- **WHEN** an English title is wider than the cover's column
- **THEN** it breaks at its spaces as in 0.10.0
