## ADDED Requirements

### Requirement: Answers kept between processes

Where the environment variable `ARCHPUB_ARCHIFY_ANSWERS` names a directory, the publisher SHALL keep each whole
answer of Archify to a candidate diagram in it and SHALL read a whole answer kept there in place of asking
Archify. Without the variable the publisher SHALL keep no answer outside its process. The chosen diagram and every
delivered byte SHALL be the same with a directory named, with answers already kept in it, and with none.

#### Scenario: A second process

- **WHEN** one process has measured a view's candidates with a directory named
- **AND** another process measures the same view with the same directory
- **THEN** the second process does not start Archify for them and chooses the same diagram

#### Scenario: No directory named

- **WHEN** the variable is not set
- **THEN** every process asks Archify for each document it has not measured itself, and no file is written

### Requirement: What an answer is kept by

An answer SHALL be kept by the Archify supply's digest, the Node.js version and platform that ran Archify, the
kind of answer, the quality and the document. The file a document is written to SHALL NOT be part of it.

#### Scenario: The same document in another file

- **WHEN** a document is asked of in one file and again in another
- **THEN** the second question reads the first answer and starts no run

#### Scenario: The layout of a document whose verdict is kept

- **WHEN** a document's verdict is kept and its layout is asked
- **THEN** Archify is asked for the layout, which is kept beside the verdict

### Requirement: Whole answers only

Only a whole answer SHALL be kept or read: a verdict Archify reached or a layout it drew. A refusal and a run of
Archify that fails SHALL NOT be kept, and a kept file that is no whole answer SHALL be asked again and replaced.

#### Scenario: A refusal

- **WHEN** Archify refuses a candidate, or ends without an answer the publisher can read
- **THEN** nothing is kept for that question, and the next question of it starts Archify again

#### Scenario: A file that is no answer

- **WHEN** the file in an answer's place holds a refusal or no JSON
- **THEN** Archify is asked and its whole answer replaces the file

### Requirement: A directory that cannot hold answers

The publisher SHALL make the named directory when it is missing, and SHALL refuse with `answers_unkept`, before it
asks Archify, when the path cannot be made a directory. An answer that cannot be written to the directory SHALL
NOT be kept and SHALL NOT fail the work.

#### Scenario: A file where the directory is named

- **WHEN** the variable names a path that is a file
- **THEN** the build is refused with `answers_unkept` before Archify is asked, and the file is as it was

#### Scenario: An answer that cannot be written

- **WHEN** a whole answer cannot be moved into its place in the directory
- **THEN** the question is answered all the same, nothing is left beside the place, and the next question of it
  starts Archify again
