# Repository conventions

- Use English for file and directory names. Use Vietnamese for domain data and existing academic documents where required.
- Directories and documentation files use `kebab-case`; keep standard names such as `README.md`.
- React components and page objects use `PascalCase`; JS functions and variables use `camelCase`; Python modules use `snake_case`. A single rule for all languages would break established framework conventions.
- New tests describe observable behavior and include assertions. Do not count placeholders as coverage.
- Generated reports belong in ignored output directories. Publish only selected, reproducible evidence with its command and environment.
- Before moving a file, update imports, scripts, CI paths and documentation.
- Explain code changes and their limitations in plain language. AI assistance is acceptable only when the contributor can explain and verify the result.
- Preserve historical report contents and evidence filenames when they are referenced by manifests; use an explicit migration instead of silently renaming them.
