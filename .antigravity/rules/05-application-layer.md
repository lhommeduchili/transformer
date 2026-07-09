# Application Layer Rules

The application layer owns use cases and workflow orchestration.

It may depend on domain types and abstract ports. It must not depend on UI components or concrete infrastructure adapters.

Use it for queue orchestration, progress aggregation, retry policies, cancellation coordination, report coordination, and event dispatch.
