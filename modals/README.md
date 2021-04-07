### Developing a new modal vesion
- Decide the new modal version. It should be more than the current modal version in package.json
- Create a new directory under `modals` called `modals-<version>`. If your version is `2.0.1` then the directory name should be `modals-2.0.1`
- Add modal HTML file for each of the languages under `modals/modals-2.0.1` directorys. The files should be named like `modal-<language>.html` i.e. `modal-en.html` and `modal-fr.html`.
- To try out the modal locally you need to run this command `VERSION=2.0.1 LANGUAGE=en npx webpack-dev-server` and this will be accessible at `http://localhost:8081/`
-- Now from the command you can make out, you have to specify the version and the language.
-- This runs on watch mode so any change in your respective `modal-<language>.html` file would refresh the page and show you how the mdoal would look like.

### Releasing a new modal version
- Open `modals/language.json` file and add supported languages for the modal version. If your modal version `2.0.1` supports English, French then add the new item should look like the following:
   ```
   {
      ...,
      "2.0.1" : ["en", "fr"]
   }
    ```
- Commit all the changes and get it merged with master.
  ```
  Note: This step won't release a new version yet
  ```
- Run `npm run release-modal -- --newversion=<version>` command locally on your `latest master`. In this case the command should look like `npm run release-modal -- --newversion=2.0.1`
-- This will create and push a new branch and merging that branch with master will release a new version.