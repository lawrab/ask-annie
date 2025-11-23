{
  description = "Ask Annie - Health symptom tracking application";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };

        playwright-mcp-wrapper = pkgs.writeShellScriptBin "playwright-mcp-wrapper" ''
          # Set environment variables
          export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"
          export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true

          # Create profile directories
          mkdir -p "$HOME/.local/share/playwright-mcp/chrome-profile"
          mkdir -p "$HOME/.local/share/playwright-mcp/firefox-profile"

          # Parse arguments to determine browser and set executable path
          EXEC_PATH_ARG=""
          USER_DATA_ARG=""

          for arg in "$@"; do
            case $arg in
              --browser=chrome|--browser=chromium)
                EXEC_PATH_ARG="--executable-path=${pkgs.chromium}/bin/chromium"
                USER_DATA_ARG="--user-data-dir=$HOME/.local/share/playwright-mcp/chrome-profile"
                ;;
              --browser=firefox)
                EXEC_PATH_ARG="--executable-path=${pkgs.firefox}/bin/firefox"
                USER_DATA_ARG="--user-data-dir=$HOME/.local/share/playwright-mcp/firefox-profile"
                ;;
            esac
          done

          # Default to chromium if no browser specified
          if [ -z "$EXEC_PATH_ARG" ]; then
            EXEC_PATH_ARG="--executable-path=${pkgs.chromium}/bin/chromium"
            USER_DATA_ARG="--user-data-dir=$HOME/.local/share/playwright-mcp/chrome-profile"
          fi

          # Launch Playwright MCP server
          exec ${pkgs.nodejs_22}/bin/npx @playwright/mcp@latest \
            $EXEC_PATH_ARG \
            $USER_DATA_ARG \
            "$@"
        '';
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            gnumake
            nodejs_22
            chromium
            firefox
            playwright-driver.browsers
            playwright-mcp-wrapper
            mongodb-tools
          ];

          shellHook = ''
            # Playwright MCP profile directories are created by the wrapper script
          '';
        };

        packages.playwright-mcp-wrapper = playwright-mcp-wrapper;
      }
    );
}
