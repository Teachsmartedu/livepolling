# Put TeachSmart Live on your Netlify account

This is the converted Netlify version. Use this package instead of the earlier TeachSmart-Live-Source.zip.

The code conversion is complete. This download includes Netlify build settings, a working PostgreSQL data layer, teacher email/password sign-in, all eight polling types, your branding, and results exports. To make live sessions work on your account, connect your own Supabase project using the steps below.

## What you need

- Your Netlify account.
- A GitHub account to store the code and connect it to Netlify.
- One Supabase project for the shared database and teacher accounts.

Students need none of these accounts. They use your app's link, a session code, and their name.

## 1. Create the Supabase project

1. Open https://supabase.com/dashboard and create a NEW project for TeachSmart Live.
2. Save its database password securely. You will need it in Step 3.
3. Once the project is available, open **SQL Editor**.
4. Open the file **database/setup.sql** from this download, copy its contents into a new SQL query, and run it. It creates the app's tables and privacy protections. Run this in your new project, not an unrelated existing database.

## 2. Create your teacher account

1. In Supabase, open **Authentication > Users**.
2. Choose **Add user > Create new user**. Enter your teacher email and a strong password. Enable **Auto confirm user** so you can sign in immediately. Use the password you created here when logging into the app. This is separate from your database password.
3. Open **database/add-teacher.sql**. Replace `YOUR-TEACHER-EMAIL@example.com` with that SAME email address.
4. Run the edited SQL in Supabase SQL Editor. This authorizes that email as a TeachSmart teacher.
5. In Supabase authentication settings, disable public sign-ups if you are adding teachers yourself. The app does not provide a public teacher registration form.

To add another teacher, repeat this step with their email. Each teacher sees only their own sessions. Students are not added here.

Teacher accounts and student names are different: teacher identity is verified; student names are self-reported.

## 3. Collect three settings

These values go into Netlify's environment settings. Keep your actual database password and connection string private.

| Variable name | Where to get its value |
| --- | --- |
| `SUPABASE_URL` | Your Supabase project's Project URL, available in its connection/API settings. It looks like `https://YOUR-PROJECT.supabase.co`. |
| `SUPABASE_PUBLISHABLE_KEY` | Your project's publishable key in its API Keys settings. The legacy `anon` key also works. Do not use a secret/service-role key here. |
| `DATABASE_URL` | In Supabase, open **Connect**, choose the **Transaction pooler** connection string, and copy the URI for your project. Insert your actual database password in place of its password placeholder. Use the pooler host and port Supabase supplies, generally port 6543. |

If your database password contains symbols such as `@`, `#`, `/`, or `:`, URL-encode the password portion of the URI. Keep the supplied hostname, database, and username intact. The server requires a verified TLS connection; do not disable certificate verification.

Never put these settings into the frontend code or upload your own `.env` file to GitHub. An `.env.example` with placeholders is included as a reference.

## 4. Upload the converted code to GitHub

1. Unzip **TeachSmart-Live-Netlify.zip**.
2. Create a new private GitHub repository, for example `teachsmart-live`.
3. Upload the CONTENTS of the extracted `TeachSmart-Live-Netlify` folder to the repository. The repository's top level should contain **package.json**, **package-lock.json**, **netlify.toml**, and the **app** folder. Do not leave them inside a second nested folder.
4. Commit the files. The logo is already included under `public`.

The download excludes installed dependencies, build output, real credentials, and session data. Netlify installs dependencies and builds the app.

## 5. Connect the repository to Netlify

1. In Netlify, create a new project using **Import an existing project** or **Deploy with Git**.
2. Connect GitHub and select the repository you just created.
3. Confirm these settings:

| Setting | Value |
| --- | --- |
| Base directory | Leave blank when the files are at the repository's top level |
| Build command | `npm run build` |
| Publish directory | `.next` |
| Node version | `22`, already declared in `netlify.toml` |

4. Add the three environment variables from Step 3. Ensure they are available to the app's **Functions** runtime as well as builds, or choose **all scopes** if that is the option shown. Use production values for the production context.
5. Deploy. Netlify detects Next.js and installs its runtime adapter automatically.
6. If you added settings after a first deployment, trigger another deployment so they take effect.

Use this Git-connected deployment path. This is a full application with server endpoints, not a static folder of HTML files to publish by itself.

