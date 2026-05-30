builder
FROM docker.io/library/node:22-slim@sha256:7af03b14a13c8cdd38e45058fd957bf00a72bbe17feac43b1c15a689c029c732
11ms

builder
WORKDIR /app cached
0ms

builder
RUN npm install -g pnpm cached
141ms
scheduling build on Metal builder "builder-emkgde"
fetched snapshot sha256:fd0bfee28f9eb69504cd4a0d0cd44b304329de0867fa273eed5ee3a62384aaa7 (5.3 MB bytes)
fetching snapshot
5 MB
1.2s
unpacking archive
6 MB
34ms

internal
load build definition from Dockerfile
0ms

internal
load metadata for docker.io/library/node:22-slim
6s

internal
load .dockerignore
0ms

internal
load build context
0ms

builder
COPY . . cached
149ms

builder
RUN pnpm install --no-frozen-lockfile --config.confirmModulesPurge=false
17s
[WARN] The "pnpm" field in package.json is no longer read by pnpm. The following keys were ignored: "pnpm.overrides". See https://pnpm.io/settings for the new home of each setting.
Scope: all 10 workspace projects
? Verifying lockfile against supply-chain policies (714 entries)...
✓ Lockfile passes supply-chain policies (714 entries in 3.2s)
Progress: resolved 1, reused 0, downloaded 0, added 0
artifacts/braids-booking                 | [WARN] deprecated recharts@2.15.4
Progress: resolved 79, reused 0, downloaded 72, added 0
Progress: resolved 150, reused 0, downloaded 94, added 0
Progress: resolved 290, reused 0, downloaded 264, added 0
Progress: resolved 523, reused 0, downloaded 518, added 0
[WARN] 3 deprecated subdependencies found: node-domexception@1.0.0, uuid@8.3.2, uuid@9.0.1
Progress: resolved 590, reused 0, downloaded 588, added 0
Packages: +588
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 590, reused 0, downloaded 588, added 588, done
. preinstall$ sh -c 'rm -f package-lock.json yarn.lock; case "$npm_config_user_agent" in pnpm/*) ;; *) echo "Use pnpm instead" >&2; exit 1 ;; esac'
. preinstall: Done
devDependencies:
+ prettier 3.8.1 (3.8.3 is available)
+ typescript 5.9.3 (6.0.3 is available)
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild@0.27.3
Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
Build Failed: build daemon returned an error < failed to solve: process "/bin/sh -c pnpm install --no-frozen-lockfile --config.confirmModulesPurge=false" did not complete successfully: exit code: 1 >
