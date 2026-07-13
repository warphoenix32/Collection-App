# Discovery Framework

The normalized discovery kinds are capability, source, entity, relationship, and topology. `DCE.discoveryFramework.discover(adapter, kind, request)` invokes only declared adapter handlers and returns support state, adapter identity, observation time, and normalized results.

Platform detection is not discovery: it selects the adapter. Capability discovery states what that adapter can do. Source/entity/relationship/topology discovery observe what the authenticated context legitimately exposes. Discovery never implies collectibility and never bypasses permissions.
