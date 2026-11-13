import { ChildProcess, ChildProcessSpawner } from "effect/process";
import { Effect, FileSystem, Layer, Schema, Sink, Stream } from "effect";
import { cleanupDockerRoot } from "./docker-cleanup.ts";
import { testEngine } from "./test-engine.ts";

/**
 * Runs a command of the selected test engine's CLI and returns its combined output and exit code.
 * It does not pin the engine target, so it works before an engine is known to be reachable.
 */
export const runEngine = Effect.fn("DockerTest.runEngine")((args: ReadonlyArray<string>) =>
  Effect.scoped(
    Effect.gen(function* () {
      const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
      const child = yield* spawner.spawn(
        ChildProcess.make(testEngine, args, { stdout: "pipe", stderr: "pipe" }),
      );
      const [stdout, stderr, code] = yield* Effect.all(
        [
          Stream.mkString(Stream.decodeText(child.stdout)),
          Stream.mkString(Stream.decodeText(child.stderr)),
          child.exitCode,
        ],
        { concurrency: "unbounded" },
      );
      return { output: `${stdout}${stderr}`, code: Number(code) };
    }),
  ),
);

/**
 * Allocates the documented state-root layout used by Docker database fixtures. The volume this
 * state root's Docker database creates is removed by the `SUPABASE_STACK_TEST_RUN` test-run
 * cleanup (see `tests/docker-volume-run.ts`), not by this fixture.
 */
export const makeDockerDatabaseRoot = Effect.fn("DockerTest.makeDatabaseRoot")(
  (prefix: string, stackId = "catalog-test") =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const temporaryRoot = yield* fs.makeTempDirectoryScoped({ prefix });
      const root = `${temporaryRoot}/state/${stackId}/data`;
      yield* fs.makeDirectory(root, { recursive: true });
      yield* Effect.addFinalizer(() =>
        Effect.gen(function* () {
          if (yield* fs.exists(root)) yield* cleanupDockerRoot(root);
        }).pipe(Effect.catchCause(Effect.die)),
      );
      return root;
    }),
);

/** A container of an `engineStub` engine, labelled with its stack id and data root. */
export interface StubContainer {
  readonly id: string;
  readonly stackId: string;
  readonly root: string;
}

const encodeLabels = Schema.encodeEffect(
  Schema.fromJsonString(Schema.Tuple([Schema.String, Schema.String])),
);
const encodeLabelMap = Schema.encodeEffect(
  Schema.fromJsonString(Schema.Record(Schema.String, Schema.String)),
);

/** The connection options `resolveEngineTarget` pins in front of a subcommand. */
const TARGET_OPTIONS = ["--context", "--host", "--url", "--connection"];

/**
 * Docker and Podman engines that each start with `containers`. Both answer the commands
 * `resolveEngineTarget` runs; a target's connection options are not part of a command's subcommand.
 * `ps --format '{{.ID}}'` prints container ids, then every string entry as is; `ps --format` with
 * Docker's tuple template prints labels as JSON lines. `inspect --format` prints one container's
 * label map. Podman 4.9 rejects `.Label` in a `ps` template, which this stub reproduces. `ps
 * --quiet` prints the ids of those matching every `--filter`; `rm --force <id>` removes one. A
 * command fails with the given stderr when `failures` names its engine (`docker`) or its engine and
 * subcommand (`podman rm`). Every command is recorded and passed to `onCommand` before it is
 * answered; `remaining` lists an engine's containers.
 */
