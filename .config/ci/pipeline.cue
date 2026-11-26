package ci

import (
	"list"
)

// Shared execution and native prerequisites have one owner, independent of peers.
shared: {
	"platforms": [
		"linux",
		"macos",
	]
	"trustRoles": [
		"review",
		"protected",
	]

	"timeLimitMinutes": 75
	"miseVersion":      "2026.11.14"
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
			// Archify's answers stand in the tool cache, kept between a guest's jobs and, on GitHub, by `answers`.
			ARCHPUB_ARCHIFY_ANSWERS_ROOT: "\(workspace)/build/runtime/tool-cache"
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
	}
}

// The selected peer binds only native events, workspace, runners and transport.
peers: gitlab: {
	"workflow": {
		"rules": [
			// No pipeline for a tag or a push of dev, the owner's trial of 2026-11-22 (measured again on 2026-12-06):
			// dev is published only at a commit that a proposal branch's pipeline has run with the same commands,
			// and a release commit is verified when main moves. A release first starts one pipeline of dev through
			// the API, which the protected rule below takes.
			{
				"if":   "$CI_COMMIT_TAG"
				"when": "never"
			},
			{
				"if":   "$CI_COMMIT_BRANCH == \"dev\" && $CI_PIPELINE_SOURCE == \"push\""
				"when": "never"
			},
			{
				"if": "$CI_PIPELINE_SOURCE == \"merge_request_event\""
			},
			{
				"if": "$CI_COMMIT_REF_PROTECTED == \"true\""
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
			// The staged release carries its own name and stays in the tool cache, which a job's clean
			// spares: Curl resumes a partial file and fetches nothing where the runner holds the release
			// whole. On 2026-11-20 the guest's network gave 0.2 MB/s, and a download of every job capped
			// at 180 s failed two jobs before any test ran. Each step is one native command.
			let asset = "mise-v\(shared.miseVersion)-linux-arm64"
			let staged = "build/runtime/tool-cache/mise/bootstrap/\(asset)"
			"bootstrap": [
				"curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' --connect-timeout 15 --max-time 900 --continue-at - --create-dirs --output \(staged) https://github.com/jdx/mise/releases/download/v\(shared.miseVersion)/\(asset)",
				"sha256sum --strict --check .config/ci/linux/mise.sha256",
				"install --mode=0755 \(staged) build/runtime/tool-cache/mise/bootstrap/mise",
				// A job variable cannot extend the image's PATH: GitLab does not expand
				// $PATH there, and the shell would then find no `rm` or `hostname`.
				"export PATH=\"\(peers.gitlab.workspace)/build/runtime/tool-cache/mise/bootstrap:$PATH\"",
			]
			// Chromium stands in the job's tool cache, as on the other platforms. The image's own browsers are
			// those of the Playwright release it was built from; a job that kept them in the image's path fetched
			// Chromium anew whenever the lockfile's release was another (every job from 2026-11-10 to 2026-11-22).
			"variables": {
				"FF_USE_INIT_WITH_DOCKER_EXECUTOR":     "true"
				"FF_DISABLE_UMASK_FOR_DOCKER_EXECUTOR": "true"
			}
		}
		"macos": {
			"bootstrap": []
			"variables": {}
			"image":          null
			"resource_group": "native-macos-verification"
		}
	}
	// A job's tags, every one of which its runner must hold. macOS takes the label GitHub's hosted runner has, and
	// the trust role, as every repository ETHOS governs does (the owner's choice of 2026-11-25 13:54).
	"runners": {
		"linux": {
			"review": ["ci-linux-arm64-container"]
			"protected": ["ci-linux-arm64-container-protected"]
		}
		"macos": {
			"review": ["macos-latest", "review"]
			"protected": ["macos-latest", "protected"]
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
				before_script: list.Concat([native.before_script, peer.bootstrap])
				variables: native.variables & peer.variables
				for key, value in peer if key != "bootstrap" && key != "variables" {"\(key)": value}
			}
			for role in shared.trustRoles {
				"verify:\(platform):\(role)": {
					extends: ".verify-\(platform)"
					tags:    peers.gitlab.runners[platform][role]
					rules:   peers.gitlab.rules[role]
				}
			}
		}
	}
}

peers: github: {
	repository: "HengYangDS/architecture-publisher"
	workspace:  "${{ github.workspace }}"
	// No run for a push of dev, as on GitLab (the owner's trial, widened to GitHub on 2026-11-23 and measured on
	// 2026-12-06): dev is published only at a commit a proposal branch has run with the same commands. Tags still
	// run; a push filter that named branches alone would drop them.
	events: {pull_request: null, push: {"branches-ignore": ["dev"], tags: ["**"]}, workflow_dispatch: null}
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
	}
	// Each shared platform runs on ARM64, as on GitLab; GitHub alone also verifies Linux on x86-64, for the release's
	// archive of that platform. No Windows: the owner's rule for every repository ETHOS governs (2026-11-25).
	platforms: {
		linux: {runner: "ubuntu-24.04-arm", system: "linux"}
		macos: {runner: "macos-latest", system: "macos"}
		"linux-x64": {runner: "ubuntu-24.04", system: "linux"}
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
		uses: "jdx/mise-action@924e7c586e33d7d4bae9c14e26c5d22e2beb6e78"
		with: {
			version:           shared.miseVersion
			install:           false
			cache:             false
			env:               false
			export_path:       false
			add_shims_to_path: false
		}
	}
	// A hosted review job is a fresh machine: Archify's answers come back from GitHub's cache, the newest of the
	// platform's, and the job's own are saved under a key of its run. An answer is keyed by everything it depends
	// on, so an old one is only unused. A protected job runs without them, from nothing, as a release is verified.
	answers: {
		uses: "actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9" // v6.1.0
		with: {
			path:           "build/runtime/tool-cache/archpub-test-answers"
			key:            "archify-answers-${{ runner.os }}-${{ runner.arch }}-${{ github.run_id }}"
			"restore-keys": "archify-answers-${{ runner.os }}-${{ runner.arch }}-"
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
							[peer.bootstrap],
							[if role == "review" {peer.answers}],
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
