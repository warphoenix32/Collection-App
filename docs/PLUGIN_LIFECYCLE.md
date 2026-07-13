# Adapter Plugin Lifecycle

## Installation

Validate package integrity, manifest completeness, unique adapter ID, platform compatibility, declared host requirements, dependencies, and permissions before registry activation.

## Activation

Register the adapter definition. Detection remains side-effect free. The highest positive confidence owns a context. Capability discovery constrains available operations and UI.

## Upgrade

Verify platform semver compatibility, migrate adapter-owned storage only, preserve recoverable prior packages, and rerun shared plus adapter regression gates. Platform and adapter versions advance independently.

## Compatibility and dependencies

Reject missing dependencies, incompatible platform ranges, duplicate IDs, unsupported schemas, or undeclared permissions. One adapter cannot mutate another adapter's state.

## Retirement

Mark lifecycle status and replacement guidance, disable new missions, preserve read/export access to prior artifacts, and retain a recoverable installation. Retirement never silently deletes checkpoints or profiles.