export const engineStub = (
  containers: ReadonlyArray<StubContainer | string>,
  failures: Readonly<Record<string, string>> = {},
  onCommand: (command: ReadonlyArray<string>) => Effect.Effect<void> = () => Effect.void,
) => {
  const commands: Array<ReadonlyArray<string>> = [];
  const noise = containers.filter((entry) => typeof entry === "string");
  const initial = containers.filter((entry) => typeof entry !== "string");
  const inventories = new Map(["docker", "podman"].map((engine) => [engine, initial]));
  const spawner = ChildProcessSpawner.make((command) =>
    Effect.gen(function* () {
      if (!ChildProcess.isStandardCommand(command))
        return yield* Effect.die("Unexpected child process command");
      const commandArgs = command.args.map(String);
      const argv = [command.command, ...commandArgs];
      commands.push(argv);
      const args = TARGET_OPTIONS.includes(commandArgs[0] ?? "")
        ? commandArgs.slice(2)
        : commandArgs;
      const [subcommand] = args;
      const failure = failures[`${command.command} ${subcommand}`] ?? failures[command.command];
      const inventory = inventories.get(command.command) ?? [];
      const filters = commandArgs.filter((_, index) => commandArgs[index - 1] === "--filter");
      const listed = inventory.filter((container) =>
        filters.every((filter) =>
          [
            `id=${container.id}`,
            "label=com.supabase.stack",
            `label=com.supabase.stack=${container.stackId}`,
            `label=com.supabase.stack-root=${container.root}`,
          ].includes(filter),
        ),
      );
      const formatIndex = commandArgs.indexOf("--format");
      const format = formatIndex === -1 ? undefined : commandArgs[formatIndex + 1];
      const listing = Effect.gen(function* () {
        if (format === undefined) return listed.map(({ id }) => id).join("\n");
        // `listStackLabels` now asks for ids and then inspects each label map.
        if (format.includes("{{.ID}}")) return [...listed.map(({ id }) => id), ...noise].join("\n");
        const labels = yield* Effect.forEach(listed, ({ stackId, root }) =>
          encodeLabels([stackId, root]).pipe(Effect.orDie),
        );
        return [...labels, ...noise].join("\n");
      });
      const inspected = commandArgs.at(-1);
      const inspectedContainer = inventory.find(({ id }) => id === inspected);
      const inspectFailure =
        subcommand === "inspect" &&
        inspectedContainer === undefined &&
        !noise.includes(inspected ?? "")
          ? command.command === "podman"
            ? `Error: no such object: "${inspected}"`
            : `Error: No such container: ${inspected}`
          : undefined;
      // Podman 4.9's `ps` reporter has no `.Label` field, so a template that asks for one fails;
      // the stub fails the same way so such a query cannot return to the suite unnoticed.
      const templateFailure =
        subcommand === "ps" && format?.includes(".Label") === true
          ? `template: ps:1:20: executing "ps" at <.Label>: can't evaluate field Label in type containers.psReporter`
          : undefined;
      const errorText = failure ?? inspectFailure ?? templateFailure;
      const inspectStdout =
        subcommand === "inspect" && inspectedContainer !== undefined
          ? yield* encodeLabelMap({
              "com.supabase.stack": inspectedContainer.stackId,
              "com.supabase.stack-root": inspectedContainer.root,
            }).pipe(Effect.orDie)
          : noise.includes(inspected ?? "")
            ? "not-json"
            : "";
      const identity =
        command.command === "podman" ? "false|false|stub-host|/stub/graph" : "stub-id";
      const stdout =
        errorText !== undefined
          ? ""
          : subcommand === "context"
            ? "stub-context"
            : subcommand === "info"
              ? identity
              : subcommand === "ps"
                ? yield* listing
                : subcommand === "inspect"
                  ? inspectStdout
                  : "";
      if (errorText === undefined && subcommand === "rm")
        inventories.set(
          command.command,
          inventory.filter(({ id }) => id !== commandArgs.at(-1)),
        );
      yield* onCommand(argv);
      return ChildProcessSpawner.makeHandle({
        pid: ChildProcessSpawner.ProcessId(0),
        exitCode: Effect.succeed(ChildProcessSpawner.ExitCode(errorText === undefined ? 0 : 1)),
        isRunning: Effect.succeed(false),
        kill: () => Effect.void,
        stdin: Sink.drain,
        stdout: Stream.succeed(new TextEncoder().encode(stdout)),
        stderr:
          errorText === undefined
            ? Stream.empty
            : Stream.succeed(new TextEncoder().encode(errorText)),
        all: Stream.empty,
        getInputFd: () => Sink.drain,
        getOutputFd: () => Stream.empty,
        unref: Effect.succeed(Effect.void),
      });
    }),
  );
  return {
    layer: Layer.succeed(ChildProcessSpawner.ChildProcessSpawner, spawner),
    commands,
    remaining: (engine: "docker" | "podman") => inventories.get(engine) ?? [],
  };
};
