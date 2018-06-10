# Development
## Rapid Iteration with github-sdm project
When working on both this project and `github-sdm`, it helps to be able to avoid npm publish cycles. To do this, follow these steps:

1. Go to wherever you've checked out `github-sdm`, and cd to the `build/src` directory. Type `npm link`.
2. Wherever you've checked out `sample-sdm` or any other project importing `github-sdm` as an npm module, type `npm link @atomist/sdm`.

Notes:

- The link will survive until you run `npm install` in `sample-sdm` or another downstream project. **You will need to run npm link again if you install anything via npm**.
- If you have changed `sample-sdm` code to depend on a change to `github-sdm`, **do not push to master until you have updated package.json to refer to the updated npm pre-release or release build and run npm install to update the package lock.**
- Do not push to `sample-sdm` `master` anything that depends on a branch of `github-sdm` other than `master`.