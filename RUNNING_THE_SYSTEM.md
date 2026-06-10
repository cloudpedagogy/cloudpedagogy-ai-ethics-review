# Running the System: CloudPedagogy AI Ethics Review

This guide outlines the system prerequisites, installation steps, development commands, production build processes, AWS S3 deployment steps, and troubleshooting procedures for the **CloudPedagogy AI Ethics Review** application.

---

## Prerequisites
Before running or building the system, ensure your environment meets the following requirements:
* **Node.js**: Version 18.0.0 or higher is recommended.
* **npm**: Version 9.0.0 or higher is recommended.

To verify your local installations, run:
```bash
node -v
npm -v
```

---

## Installation
To initialize the workspace and install all runtime and development dependencies, execute:
```bash
npm install
```

### Expected Output
```text
added 312 packages, and audited 313 packages in 4s
58 packages are looking for funding
found 0 vulnerabilities
```
*Note: A `node_modules/` folder will be created in the project root containing all external libraries.*

---

## Development Mode
To launch the hot-reloading development server locally:
```bash
npm run dev
```

### Expected Output
```text
  VITE v8.0.12  ready in 250 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Navigate to **[http://localhost:5173/](http://localhost:5173/)** in your web browser. Any modifications made to the source files will immediately reflect in the browser via Vite's Hot Module Replacement (HMR).

---

## Production Build
To compile the TypeScript code and compile the assets into an optimized production bundle:
```bash
npm run build
```

### Expected Output
```text
> cloudpedagogy-ai-ethics-review@0.0.0 build
> tsc -b && vite build

vite v8.0.12 building for production...
transforming...
✓ 482 modules transformed.
rendering chunks...
computing bundle sizes...
dist/index.html                     0.38 kB │ gzip:  0.25 kB
dist/assets/index-Bv9P1nZ4.css      9.42 kB │ gzip:  2.81 kB
dist/assets/index-CnZ1X-9M.js     354.12 kB │ gzip: 112.45 kB
✓ built in 1.45s
```

*This process runs the TypeScript compiler check (`tsc -b`) and bundles static HTML, CSS, and JS files inside the `dist/` directory.*

---

## Production Preview
To test the built production files locally before deploying, run:
```bash
npm run preview
```

### Expected Output
```text
  ➜  Local:   http://localhost:4173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Navigate to **[http://localhost:4173/](http://localhost:4173/)** to verify that the compiled production assets load and function correctly.

---

## AWS S3 Deployment
Because the built application is purely static (runs client-side with no active server components), it can be hosted in an **AWS S3 Bucket** configured for static web hosting.

### 1. Configure the S3 Bucket
1. Log in to the **AWS Management Console**.
2. Go to **S3** and click **Create Bucket**.
3. Set the **Bucket Name** (e.g., `cloudpedagogy-ai-ethics-review`).
4. Select the region (e.g., `eu-west-2`).
5. Under **Block Public Access settings**, uncheck **Block all public access** (required for static hosting to serve public requests).
6. Click **Create bucket**.

### 2. Enable Static Website Hosting
1. Click on the created bucket and go to the **Properties** tab.
2. Scroll to the bottom to find **Static website hosting** and click **Edit**.
3. Select **Enable**.
4. Set **Index document** to `index.html`.
5. Set **Error document** to `index.html`.
6. Click **Save changes**.

### 3. Add Bucket Policy
To allow public read access, go to the **Permissions** tab, click **Edit** under **Bucket policy**, and paste the following policy (replace `cloudpedagogy-ai-ethics-review` with your actual bucket name):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::cloudpedagogy-ai-ethics-review/*"
    }
  ]
}
```

### 4. Upload Files via AWS CLI
Ensure the AWS CLI is installed and configured with appropriate credentials. Run the following command from the project root:
```bash
# Build the production files
npm run build

# Synchronize the dist folder with the S3 bucket
aws s3 sync dist/ s3://cloudpedagogy-ai-ethics-review --delete
```

#### Expected Output
```text
upload: dist/index.html to s3://cloudpedagogy-ai-ethics-review/index.html
upload: dist/assets/index-Bv9P1nZ4.css to s3://cloudpedagogy-ai-ethics-review/assets/index-Bv9P1nZ4.css
upload: dist/assets/index-CnZ1X-9M.js to s3://cloudpedagogy-ai-ethics-review/assets/index-CnZ1X-9M.js
```

Your live hosted URL will be shown under S3 bucket properties (e.g., `http://cloudpedagogy-ai-ethics-review.s3-website.eu-west-2.amazonaws.com`).

---

## Troubleshooting

### Missing Dependencies
* **Symptom**: Error: `Cannot find module '...'` or `Vite command not found` when executing `npm run dev`.
* **Cause**: Node modules are missing, corrupted, or did not install completely.
* **Solution**: Clean the npm cache, delete existing folders, and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm cache clean --force
  npm install
  ```

### TypeScript Build Errors
* **Symptom**: `tsc -b` fails during `npm run build` showing type errors.
* **Cause**: Code modifications have introduced type conflicts, mismatched component interfaces, or import statement paths that are incorrect.
* **Solution**: Run the TypeScript compiler checker in watch mode to identify errors without outputting files:
  ```bash
  npx tsc --noEmit
  ```
  Fix the type errors in the highlighted files until the command outputs zero errors.

### Blank Page Issues
* **Symptom**: Navigating to the hosted URL shows a completely blank page, but the page title loads. The console shows `404 Not Found` or MIME type errors for JS/CSS files.
* **Cause**:
  1. The asset base path in `vite.config.ts` might be configured incorrectly.
  2. Router configuration is using `BrowserRouter` which requires server rewrite rules, failing on static hosts.
* **Solution**:
  1. In `vite.config.ts`, verify that `base` is set to `./` or `/` depending on your domain root.
  2. Ensure the project is using `HashRouter` in `src/App.tsx`. The hash router uses standard browser hash anchors (`#/`) that prevent page refreshes from sending subpaths to S3, resolving static hosting routing issues.

### Missing Exports
* **Symptom**: Exporting database from settings generates a JSON file, but attempting to import it on another machine fails.
* **Cause**: The structure of the JSON has been modified or corrupted, missing crucial fields like `"frameworks"`.
* **Solution**: Open the JSON file and verify that the root structure contains all required properties:
  ```json
  {
    "frameworks": [...],
    "reviews": [...],
    "activeFrameworkId": "..."
  }
  ```

### localStorage Reset
* **Symptom**: The application state gets corrupted, or UI bugs occur due to stale local models persisting in local storage.
* **Cause**: Schema changes in state variables without incrementing Zustand's storage version key.
* **Solution**: Clear browser local storage. You can click "Reset to Defaults" in the settings page Danger Zone, or manually run this command in your browser's Developer Tools Console (F12 > Console):
  ```javascript
  localStorage.clear();
  location.reload();
  ```

### AWS S3 Deployment Problems
* **Symptom**: Access Denied (403 Error) when accessing the S3 bucket website URL.
* **Cause**: Bucket public access is blocked or the Bucket Policy allowing public `GetObject` reads is missing.
* **Solution**:
  1. Under the bucket's **Permissions** tab, ensure **Block public access (bucket settings)** is completely turned off.
  2. Verify that the bucket policy contains the `"Action": "s3:GetObject"` permission pointing to your correct bucket ARN (including `/*` at the end).
