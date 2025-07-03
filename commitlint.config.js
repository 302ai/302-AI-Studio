module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "chore",
        "ci",
        "build",
        "revert",
      ],
    ],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [0],
    "scope-case": [2, "always", "lower-case"],
    "subject-case": [
      2,
      "never",
      ["sentence-case", "start-case", "pascal-case", "upper-case"],
    ],
    "subject-empty": [0],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 200],
    "body-leading-blank": [1, "always"],
    "body-max-line-length": [2, "always", 200],
    "footer-leading-blank": [1, "always"],
    "footer-max-line-length": [2, "always", 200],
  },
  parserPreset: {
    parserOpts: {
      headerPattern: /^(:\w+:\s)?(?:(\w+)(?:\(([^)]*)\))?: )?(.*)/,
      headerCorrespondence: ["gitmoji", "type", "scope", "subject"],
    },
  },
};
