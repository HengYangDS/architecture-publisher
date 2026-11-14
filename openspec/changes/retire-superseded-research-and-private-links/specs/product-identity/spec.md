## ADDED Requirements

### Requirement: No private network address in tracked files

The repository's tracked text files SHALL NOT name a private IPv4 address, one
of 10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16. A test SHALL refuse such a file
and name it and its line.

#### Scenario: A link to a private host

- **WHEN** a tracked document links to a host by an address in 192.168.0.0/16
- **THEN** the test fails and names the document and the line

#### Scenario: The tree as tracked

- **WHEN** the test reads every tracked text file of the repository
- **THEN** it finds no private IPv4 address
