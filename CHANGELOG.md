# Changelog

## [1.46.2](https://github.com/swan-io/swan-partner-frontend/compare/v1.46.1...v1.46.2) (2026-11-10)


### Bug Fixes

* accept 9-digit Gambian phone numbers (#52) ([12cbe5c](https://github.com/swan-io/swan-partner-frontend/commit/12cbe5c0d915818d82f2cc68ae1a091e10426189))
* **banking:** omit empty UBO birth date from the re-KYC ownership save (FRONT-2371) (#56) ([f95546d](https://github.com/swan-io/swan-partner-frontend/commit/f95546dcb8d9a5c146601d3a155d35bc39682d0d))
* **ci:** run Localazy CLI instead of Docker action in download-translations (#49) (02fde99)
* **deps:** patch brace-expansion, postcss and svgo in docs (FRONT-2349) (#53) ([f4b277d](https://github.com/swan-io/swan-partner-frontend/commit/f4b277dc95663dc56e12438f91c2bf5f3f7a425b))


### Miscellaneous Chores

* **i18n:** update translations (#54) ([846f9eb](https://github.com/swan-io/swan-partner-frontend/commit/846f9eb81abaafbce0dbd79c02638013d38e9da4))
* **i18n:** update translations from localazy ([846f9eb](https://github.com/swan-io/swan-partner-frontend/commit/846f9eb81abaafbce0dbd79c02638013d38e9da4))

## [1.46.1](https://github.com/swan-io/swan-partner-frontend/compare/v1.46.0...v1.46.1) (2026-11-06)


### Bug Fixes

* **banking:** align re-KYC UBO validation with the backend and explain finalize rejections (FRONT-2341) (#46) ([9c57556](https://github.com/swan-io/swan-partner-frontend/commit/9c57556deec533e341c1dbd607246aeff85cb606))
* **deps:** patch high vulnerabilities in nanoid, ws and docs toolchain (FRONT-2344) (#38) ([ad857d8](https://github.com/swan-io/swan-partner-frontend/commit/ad857d889273af5ab1de6c3141ec2f8427889efd))


### Miscellaneous Chores

* **i18n:** update translations (#40) ([54f07ed](https://github.com/swan-io/swan-partner-frontend/commit/54f07ed3492a79d72f5766c5fc899989331767be))
* **i18n:** update translations from localazy ([54f07ed](https://github.com/swan-io/swan-partner-frontend/commit/54f07ed3492a79d72f5766c5fc899989331767be))


### Continuous Integration

* **ENP-6739:** add the hotfix lane workflow (#41) (6f6d9dd)
* repin reusable-workflows to v5.1.0 (#43) (908a7fa)

## [1.46.0](https://github.com/swan-io/swan-partner-frontend/compare/v1.45.0...v1.46.0) (2026-11-03)


### Features

* **banking:** default transaction list to the last 3 months (FRONT-2328) (#31) ([b414415](https://github.com/swan-io/swan-partner-frontend/commit/b4144152bccf52d9e7c3b3f43e4fca519d850c7e))


### Bug Fixes

* **banking:** don't send a search below 3 characters (FRONT-2329) (#28) ([b3a1d77](https://github.com/swan-io/swan-partner-frontend/commit/b3a1d77286b7804c42325fad2746f0fe5122ad29))


### Continuous Integration

* repin reusable-workflows to v4.3.2 (#32) (2ccb526)
* repin reusable-workflows to v4.3.3 (#33) (dd9f4eb)
* repin reusable-workflows to v5.0.0 (#35) (09ac063)

## [1.45.0](https://github.com/swan-io/swan-partner-frontend/compare/v1.44.1...v1.45.0) (2026-11-02)


### Features

* **onboarding:** send projectId in publicCompanyInfoRegistryData query (FRONT-2332) (#22) ([615099d](https://github.com/swan-io/swan-partner-frontend/commit/615099d5768044531d3e96957834b5e79bc3281a))


### Miscellaneous Chores

* declare sibling repos for Claude Code and keep AGENTS.md private (2e661e6)
* declare sibling repos for Claude Code and keep AGENTS.md private FRONT-2225 (#21) (2e661e6)
* **i18n:** update translations (#23) ([1f4a34d](https://github.com/swan-io/swan-partner-frontend/commit/1f4a34d7f154131737b4f0ca45c68c385f26b549))
* **i18n:** update translations from localazy ([1f4a34d](https://github.com/swan-io/swan-partner-frontend/commit/1f4a34d7f154131737b4f0ca45c68c385f26b549))


### Continuous Integration

* repin reusable-workflows to v4.1.2 (#18) ([82193e7](https://github.com/swan-io/swan-partner-frontend/commit/82193e7fcc8d17a855c506c15ea6214cb8355e5a))
* repin reusable-workflows to v4.1.3 (#20) (b3d4f25)

## [1.44.1](https://github.com/swan-io/swan-partner-frontend/compare/v1.44.0...v1.44.1) (2026-10-29)


### Bug Fixes

* **onboarding:** improve postal code validation for company flow (#17) ([94a30c6](https://github.com/swan-io/swan-partner-frontend/commit/94a30c65cfcea81c76e84fc3a23ea5a4e85295cb))
* **onboarding:** show invalid server errors on onboarding fields (FRONT-2324) (#9) ([671166e](https://github.com/swan-io/swan-partner-frontend/commit/671166e86244b9145797b390361bca44cec94699))
* show error screen when finalizeVerificationRenewal returns a rejection (FRONT-2330) (#16) ([5e00304](https://github.com/swan-io/swan-partner-frontend/commit/5e003043571281b90a20e6c8e5522a3f05e369b4))


### Miscellaneous Chores

* **i18n:** update translations (#12) ([9ee6676](https://github.com/swan-io/swan-partner-frontend/commit/9ee6676469fa9eb944d8ba0784846f5463cb5898))
* **i18n:** update translations from localazy ([9ee6676](https://github.com/swan-io/swan-partner-frontend/commit/9ee6676469fa9eb944d8ba0784846f5463cb5898))
* **release:** show chore and ci commits in release notes (#13) ([8a695f9](https://github.com/swan-io/swan-partner-frontend/commit/8a695f9d99c122912cf539316820246515f94632))


### Continuous Integration

* **release:** run e2e suite against preprod after rollout (#14) (13a4a5e)

## [1.44.0](https://github.com/swan-io/swan-partner-frontend/compare/v1.43.3...v1.44.0) (2026-10-28)


### Features

* **account:** handle canmanagebeneficiaries permission error #ACC-2300 (#3) ([de1013f](https://github.com/swan-io/swan-partner-frontend/commit/de1013f73088c9824f45f2298126bd9a9132ce7a))
