# Identity Engine 1.0

## Mission
Provide stable, provenance-aware participant records without embedding Discord DOM assumptions in the conversation model.

## Scope
The v2.0 engine performs platform-local identity normalization only. It does not attempt cross-platform identity correlation.

## Inputs
Adapter observations may contain:
- Platform user ID
- Display name
- Whether the observation was inferred from a compact message continuation

## Outputs
Each participant includes:
- `participantId`
- `platform`
- `platformUserId`
- `displayName`
- `aliases`
- `confidence`
- `provenance`
- `observations`

## Confidence
- `high`: stable platform ID and direct author observation
- `medium`: platform ID with inferred display context, or direct display-only observation
- `low`: inferred display-only observation
- `unknown`: no usable identity observation

## Constraints
- Missing values remain null rather than guessed.
- Aliases are limited to names observed for the same stable platform user ID.
- Discord role and profile decoration text is stripped before identity reconciliation.
