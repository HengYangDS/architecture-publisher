## ADDED Requirements

### Requirement: No private network address in tracked files

The repository's tracked text files SHALL NOT name a private IPv4 address, one
in the ranges RFC 1918 reserves. A test SHALL refuse such a file and name it
and its line.

#### Scenario: A link to a private host

- **WHEN** a tracked document links to a host by a private IPv4 address
- **THEN** the test fails and names the document and the line

#### Scenario: The tree as tracked

- **WHEN** the test reads every tracked text file of the repository
- **THEN** it finds no private IPv4 address
