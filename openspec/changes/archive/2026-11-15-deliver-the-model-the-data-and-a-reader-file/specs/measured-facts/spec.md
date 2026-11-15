## REMOVED Requirements

### Requirement: The layer is not delivered

**Reason**: The item `reader-and-data` writes every fact of the layer into the data of a delivery, and the
manifest's version rises with it. The requirement held only while `fact-layer` moved the measuring without changing
a delivered byte.

**Migration**: The layer's facts are read from `facts` of `<model id>.json`, under the requirement "The data holds
the layer's facts and no other" of `pinned-edition`. The print edition, its images and the page stay byte for byte
what they were, which this Change proves with `archpub compare`.
