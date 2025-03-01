# Firestore Setup for Quest Master

This guide will help you set up Firestore for the Quest Master application.

## Prerequisites

1. A Firebase project (create one at [https://console.firebase.google.com/](https://console.firebase.google.com/))
2. Node.js and npm installed

## Setup Steps

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase in your project

```bash
firebase init
```

Select the following options:
- Firestore
- Authentication
- Hosting (optional)
- Select your Firebase project
- Use the default options for Firestore rules file (`firestore.rules`)
- Use the default options for Firestore indexes file (`firestore.indexes.json`)
- Select "Yes" for single-page application if using Hosting

### 4. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 5. Set up Firebase in your application

1. Copy the `.env.local.example` file to `.env.local`
2. Fill in your Firebase configuration values from the Firebase console
3. Restart your development server

## Data Structure

The application uses the following Firestore data structure:

```
/users/{userId} - User profile information
/users/{userId}/habits/{habitId} - User habits
/users/{userId}/stats/main - User statistics
```

## Security Rules

The Firestore security rules are set up to allow users to only access their own data. You can review and modify these rules in the `firestore.rules` file.

## Migrating from localStorage

When a user logs in for the first time, their localStorage data will be automatically migrated to Firestore. The application will continue to use localStorage as a fallback for unauthenticated users.

## Troubleshooting

If you encounter any issues with Firestore:

1. Check the browser console for error messages
2. Verify your Firebase configuration in `.env.local`
3. Ensure your Firebase project has Firestore enabled
4. Check that your security rules are properly deployed 