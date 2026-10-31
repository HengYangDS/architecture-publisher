package ci

import (
	"list"
	"strings"
)

// Raster identity is supplied by the existing source manifest, not copied here.
source: registry: {version: string, file: string}

// Shared execution and native prerequisites have one owner, independent of peers.
shared: {
	"platforms": [
		"linux",
		"macos",
		"windows",
	]
	"trustRoles": [
		"review",
		"protected",
	]

	"timeLimitMinutes": 75
	"miseVersion":      "2026.10.25"
	"environment": {
		workspace: string
		variables: {
			MISE_ENV:                  "ci"
			MISE_LOCKED:               "1"
			MISE_HTTP_TIMEOUT:         "180s"
			MISE_DATA_DIR:             "\(workspace)/build/runtime/tool-cache/mise"
			MISE_CACHE_DIR:            "\(workspace)/build/runtime/tool-cache/mise/cache"
			MISE_TRUSTED_CONFIG_PATHS: workspace
			PLAYWRIGHT_BROWSERS_PATH:  "\(workspace)/build/runtime/tool-cache/playwright"
		}
	}
	"verification": {
		"stage":         "verify"
		"interruptible": true
		"timeout":       "\(shared.timeLimitMinutes)m"
	}
	"toolPreparation": [
		"mise --version",
		"mise install",
		"mise exec -- rustup component add rust-std",
		"mise exec -- node --version",
		"mise exec -- npm --version",
		"git --version",
		"mise exec -- npm ci --ignore-scripts --no-audit --no-fund",
		"mise run raster-supply",
		"mise exec -- npm run generate",
		"mise exec -- npm run check:ci",
	]
	"readerPreparation": [
		"mise exec -- node node_modules/playwright-core/cli.js install chromium",
		"mise exec -- node --import=./tests/fixtures/npm-environment.mjs --test --test-force-exit --test-name-pattern=standalone tests/map-browser.test.mjs",
	]
	"preparation": list.Concat([shared.toolPreparation, shared.readerPreparation])
	"acceptance": [
		"mise exec -- node tools/raster/resvg/verify.mjs --archive build/runtime/tool-cache/raster/source.tar.xz",
		"mise exec -- node --test tests/conformance/journeys/raster/rebuild.test.mjs",
		"mise exec -- npm run check",
	]
	"assetPreparation": [
		"mise exec -- node -e \"require('node:fs').mkdirSync('build/runtime/tool-cache/raster',{recursive:true})\""
	]
	"platformSetup": {
		workspace: string
		"linux": {
			"before_script": []
			"prerequisites": [
				"xz --version",
				"aarch64-conda-linux-gnu-cc --version",
			]
			"executor": "mise exec -- pixi run --locked --config-file .config/ci/linux/pixi-config.toml --manifest-path .config/ci/linux/pixi.toml --executable "
			"variables": {
				PIXI_HOME:      "\(workspace)/build/runtime/work/native-linux-prerequisites/home"
				PIXI_CACHE_DIR: "\(workspace)/build/runtime/tool-cache/pixi"
			}
		}
		"macos": {
			"before_script": []
			"prerequisites": []
			"executor": "mise exec -- "
			"variables": {}
		}
		"windows": {
			"before_script": []
			"prerequisites": []
			"executor": "mise exec -- "
			"variables": {
				"GIT_CONFIG_COUNT":   "1"
				"GIT_CONFIG_KEY_0":   "core.longPaths"
				"GIT_CONFIG_VALUE_0": "true"
			}
		}
	}
}

