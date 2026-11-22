## ADDED Requirements

### Requirement: Browse template implied by a Forge address

When a model's repository declares no `browse` and its `url` is an `https`
address on `github.com` or `gitlab.com` that names a repository and nothing
more, the publisher SHALL take as its template that address without a trailing
`.git`, followed by `/blob/{revision}/{path}` on GitHub or
`/-/blob/{revision}/{path}` on GitLab. A declared template SHALL stand, and any
other address SHALL imply none.

#### Scenario: A GitHub address and no template

- **WHEN** a model's repository declares `url: "https://github.com/o/r.git"` and
  no `browse`
- **THEN** its template is `https://github.com/o/r/blob/{revision}/{path}`

#### Scenario: A declared template

- **WHEN** a model's repository declares `url: "https://github.com/o/r.git"` and
  `browse: "https://example.invalid/{revision}/{path}"`
- **THEN** its template is `https://example.invalid/{revision}/{path}`

#### Scenario: An address of another host

- **WHEN** a model's repository declares `url: "https://git.example.invalid/o/r"`
  and no `browse`
- **THEN** it has no template
