# Paralog release process

This documents the current release process, but should be subject to change and review each release as needed.

## 1: Feature freeze and testing

1. Check the version number to be created, reference the current tags.
2. Switch to `develop` and update to the latest commit.
3. If needs be, select a previous commit to branch from (by date).
4. `git checkout -b release/<VERSION> develop` or `git checkout -b release/<VERSION> <commit>`
5. Bump the version number in [README.md](./README.md).
6. Bump the version number in [package.json](./frontend/package.json).
7. Bump the version number in [pyproject.toml](./backend/pyproject.toml).
8. Build and run locally; open in a browser as a smoke test.
9. For all feature flags, make a decision about what the flag's value should be in the test.
10. Comprehensively test (by some test plan) all the features expected.
11. Wait at least an hour for last minute hotfixes.
12. In the case of a broken feature or regression, prefer to turn off the feature flag, otherwise apply hotfixes as required such as reverts. Hotfixes should be made onto `develop` and cherry-picked.

## 2: Creating the release

1. Write the changelog:
   1. Add a new section in [CHANGELOG.md](./CHANGELOG.md) – make sure to change the date, and the URL for the diff
   2. Do `git log --reverse -p <previous version>..HEAD`
   3. For each change, if it's worth mentioning, add an entry in the CHANGELOG. The major sections are "Features", "Bug Fixes", and "Cleanups", but add others as needs be.
2. Push the release branch and open a pull request against `main`; make sure that CI passes. Do not merge the pull request.
3. Create an annotated and signed tag called `<version>`. The first line should be "Release <version>", followed by the changelog. Change the heading levels in the changelog as needed, they should be at the top heading level.
4. Push the tag with `git push origin --tags`.
5. Go to the `main` branch, update it to the tag, and push. Force-push if needs be, `main` should be the _exact_ same commit as the tag after the release.
6. Pushing to `main` should have closed the pull request, check this has happened. If not, manually close the pull request.
7. Monitor the release going out. Be ready to revert or apply hotfixes if needs be.
8. Merge (specifically merge, not squash or rebase) `main` back into `develop`. Resolve any merge conflicts which may have arisen particularly from feature flags; generally in favour of `develop`.
9. Create a release on GitHub on [the releases page][github-releases]. Its name is the version number, its description should be either "Release <version>" or "Release for sprint <number>" followed by the changelog. The changelog again needs the hierarchy corrected on its titles.

## 3: Release demo video

1. Outline locally which headline features are going to be included in the demo video.
2. From that outline, and the previous demo script, write a script for the demo video.
3. Practice the script a few times, figuring out what should be shown as you go, in separate tabs in a browser. Document carefully the full reset process between takes.
4. Put the Safari browser window in front of a desktop background and no other windows, and scale it so the content is 1280 × 670. With the toolbar this means that the window is 1280 × 720. Use the web inspector to help with this process; this snippet in the JavaScript console may be helpful:
   ```javascript
   window.onresize = () => {
     console.log([window.visualViewport.width, window.visualViewport.height]);
   };
   ```
5. Open QuickTime Player and select "New Screen Recording". Size the recording box over the browser window at 1280 × 720. Under "Options", make sure that an appropriate audio input device is selected.
6. Run a few recordings until things are smooth. QuickTime Player gives a countdown before recording starts but the countdown can be a little misleading, wait a few extra seconds after the countdown hits zero to start speaking otherwise your voice may be cut off. The recording usually takes 10-15 takes.
7. Save the video as a `.mov`.
8. Convert and compress the video to an `.mp4`. The following `ffmpeg` command is useful:
   ```bash
   ffmpeg -i Demo\ 1.10.0.mov -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k Demo\ 1.10.0\ ƒ.mp4
   ```

## 4: Evidential record

1. Upload the final demo video `.mp4` to the EoSR directory in Sharepoint.
2. Create a bundle of the source as it exists at the release and upload it to Sharepoint in the same directory. This can be created with `git archive --format=zip <version> -o /tmp/paralog-<version>.zip`. Make sure to archive specifically that tag rather than the current `HEAD`, to avoid any risk of uploading the wrong code version.
3. Build the frontend Docker container as an archive and upload it to the same place. This can be done with:
   ```bash
   cd frontend
   docker build . --tag frontend:latest --build-arg NPM_TOKEN=<your token> --build-arg MAP_TILER_TOKEN=<token> --build-arg ORDNANCE_SURVEY_API_KEY=<key> --output dest=./paralog-frontend-<version>.tar,type=tar
   xz -9 paralog-frontend-<version>.tar
   ```
4. Build the backend Docker container as an archive and upload it to the same place. Beware that this archive is very large, and both the build and `xz` may take several minutes to complete; the raw `tar` may be on the order of gigabytes in size and the `xz` in hundreds of megabytes.
   ```bash
   cd backend
   docker build --tag paralog-backend:latest --output paralog-backend-<version>.tar,type=tar .
   xz -9 paralog-backend-<version>.tar
   ```
5. Delete the built `tar.xz` Docker images locally, lest they accidentally get committed.
6. Go through each Jira ticket in the appropriate sprint, evidencing as follows:
   - For research/research spike tickets, make sure the research conclusions are added in a comment, or if the research is more extensive and culminated in a separate report, upload the report into the EoSR folder and link to that from a Jira comment. Make sure the filename contains the ticket number, and make sure it does not imply that it is a work-in-progress.
   - For user-facing features which are shown in the demo, link to the demo video in Sharepoint in a Jira ticket.
   - For user-facing features which are not shown in the demo, take a screenshot of the feature being used, save it in the EoSR folder as `<ticket>.png`, and link to it from a Jira ticket. If there is a video (voice not required) this is also good.
   - For backend features, if they can be evidenced from a frontend feature which uses them, use that evidence. Otherwise, separately evidence if possible with screenshots of a GraphQL API, or code snippets, and make sure there is a link to any commits or pull reuqests.
   - For deployment features, the process is still fluid; evidence as best possible.
   - For the release ticket itself, link to the code bundle in Sharepoint.
   - For any features which are incomplete, move them into the next sprint.
   - For any features which are complete, move them into "Completed".

## 5: Process for minor releases

For a minor release (fixing regressions, last minute changes for demos, security changes) there is a reduced process.

1. Make sure all appropriate fixes have landed in `develop` and work.
2. Check the version number to be created, reference the previous minor version.
3. `git checkout -b release/<VERSION> <PREVIOUS>`.
4. Bump the version number in [README.md](./README.md).
5. Bump the version number in [package.json](./frontend/package.json).
6. Bump the version number in [pyproject.toml](./backend/pyproject.toml).
7. Cherry-pick the fixes.
8. Build and run locally, and run the comprehensive test plan.
9. Apply the full "Creating the release" process from Section 2.

No demo video or separate evidential record are needed for these minor releases.

[github-releases]: https://github.com/CoefficientSystems/c477-paralog/releases
