# Getting Started

## Frontend

Here's how to set up your npm environment for working with private packages from GitHub.

### 1. Create an `.npmrc` File

The `.npmrc` file is used to configure npm. You need to create this file and add your GitHub token for authentication.

1. **Generate a GitHub Token**:
    - Go to [GitHub's Personal Access Tokens](https://github.com/settings/tokens) page.
    - Click on "Generate new token".
    - Give it a note like "npm registry token".
    - Select the `read:packages` and `write:packages` scopes.
    - Generate the token and copy it.

2. **Create an `.npmrc` file**:
    - You can create this file in your project's root directory or in your home directory.

3. **Add the following to the `.npmrc` file**:
    ```ini
    @national-digital-twin:registry=https://npm.pkg.github.com
    //npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
    ```
    Replace `YOUR_GITHUB_TOKEN` with the token you copied from GitHub.

### 2. Verify Your `package.json` Configuration

Ensure that your `package.json` is set up correctly to use the GitHub registry. Add the `publishConfig` section if it doesn't already exist:

1. Open your `package.json` file.

2. Add the following if it’s not present:
    ```json
    "publishConfig": {
      "registry": "https://npm.pkg.github.com/"
    }
    ```

### 3. Login to the npm Registry

To ensure that npm is properly configured to use your GitHub token, you should log in:

1. Run the following command:

    ```sh
    npm login --registry=https://npm.pkg.github.com
    ```

2. You will be prompted to enter your GitHub username, your token as the password, and your email address.

### 4. Install Packages

Now that everything is set up, you should be able to run `npm install` without encountering the 401 Unauthorized error.

```sh
npm install
```

---

### Debugging

- If you get "Unexpected end of JSON input", run `npm cache clean --force` then try `npm install` again.

---

### Build

Run `npm run build` to build the application.
