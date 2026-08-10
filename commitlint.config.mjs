export default {
  extends: ['@commitlint/config-conventional'],

  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],

    'header-min-length': [2, 'always', 10],

    'header-max-length': [2, 'always', 160],

    'body-max-line-length': [2, 'always', 120],

    'subject-case': [0],
  },
};