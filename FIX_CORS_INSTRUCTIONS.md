# How to Fix Firebase Storage CORS Error

The errors you are seeing (`Access to XMLHttpRequest ... blocked by CORS policy`) happen because your Firebase Storage bucket is blocking uploads from `localhost` for security reasons.

To fix this, you need to tell Firebase to allow uploads from your computer.

## Option 1: Using Google Cloud Console (Easiest)

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Make sure your Firebase project is selected in the top dropdown.
3.  Click the **Activate Cloud Shell** icon (a terminal icon in the top right toolbar).
4.  In the terminal that opens at the bottom, run these commands:

```bash
# 1. Create the cors configuration file
echo '[{"origin": ["*"],"method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],"responseHeader": ["*"],"maxAgeSeconds": 3600}]' > cors.json

# 2. Apply it to your bucket
gsutil cors set cors.json gs://ifilmdirectory-94b82.firebasestorage.app
```

## Option 2: If you have `gsutil` installed locally

1.  I have created a `cors.json` file in your project folder.
2.  Open your terminal.
3.  Run this command:

```bash
gsutil cors set cors.json gs://ifilmdirectory-94b82.firebasestorage.app
```

---

### Why are my old messages broken? (`ERR_FILE_NOT_FOUND`)
Because the upload failed previously (due to this CORS error), the app saved a **temporary local link** (`blob:...`) so you could still see the message.
These temporary links **expire** when you refresh the page.
Once you fix the CORS issue using the steps above, new messages will upload correctly to the cloud and will **never expire**.
