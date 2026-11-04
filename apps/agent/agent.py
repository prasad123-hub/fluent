"""Default entrypoint for `lk agent debugger/console/simulate` and `uv run agent`."""

from fluent_agent.main import run, server  # noqa: F401

if __name__ == "__main__":
    run()