## 6. Check it before inviting a class

1. Open your new Netlify site and choose **Sign in**. Sign in with the teacher email and password from Step 2.
2. Create a session and add a question. Click **Launch question**.
3. Click **Invite students** and copy the join link.
4. Open that link on another device or in a private browser window. Enter a student name and submit a response. A student should not need to sign in to Netlify, Supabase, or ChatGPT.
5. In the teacher dashboard, check **Student responses**. It should show the student's name.
6. Click **Present**. This separate live view should show the response without a student name. It follows whichever question the teacher launches.
7. Try a word cloud with `Freedom`, `FREEDOM`, and `freedom` from different student entries. They should combine into one word. More submissions make it larger.
8. Try **Download > PDF** and **Download > image (PNG)**. Names and hidden responses must be excluded.
9. Pause responses, then verify that a new response cannot be submitted to that question.
10. Sign in with a second teacher account if you have one. It should not show the first teacher's sessions or student names.

If Netlify has project-wide visitor protection enabled, disable that visitor gate for this classroom app so students can open the public join page. The app's teacher dashboard remains protected by its own teacher sign-in and server-side ownership checks.

## How the app works

- Teachers sign in with Supabase-verified email/password accounts authorized in `teachsmart.teacher_access`.
- Students enter only their name and join code. Their device stores a random session token, not their teacher's credentials.
- The teacher dashboard can show names. Presentation and student API responses omit names and participant identifiers.
- Multiple choice, word cloud, open text, ranking, rating, and pin on image allow one response per student per question. Q&A and ideas allow up to 10 contributions and toggleable upvotes.
- Teachers can hide responses and mark Q&A responses as answered.
- Live views check for changes every three seconds. This is near-real-time polling, not a WebSocket connection.
- Image questions load the image separately so it is not resent in every polling response.
- The database persists on Supabase when Netlify rebuilds. This package does not transfer any data from the previous hosted version.
- Password recovery is handled by the TeachSmart administrator. The package does not include an email recovery flow.

## Cost and scale

This version uses Netlify for hosting/server requests and Supabase for data and sign-in. Their usage and charges are separate. No paid plan has been selected or purchased for you.

Three-second polling means one active student makes about 20 status requests per minute, in addition to submissions and page loading. Thirty active students for ten minutes generate roughly 6,000 student status requests, plus teacher/presenter traffic. This arithmetic is not a cost estimate or a load-test result. Check both dashboards after a small pilot before expanding to many concurrent classrooms. Requests stop when the relevant page is closed; pausing a question does not close the student's page or stop its status checks.

## If something does not work

- **One-time setup needed:** check the three variable names and redeploy.
- **Unable to sign in:** verify your password, Auto confirm status, and that the exact lowercase email is in `teachsmart.teacher_access`.
- **The page opens but creating/joining fails:** verify `DATABASE_URL`, the database password, and that `database/setup.sql` ran successfully in the same project used by the app.
- **Database connection error:** use the transaction pooler URI supplied by Supabase rather than an IPv6-only direct connection. Do not turn off TLS verification as a workaround.
- **The build fails:** check the first error in Netlify's build log, confirm Node 22 and the top-level repository layout, and confirm the lockfile was uploaded. Do not publish `.next` through a static-only workflow without the Netlify Next.js adapter.
- **Students see a hosting login:** check Netlify's visitor protection settings. Teacher sign-in should be required only for teacher actions.
- **New environment values are ignored:** ensure they include Functions scope and redeploy.

## Validation completed before packaging

- A production Next.js build.
- TypeScript checks.
- PostgreSQL-compatible tests using PGlite, covering all eight question types, name privacy, ownership, cross-session isolation, response moderation, voting, pausing, response limits, duplicate constraints, invalid student tokens, cross-origin writes, and data deletion.
- The SQL schema and private-schema/RLS protections.

The package has not been deployed to YOUR Netlify or Supabase account. Actual credentials, external sign-in, and multi-device behavior on your accounts must be checked after the setup above. No accounts, subscriptions, deployments, or databases were created in your name during conversion.

## Official references

- Netlify Next.js support: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
- Supabase server-side authentication: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase database connection options: https://supabase.com/docs/guides/database/connecting-to-postgres