// The selected peer binds only native events, workspace, runners and transport.
peers: gitlab: {
	"workflow": {
		"rules": [
			{
				"if": "$CI_PIPELINE_SOURCE == \"merge_request_event\""
			},
			{
				"if": "$CI_COMMIT_TAG || $CI_COMMIT_REF_PROTECTED == \"true\""
			},
			{
				"if":   "$CI_PIPELINE_SOURCE == \"push\" && $CI_COMMIT_BRANCH && $CI_OPEN_MERGE_REQUESTS"
				"when": "never"
			},
			{
				"if": "$CI_COMMIT_BRANCH"
			},
		]
	}
	"image": {
		"name": "hengyang2003/architecture-publisher-ci@sha256:d9a2c26c3e30a5966695a1acfd83cb9056747f3d89e739481b27b4819fa3a1c4"
	}
	"variables": {
		"GIT_DEPTH":       "0"
		"GIT_STRATEGY":    "fetch"
		"GIT_CLEAN_FLAGS": "-ffdx -e build/runtime/tool-cache/"
	} & (shared.environment & {workspace: peers.gitlab.workspace}).variables
	"artifacts": {
		"when":      "always"
		"expire_in": "7 days"
		"paths": [
			"coverage/coverage-summary.json"
		]
	}
	"transport": [
		"mise exec -- node tools/raster/resvg/verify.mjs --registry-url > build/runtime/tool-cache/raster/source-url.txt",
		"curl --fail --silent --show-error --connect-timeout 15 --max-time 180 --variable source@build/runtime/tool-cache/raster/source-url.txt --expand-url \"{{source:trim}}\" --variable %CI_JOB_TOKEN --expand-header \"JOB-TOKEN: {{CI_JOB_TOKEN}}\" --output build/runtime/tool-cache/raster/source.tar.xz",
	]
	"platforms": {
		"linux": {
			"bootstrap": [
				"curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' --connect-timeout 15 --max-time 180 --create-dirs --output build/runtime/tool-cache/mise/bootstrap/mise.download https://github.com/jdx/mise/releases/download/v\(shared.miseVersion)/mise-v\(shared.miseVersion)-linux-arm64",
				"sha256sum --strict --check .config/ci/linux/mise.sha256",
				"install --mode=0755 build/runtime/tool-cache/mise/bootstrap/mise.download build/runtime/tool-cache/mise/bootstrap/mise",
				// A job variable cannot extend the image's PATH: GitLab does not expand
				// $PATH there, and the shell would then find no `rm` or `hostname`.
				"export PATH=\"\(peers.gitlab.workspace)/build/runtime/tool-cache/mise/bootstrap:$PATH\"",
			]
			"variables": {
				"FF_USE_INIT_WITH_DOCKER_EXECUTOR":     "true"
				"FF_DISABLE_UMASK_FOR_DOCKER_EXECUTOR": "true"
				"PLAYWRIGHT_BROWSERS_PATH":             "/ms-playwright"
			}
		}
		"macos": {
			"bootstrap": []
			"variables": {}
			"image":          null
			"resource_group": "native-macos-verification"
		}
		"windows": {
			"bootstrap": [
				"git checkout-index --all --force",
				"$env:PATH = (Join-Path $env:ProgramFiles \"mise/bin\") + [IO.Path]::PathSeparator + $env:PATH",
			]
			// The runner refuses Mise's default copies of mise-shim.exe; the jobs
			// run tools through `mise exec`, which needs no shim. The MSVC linker
			// opens no path of 260 characters or more, and under the protected
			// runner's build directory a Rust standard library file in the
			// workspace's tool cache takes 260, so the Rust toolchain stays under
			// the runner's builds directory.
			"variables": {
				"MISE_WINDOWS_SHIM_MODE": "file"
				"MISE_RUSTUP_HOME":       "$CI_BUILDS_DIR/tool-cache/rustup"
				"MISE_CARGO_HOME":        "$CI_BUILDS_DIR/tool-cache/cargo"
			}
			"image":          null
			"resource_group": "native-windows-verification"
			"interruptible":  true
			"timeout":        shared.verification.timeout
		}
	}
	"runners": {
		"linux": {
			"review":    "ci-linux-arm64-container"
			"protected": "ci-linux-arm64-container-protected"
		}
		"macos": {
			"review":    "ci-macos-arm64-review"
			"protected": "ci-macos-arm64-shell"
		}
		"windows": {
			"review":    "ci-windows-arm64-review"
			"protected": "ci-windows-arm64-shell"
		}
	}
	"rules": {
		"review": [
			{
				"if": "$CI_PIPELINE_SOURCE == \"merge_request_event\""
			},
			{
				"if": "$CI_COMMIT_REF_PROTECTED != \"true\" && $CI_COMMIT_BRANCH"
			},
		]
		"protected": [
			{
				"if": "$CI_COMMIT_REF_PROTECTED == \"true\""
			}
		]
	}
	"workspace": "$CI_PROJECT_DIR"
}

