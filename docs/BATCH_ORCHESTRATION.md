# Batch Orchestration

## Mission

Collect multiple conversations through one user-directed operation without introducing background authentication or hidden tabs.

## Behavior

1. Preserve the original URL.
2. Process targets sequentially.
3. Export each target independently.
4. Continue after recoverable failures.
5. Restore the original URL after the queue.
6. Download a batch manifest.

## Result States

- `success`: export completed and collection was complete.
- `warning`: export completed but collection reported incomplete history.
- `failed`: no export was produced.


## LTS Reliability

Each failed target receives one bounded retry. Partial historical exports remain warnings rather than successes.
