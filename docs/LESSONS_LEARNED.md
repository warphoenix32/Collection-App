# Discord Adapter — Lessons Learned

- The active authenticated tab was the correct security and usability boundary.
- Passive discovery avoided a second authentication path and background-tab complexity.
- Discord DOM virtualization means collection cannot be deferred until the end of a long scroll; evidence must be accumulated continuously.
- Binary completion is insufficient without explicit coverage and provenance.
- Batch orchestration must distrust individual adapter success claims and preserve warnings.
- Platform capabilities belong in core; DOM selectors and interaction recovery belong in the adapter.
- Targeted Collection was retired because its maintenance cost and UI instability exceeded its mission value.
- Removing an unreliable capability can improve the product more than adding another feature.
- Immutable milestones and validation artifacts are essential when development spans multiple AI sessions.
