# Collection Planner Architecture

The Planner is a future pure decision component. It is designed, not implemented in v4.0.

Inputs are mission profile, discovered capabilities/sources/entities/relationships/topology, runtime policy, constraints, prior coverage, and operator priorities. Outputs are an immutable execution plan containing targets, priority, expected value, estimated cost, dependencies, execution order, and stop conditions.

The Planner does not acquire, authenticate, reason over collected content, or bypass permissions. Execution remains the Platform Runtime's responsibility. Future AI staff may propose planner inputs and consume results, but AI is not part of acquisition.

Planner interfaces should be deterministic, explainable, serializable, and independently testable. Cost/value estimation providers are plugins, not core assumptions.
