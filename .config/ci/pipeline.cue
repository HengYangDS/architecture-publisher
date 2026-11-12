package ci

import (
	"list"
)

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
	"miseVersion":      "2026.11.5"
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
		"mise exec -- node --version",
		"mise exec -- npm --version",
		"git --version",
		"mise exec -- npm ci --ignore-scripts --no-audit --no-fund",
		"mise exec -- npm run generate",
		"mise exec -- npm run check:ci",
	]
	"readerPreparation": [
		"mise exec -- node node_modules/playwright-core/cli.js install chromium",
		"mise exec -- node --import=./tests/fixtures/npm-environment.mjs --test --test-force-exit --test-name-pattern=standalone tests/map-browser.test.mjs",
	]
	"preparation": list.Concat([shared.toolPreparation, shared.readerPreparation])
	"acceptance": [
		"mise exec -- node --test --test-force-exit tests/conformance/journeys/command/archive.test.mjs",
		"mise exec -- npm run check",
	]
	"platformSetup": {
		workspace: string
		"linux": {
			"before_script": []
			"variables": {}
		}
		"macos": {
			"before_script": []
			"variables": {}
		}
		"windows": {
			"before_script": []
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
		"name": "hengyang2003/architecture-publisher-ci@sha256:2c7fb34278a83a3f8749776adad540588068c24a6119760d2635eb9a96d619a6"
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
			// run tools through `mise exec`, which needs no shim.
			"variables": {
				"MISE_WINDOWS_SHIM_MODE": "file"
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
			script: list.Concat([shared.preparation, shared.acceptance])
		}
		for platform in shared.platforms {
			let native = nativePlatforms[platform]
			let peer = peers.gitlab.platforms[platform]
			".verify-\(platform)": {
				extends: ".verify-native"
				if platform == "windows" {before_script: list.Concat([peer.bootstrap, native.before_script])}
				if platform != "windows" {before_script: list.Concat([native.before_script, peer.bootstrap])}
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
	systems: {
		linux: {shell: "bash", readerPrerequisites: [
			"mise exec -- node node_modules/playwright-core/cli.js install-deps chromium",
		]}
		macos: {shell: "bash", readerPrerequisites: []}
		windows: {shell: "pwsh", readerPrerequisites: []}
	}
	// Each shared platform runs on ARM64; GitHub alone also verifies Linux and Windows on x86-64.
	platforms: {
		linux: {runner: "ubuntu-24.04-arm", system: "linux"}
		macos: {runner: "macos-15", system: "macos"}
		windows: {runner: "windows-11-arm", system: "windows"}
		"linux-x64": {runner: "ubuntu-24.04", system: "linux"}
		// Hosted x86-64 Windows keeps the workspace on D: and the system temporary directory on C:, so
		// mise-action's move of the mise it downloads into the workspace fails across the drives; its step
		// takes the runner's temporary directory, on the workspace's drive. The runner context is not
		// available in a job's env, only in a step's.
		"windows-x64": {runner: "windows-2025", system: "windows", bootstrapEnv: {TEMP: "${{ runner.temp }}", TMP: "${{ runner.temp }}"}}
	}
	// A release tag publishes the package to npm through GitHub's OIDC once its owner has
	// registered the package and set the repository variable.
	publication: {
		if:     "${{ github.ref_type == 'tag' && vars.NPM_PUBLISH == 'enabled' }}"
		runner: "ubuntu-24.04"
		permissions: {contents: "read", "id-token": "write"}
		command: "mise exec -- npm publish --provenance"
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
		uses: "jdx/mise-action@b44d12e7d0d8ee7461bb893e1b1993500433185b"
		with: {
			version:           shared.miseVersion
			install:           false
			cache:             false
			env:               false
			export_path:       false
			add_shims_to_path: false
		}
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
			for platform, target in peer.platforms {
				let native = nativePlatforms[target.system]
				let system = peer.systems[target.system]
				for role in shared.trustRoles {
					"verify-\(platform)-\(role)": {
						name:              "\(platform) / \(role)"
						if:                peer.trust[role]
						"runs-on":         target.runner
						"timeout-minutes": shared.timeLimitMinutes
						concurrency: {group: "${{ github.workflow }}-${{ github.ref }}-\(platform)-\(role)", "cancel-in-progress": shared.verification.interruptible}
						defaults: run: shell: system.shell
						if len(native.variables) > 0 {env: native.variables}
						steps: list.Concat([
							[peer.checkout],
							[if target.bootstrapEnv == _|_ {peer.bootstrap}, if target.bootstrapEnv != _|_ {peer.bootstrap & {env: target.bootstrapEnv}}],
							[for command in native.before_script {run: command}],
							[for command in list.Concat([shared.toolPreparation, system.readerPrerequisites, shared.readerPreparation, shared.acceptance]) {run: command}],
							[peer.artifacts],
						])
					}
				}
			}
			"publish-npm": {
				name: "npm / publish"
				needs: [for platform, _ in peer.platforms {"verify-\(platform)-protected"}]
				if:                peer.publication.if
				"runs-on":         peer.publication.runner
				"timeout-minutes": shared.timeLimitMinutes
				permissions:       peer.publication.permissions
				defaults: run: shell: "bash"
				steps: list.Concat([
					[peer.checkout, peer.bootstrap],
					[for command in shared.toolPreparation {run: command}],
					[{run: peer.publication.command}],
				])
			}
		}
	}
}
