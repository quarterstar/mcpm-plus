{
  description = "A flake to build mcpm with native Draft 2020-12 schema validation support";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
        lib = pkgs.lib;
      in
      {
        packages.default = pkgs.buildNpmPackage rec {
          pname = "mcpm";
          version = "58a9c35e4ee53b322cef5bd457fee3135d464257";

          src = lib.cleanSource ./.;

          npmDepsHash = "sha256-mY+Te6eHHr82o/6vpuZkKtThP5do6NfGMdir4GEDce4=";
          npmBuildScript = "build";
          npmFlags = [ "--legacy-peer-deps" ];

          postInstall = ''
            echo "Installing compiled TypeScript artifacts..."
            mkdir -p $out/lib/node_modules/${pname}/dist

            if [ -d "dist" ]; then
              cp -r dist/* $out/lib/node_modules/${pname}/dist/
            elif [ -d "build" ]; then
              mkdir -p $out/lib/node_modules/${pname}/build
              cp -r build/* $out/lib/node_modules/${pname}/build/
            fi
          '';

          nativeBuildInputs = [ pkgs.nodejs ];
          buildInputs = [ pkgs.nodejs ];

          meta = {
            mainProgram = "mcpm";
          };
        };

        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs
          ];
        };
      }
    );
}