compiled: gitlab: {
	path: ".gitlab-ci.yml"
	let nativePlatforms = shared.platformSetup & {workspace: peers.gitlab.workspace}
	document: {
		workflow:  peers.gitlab.workflow
		image:     peers.gitlab.image
		variables: peers.gitlab.variables
		stages: [shared.verification.stage]
		".verify-native": shared.verification & {
			artifacts: peers.gitlab.artifacts
			script: list.Concat([shared.preparation, shared.assetPreparation, peers.gitlab.transport, shared.acceptance])
		}
		for platform in shared.platforms {
			let native = nativePlatforms[platform]
			let peer = peers.gitlab.platforms[platform]
			".verify-\(platform)": {
				extends: ".verify-native"
				if platform == "windows" {before_script: list.Concat([peer.bootstrap, native.before_script])}
				if platform != "windows" {before_script: list.Concat([native.before_script, peer.bootstrap])}
				if platform == "linux" {
					script: list.Concat([shared.preparation, shared.assetPreparation, peers.gitlab.transport,
						[for command in native.prerequisites {native.executor + command}],
						[for command in shared.acceptance {native.executor + strings.TrimPrefix(command, "mise exec -- ")}],
					])
				}
				variables: native.variables & peer.variables
				for key, value in peer if key != "bootstrap" && key != "variables" {"\(key)": value}
			}
			for role in shared.trustRoles {
				"verify:\(platform):\(role)": {
					extends: ".verify-\(platform)"
					tags: [peers.gitlab.runners[platform][role]]
					rules: peers.gitlab.rules[role]
				}
			}
		}
	}
}

peers: github: {
	repository: "HengYangDS/architecture-publisher"
	workspace:  "${{ github.workspace }}"
	events: {pull_request: null, push: null, workflow_dispatch: null}
	permissions: contents: "read"
	trust: {
		review:    "${{ github.event_name == 'pull_request' || (github.ref_type == 'branch' && !github.ref_protected) }}"
		protected: "${{ github.event_name != 'pull_request' && (github.ref_protected || github.ref_type == 'tag') }}"
	}
	platforms: {
		linux: {runner: "ubuntu-24.04-arm", shell: "bash", readerPrerequisites: [
			"mise exec -- node node_modules/playwright-core/cli.js install-deps chromium",
		]}
		macos: {runner: "macos-15", shell: "bash", readerPrerequisites: []}
		windows: {runner: "windows-11-arm", shell: "pwsh", readerPrerequisites: []}
	}
	checkout: {
		uses: "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1"
		with: {
			ref:                   "${{ github.event.pull_request.head.sha || github.sha }}"
			"fetch-depth":         0
			"persist-credentials": false
		}
	}
	bootstrap: {
		uses: "jdx/mise-action@6612f0ef07ed2a736cd1e00a94a065522dd41195"
		with: {
			version:           shared.miseVersion
			install:           false
			cache:             false
			env:               false
			export_path:       false
			add_shims_to_path: false
		}
	}
	transport: {
		name: "Retrieve exact Raster source closure"
		env: {GH_TOKEN: "${{ github.token }}", GH_PROMPT_DISABLED: "1"}
		run: "gh release download \"\(source.registry.version)\" --repo \(peers.github.repository) --pattern \(source.registry.file) --dir build/runtime/tool-cache/raster"
	}
	artifacts: {
		uses: "actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9"
		if:   "${{ always() }}"
		with: {
			name:                "coverage-${{ github.job }}"
			path:                "coverage/coverage-summary.json"
			"retention-days":    7
			"if-no-files-found": "error"
		}
	}
}

compiled: github: {
	path: ".github/workflows/verify.yml"
	let peer = peers.github
	let nativePlatforms = shared.platformSetup & {workspace: peer.workspace}
	document: {
		name:        "Architecture Publisher verification"
		on:          peer.events
		permissions: peer.permissions
		env: (shared.environment & {workspace: peer.workspace}).variables
		jobs: {
			for platform in shared.platforms {
				let native = nativePlatforms[platform]
				let runner = peer.platforms[platform]
				for role in shared.trustRoles {
					"verify-\(platform)-\(role)": {
						name:              "\(platform) / \(role)"
						if:                peer.trust[role]
						"runs-on":         runner.runner
						"timeout-minutes": shared.timeLimitMinutes
						concurrency: {group: "${{ github.workflow }}-${{ github.ref }}-\(platform)-\(role)", "cancel-in-progress": shared.verification.interruptible}
						defaults: run: shell: runner.shell
						if len(native.variables) > 0 {env: native.variables}
						steps: list.Concat([
							[peer.checkout, peer.bootstrap],
							[for command in native.before_script {run: command}],
							[for command in list.Concat([shared.toolPreparation, runner.readerPrerequisites, shared.readerPreparation, shared.assetPreparation]) {run: command}],
							[peer.transport],
							[for command in native.prerequisites {run: native.executor + command}],
							[for command in shared.acceptance {run: native.executor + strings.TrimPrefix(command, "mise exec -- ")}],
							[peer.artifacts],
						])
					}
				}
			}
		}
	}
}
