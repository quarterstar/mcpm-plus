# MCPM-Plus

A continuation fork of [mcpm-aider](https://github.com/lutzleonhardt/mcpm-aider) (a fork of [mcpm/cli](https://github.com/mcp-club/cli)) that aims to fix issues with modern MCP clients and adds new features, including:

- persistent session store, for servers like playwright-mcp
- nix support

Made by Quarterstar.

## Installation

### With Nix Flakes

First, you can test the Flake without adding it to your configuration with the Nix command line:

```bash
nix run "github:quarterstar/mcpm-plus?submodules=1"
```

Once you are satisfied, add it to your `flake.nix`:

```nix
{
  inputs = {
    mcpm = {
      url = "github:quarterstar/mcpm";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
}
```

Make sure that you propagate the `inputs` attribute set to your NixOS module entrypoint via `specialArgs`.

Then, install it in a NixOS module:

```nix
{ pkgs, inputs, ... }:

{
  environment.systemPackages = [
    inputs.mcpm.packages.${pkgs.stdenv.hostPlatform.system}.default
  ];
}
```

Alternatively, if you are in a Home Manager module:

```nix
{ pkgs, inputs, ... }:

{
  home.packages = [
    inputs.mcpm.packages.${pkgs.stdenv.hostPlatform.system}.default
  ];
}
```

### Other Systems

TODO

## Usage

Modify your MCP configuration to use the proxy's address and port. Your configuration should be located at either the canonical `$XDG_CONFIG_HOME/mcp/mcp.json` file or `$XDG_CONFIG_HOME/claude/claude_desktop_config.json`.

Then, in agentic programs like Aider, use the following command to add the available tools to the LLM's context:

```bash
mcpm dump
```

For example, in Aider, run:

```sh
/run mcpm dump
```

## License

This project is licensed under the [AGPL 3.0](./LICENSE) license.
