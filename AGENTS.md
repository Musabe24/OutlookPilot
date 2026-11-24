# Project language

English is the language of this project. Use English for project artifacts, including documentation, code, comments, file and directory names, branch names, commit messages, and pull requests.

# Test-driven development

Use test-driven development: write an automated test for the intended behavior before implementing a feature, verify that it fails for the expected reason, then implement the feature and refactor with the tests passing. Every feature must have automated tests. Mocking is allowed where appropriate. Run the automated tests in the CI pipeline for every change, and maintain the pipeline as features are added.

# Development workflow

- Always work on a branch. Choose a descriptive English branch name that clearly conveys the purpose of the change.
- Make small, meaningful commits with concise commit messages. Split work into coherent commits instead of combining unrelated changes in a large commit.
- Follow clean code principles. Choose clear, descriptive names for files, variables, and functions. Keep functions focused and code easy to understand and maintain.
- Open a pull request against `main` for review. Do not push changes directly to `main` or merge the pull request yourself.
