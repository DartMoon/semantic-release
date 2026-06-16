const Configuration = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    'type-empty': [2, 'never'],
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'build', 'ci', 'revert']],
    // 'scope-empty': [2, 'never'],
    'scope-enum': [2, 'always', ['test', 'ui', 'storybook']],
  },
};

export default Configuration;
