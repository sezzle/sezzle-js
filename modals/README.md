### Developing a new javascript version
- Checkout a branch whose title reflects the Jira ticket number and/or the feature to be built or updated
- Make all necessary changes (build or update tests if applicable)
- Run `npx htmllint ${sample-file-name}` for each file that was updated
	- Example: `npx htmllint src/classBased/sezzle.js`
	- Resolve any errors and run again. Repeat until there are no errors.
- Run `npm run test`
	- Resolve any errors and run again. Repeat until there are no errors.
- Add and commit changes, then push the branch to Github
- Open a pull request and reach out to someone with Approver access to review and merge

### Releasing a new javascript version
- Once the branch is merged to master, run `git checkout master` and `git pull origin master`
- Run `npm run release -- --newversion=${new-version-number}` such that the new version follows the convention YY.MM.v (year.month.version)
	- For example, if today's date is December 2020 and it is the first release this month, the version will be `20.12.0`. If it is the second release this month, it would be `20.12.1`
	- This command will automatically update package.json, check out a branch, and push the branch to Github
- Open a pull request and reach out to someone with Approver access to review and merge
- Update the <a href="https://sezzle.atlassian.net/wiki/spaces/WID/pages/512852116/SezzleJS+Change+Log" target="_blank">SezzleJS Changelog</a> with a summary of all changes

### Developing a new css version
Follow the same process as for javascript

### Releasing a new css version
- Once the branch is merged to master, run `git checkout master` and `git pull origin master`
- Run `npm run release-css -- --newversion=${new-version-number}` such that the new version number increments following the convention ${major rewrite}.${feature change}.${iteration}
- Open a pull request and reach out to someone with Approver access to review and merge

- To update an existing css, run `git checkout master` and `git pull origin master` then `npm run update-css -- --updateversion=${version-number}`
	- For example, `npm run update-css -- --updateversion=2.0.1`.
### Developing a new modal vesion

- Decide the new modal version. It should increment from the current modal version following the same convention as CSS
- Create a new directory under `modals` called `modals-<version-number>`.
	- For example, if your version is `2.0.1` then the directory name should be `modals-2.0.1`
- Add modal.scss and modal HTML file for each of the supported languages under the new directory. The files should be named like `modal-<language-code>.html`
	- For example, `modal-en.html` and `modal-fr.html`
- To try out the modal locally you need to run this command `VERSION=2.0.1 LANGUAGE=en npx webpack-dev-server` and this will be accessible at `http://localhost:8081/`
-- Now from the command you can make out, you have to specify the version and the language.
-- This runs on watch mode so any change in your respective `modal-<language>.html` file would refresh the page and show you how the mdoal would look like.
- Run `npx htmllint ${sample-file-name}` for each file that was updated
	- Example: `npx htmllint modals/modals-2.0.1/modal-en.html`
	- Resolve any errors and run again. Repeat until there are no errors.

### Releasing a new modal version
- Open `modals/language.json` and add a new line where the key is the new modal version number, and the value is an array of supported language codes for the new modal version. If your modal version `2.0.1` supports English and French, then the new item should look like the following:
   ```
   {
      ...,
      "2.0.1" : ["en", "fr"]
   }
    ```
- Add and commit changes, then push the branch to Github
- Open a pull request and reach out to someone with Approver access to review and merge
  ```
  Note: This step won't release a new version yet
  ```
  - Once the branch is merged to master, run `git checkout master` and `git pull origin master`
- Run `npm run release-modal -- --newversion=${new-version-number}` such that the new version number increments following the convention ${major rewrite}.${feature change}.${iteration}
	- For example, `npm run release-modal -- --newversion=2.0.1`
	- This command will automatically update `release_history.json` and `update_history.json`, check out a branch, and push the branch to Github
- Open a pull request and reach out to someone with Approver access to review and merge

- To update an existing modal, run `git checkout master` and `git pull origin master` then `npm run update-modal -- --updateversion=${version-number}`
	- For example, `npm run update-modal -- --updateversion=2.0.1`.
