# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## IMPORTANT: Final Configuration Steps

For this application to function correctly, you **must** complete these two manual steps in your Firebase project.

### 1. Enable Anonymous Authentication

This is required for users to be able to submit component requests.

1.  **Open your Firebase project** in your web browser.
2.  In the left-hand menu, go to the **Authentication** section.
3.  Click on the **"Sign-in method"** tab at the top.
4.  Find **"Anonymous"** in the list of providers and click on it.
5.  Click the **"Enable"** toggle switch.
6.  Click **"Save"**.

### 2. Update Firestore Security Rules

This allows authenticated users to read and write data to the database.

1.  **Open your Firebase project** and go to the **Firestore Database** section.
2.  Click on the **"Rules"** tab.
3.  Replace the existing rules with the following:
    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /{document=**} {
          allow read, write: if request.auth != null;
        }
      }
    }
    ```
4.  Click **"Publish"**.

## How to Deploy Your Application (Go Live)

Your application is configured for **Firebase App Hosting**, a service that runs your application in the cloud. Once you deploy your app, you do **not** need to keep your laptop on. Firebase handles everything.

To deploy your application and make it live, follow these steps in your local terminal:

### Step 1: Install the Firebase CLI

If you haven't already, install the Firebase command-line tools globally. This is a one-time setup.

```bash
npm install -g firebase-tools
```

### Step 2: Log in to Firebase

Log in to your Google account to connect the command line to your Firebase project.

```bash
firebase login
```

### Step 3: Deploy the App

In your project's root directory on your laptop, run the deploy command. This will build your app and send it to Firebase's cloud servers.

```bash
firebase deploy --only hosting
```

After the command finishes, it will give you a URL where your live application can be accessed (e.g., `https://<your-project-id>.web.app`). Your website is now live for anyone to visit!