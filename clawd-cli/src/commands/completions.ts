import fs from "fs";
import path from "path";
import os from "os";
import chalk from "chalk";
import type { Command } from "commander";

interface CommandInfo {
  name: string;
  subcommands: string[];
}

interface GlobalOption {
  long: string;
  description: string;
  hasArg: boolean;
}

/** Extract global options (--api-key, --network, etc.) from the program. */
function collectGlobalOptions(program: Command): GlobalOption[] {
  return program.options.map((o: { long?: string; short?: string; description?: string; flags?: string }) => ({
    long: o.long || o.short || "",
    description: (o.description || "").replace(/'/g, ""),
    hasArg: !!o.flags && /</.test(o.flags),
  })).filter((o) => o.long);
}

/** Walk the Commander tree and collect command names, subcommands, and options. */
function collectCommands(program: Command): { topLevel: string[]; groups: CommandInfo[] } {
  const topLevel: string[] = [];
  const groups: CommandInfo[] = [];

  for (const cmd of program.commands) {
    const name = cmd.name();
    topLevel.push(name);

    const subs = cmd.commands.map((c: Command) => c.name());

    if (subs.length > 0) {
      groups.push({ name, subcommands: subs });
    }
  }

  return { topLevel, groups };
}

function generateBash(program: Command): string {
  const { topLevel, groups } = collectCommands(program);
  const globalOpts = collectGlobalOptions(program);
  const globalFlags = globalOpts.map((o) => o.long).join(" ");

  const cases = groups.map((g) =>
    `    ${g.name})\n      COMPREPLY=($(compgen -W "${g.subcommands.join(" ")}" -- "$cur"))\n      return\n      ;;`
  ).join("\n");

  return `# clawd-cli bash completion
# Install: clawd-cli completions bash >> ~/.bashrc && source ~/.bashrc

_clawd_cli_completions() {
  local cur prev
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  # Complete flags
  if [[ "$cur" == -* ]]; then
    COMPREPLY=($(compgen -W "${globalFlags}" -- "$cur"))
    return
  fi

  # Complete subcommands for command groups
  case "$prev" in
${cases}
  esac

  # Complete top-level commands
  if [[ "\${COMP_CWORD}" -eq 1 ]]; then
    COMPREPLY=($(compgen -W "${topLevel.join(" ")}" -- "$cur"))
    return
  fi
}

complete -o default -F _clawd_cli_completions clawd-cli
`;
}

function generateZsh(program: Command): string {
  const { topLevel, groups } = collectCommands(program);
  const globalOpts = collectGlobalOptions(program);

  const zshFlags = globalOpts.map((o) => {
    const argSpec = o.hasArg ? `:${o.description}:` : "";
    return `    '${o.long}[${o.description}]${argSpec}'`;
  }).join(" \\\n");

  const subcmdCases = groups.map((g) => {
    const items = g.subcommands.map((s) => `'${s}'`).join(" ");
    return `    ${g.name})\n      cmds=(${items})\n      ;;`;
  }).join("\n");

  return `#compdef clawd-cli
# clawd-cli zsh completion
# Install: clawd-cli completions zsh >> ~/.zshrc && source ~/.zshrc

_clawd_cli() {
  local -a cmds
  local curcontext="\$curcontext" state

  _arguments -C \\
${zshFlags} \\
    '1:command:->cmd' \\
    '*:subcommand:->subcmd'

  case "\$state" in
    cmd)
      cmds=(${topLevel.map((c) => `'${c}'`).join(" ")})
      _describe 'command' cmds
      ;;
    subcmd)
      case "\${words[2]}" in
${subcmdCases}
        *)
          return
          ;;
      esac
      _describe 'subcommand' cmds
      ;;
  esac
}

_clawd_cli "\$@"
`;
}

function generateFish(program: Command): string {
  const { topLevel, groups } = collectCommands(program);

  const lines: string[] = [
    "# clawd-cli fish completion",
    "# Install: clawd-cli completions fish > ~/.config/fish/completions/clawd-cli.fish",
    "",
    "# Disable file completions",
    "complete -c clawd-cli -f",
    "",
    "# Top-level commands",
  ];

  for (const cmd of topLevel) {
    lines.push(`complete -c clawd-cli -n '__fish_use_subcommand' -a '${cmd}'`);
  }

  lines.push("");

  for (const g of groups) {
    lines.push(`# ${g.name} subcommands`);
    for (const sub of g.subcommands) {
      lines.push(`complete -c clawd-cli -n '__fish_seen_subcommand_from ${g.name}' -a '${sub}'`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

function getInstallPath(shell: string): string {
  switch (shell) {
    case "bash": return path.join(os.homedir(), ".bashrc");
    case "zsh":  return path.join(os.homedir(), ".zshrc");
    case "fish": return path.join(os.homedir(), ".config", "fish", "completions", "clawd-cli.fish");
    default:     return "";
  }
}

function generate(shell: string, program: Command): string {
  switch (shell) {
    case "bash": return generateBash(program);
    case "zsh":  return generateZsh(program);
    case "fish": return generateFish(program);
    default:
      console.error(`Unknown shell: ${shell}. Supported: bash, zsh, fish`);
      process.exit(1);
  }
}

export function completionsCommand(shell: string, program: Command, options: { install?: boolean } = {}): void {
  const script = generate(shell, program);

  if (!options.install) {
    console.log(script);
    return;
  }

  const target = getInstallPath(shell);

  // For fish, ensure the completions directory exists
  if (shell === "fish") {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Fish uses a dedicated file, so overwrite it
    fs.writeFileSync(target, script);
    console.log(chalk.green(`Completions installed to ${target}`));
    console.log(chalk.gray("Completions will be available in new fish sessions."));
    return;
  }

  // For bash/zsh, append to rc file (skip if already installed)
  const existing = fs.existsSync(target) ? fs.readFileSync(target, "utf-8") : "";
  if (existing.includes("_clawd_cli_completions") || existing.includes("_clawd_cli()") || existing.includes("_helius_completions") || existing.includes("_helius()")) {
    console.log(chalk.yellow(`Completions already installed in ${target}`));
    console.log(chalk.gray("To reinstall, remove the existing clawd-cli completion block first."));
    return;
  }

  fs.appendFileSync(target, "\n" + script);
  console.log(chalk.green(`Completions installed to ${target}`));
  console.log(chalk.gray(`Run ${chalk.white(`source ${target}`)} or open a new terminal to activate.`));
}
