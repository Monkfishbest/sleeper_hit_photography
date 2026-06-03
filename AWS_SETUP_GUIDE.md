# AWS S3 + CloudFront Setup Guide

This guide walks you through setting up AWS S3 for image hosting with CloudFront CDN and automated Google Drive syncing via Lambda.

**Cost**: ~$0.10-0.30/month (free tier covers most of it)

## Step 1: Create AWS Account

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Follow the sign-up process
4. Add a payment method (you won't be charged for free tier)

## Step 2: Create S3 Bucket

1. Search for "S3" in AWS Console
2. Click "Create bucket"
3. **Bucket name**: `sleeper-hit-photography-images` (must be globally unique, so add a random suffix if needed like `-abc123`)
4. **Region**: Choose closest to you (e.g., us-east-1)
5. **ACL**: Leave default
6. **Block Public Access**: ✅ Keep all blocked (we'll use CloudFront, not public URLs)
7. Click "Create bucket"

## Step 3: Create CloudFront Distribution

1. Search for "CloudFront" in AWS Console
2. Click "Create distribution"
3. **Origin domain**: Select your S3 bucket from the dropdown
4. **S3 access**: Keep "Origin access control settings" selected
5. **Cache behavior**:
   - **Viewer protocol policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP methods**: GET, HEAD, OPTIONS
   - **Cache key and origin requests**: Use legacy cache settings → select "CachingOptimized"
6. Keep other defaults
7. Click "Create distribution"
8. **Copy your CloudFront domain** (looks like `d123abc.cloudfront.net`) - you'll need this

### Create OAC Policy

After creating the distribution:
1. Go back to your S3 bucket
2. Click "Permissions" tab
3. Scroll to "Bucket policy"
4. Paste this policy (replace `sleeper-hit-photography-images` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::sleeper-hit-photography-images/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

(You can find your Account ID and Distribution ID in the CloudFront distribution details)

## Step 4: Create Lambda Execution Role

1. Search for "IAM" in AWS Console
2. Click "Roles" in left sidebar
3. Click "Create role"
4. **Trusted entity type**: AWS service
5. **Service**: Lambda
6. Click "Next"
7. **Attach policies**:
   - Search and select: `AWSLambdaBasicExecutionRole`
   - Search and select: `AmazonS3FullAccess`
8. Click "Next"
9. **Role name**: `sleeper-hit-lambda-role`
10. Click "Create role"

## Step 5: Create Lambda Function for Drive Sync

1. Search for "Lambda" in AWS Console
2. Click "Create function"
3. **Function name**: `sleeper-hit-drive-sync`
4. **Runtime**: Node.js 20.x
5. **Execution role**: Use the `sleeper-hit-lambda-role` you just created
6. Click "Create function"
7. Replace the code with the code from `lambda/sync-function.js` (see separate file)
8. Click "Deploy"

### Set Lambda Environment Variables

1. Go to "Configuration" tab
2. Click "Environment variables"
3. Add these (values in parentheses - you'll get these later):
   - `GOOGLE_DRIVE_CLIENT_EMAIL` = (from your Google service account)
   - `GOOGLE_DRIVE_PRIVATE_KEY` = (from your Google service account, use literal `\n` not actual newlines)
   - `S3_BUCKET_NAME` = `sleeper-hit-photography-images`
   - `AWS_REGION` = `us-east-1` (or your region)
4. Click "Save"

### Increase Lambda Timeout

1. Go to "Configuration" → "General configuration"
2. Click "Edit"
3. Set **Timeout** to 15 minutes (900 seconds) - Drive API can be slow
4. Click "Save"

## Step 6: Set Up Google Drive Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project:
   - Click project dropdown at top
   - Click "NEW PROJECT"
   - Name: `sleeper-hit-sync`
   - Click "Create"
3. Enable Google Drive API:
   - Search "Google Drive API"
   - Click it and press "Enable"
4. Create a service account:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - **Service account name**: `sleeper-hit-lambda`
   - Click "Create and Continue"
   - Grant basic editor role (next step)
   - Click "Continue" → "Done"
5. Create a key:
   - Click on the service account you just made
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose **JSON**
   - Click "Create"
   - A JSON file downloads - **save this safely**
6. Copy from the JSON file:
   - `client_email` → paste in Lambda `GOOGLE_DRIVE_CLIENT_EMAIL`
   - `private_key` → paste in Lambda `GOOGLE_DRIVE_PRIVATE_KEY`

## Step 7: Share Google Drive Folder with Service Account

1. Get the `client_email` from your service account JSON (looks like `xxx@yyy.iam.gserviceaccount.com`)
2. In Google Drive, right-click your photos folder
3. Click "Share"
4. Paste the service account email
5. Give it "Viewer" access
6. Click "Share"

## Step 8: Update Lambda to Find Your Folders

Edit the Lambda function's `FOLDER_MAPPING` to match your Drive structure:

```javascript
const FOLDER_MAPPING = {
  events: 'YOUR_EVENTS_FOLDER_ID',
  landscapes: 'YOUR_LANDSCAPES_FOLDER_ID',
  street: 'YOUR_STREET_FOLDER_ID',
  portraits: 'YOUR_PORTRAITS_FOLDER_ID',
}
```

To get folder IDs:
- Open each folder in Google Drive
- Look at the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
- Copy the ID and paste it in the Lambda code

## Step 9: Set Up EventBridge Schedule

1. Search for "EventBridge" in AWS Console
2. Click "Rules" in left sidebar
3. Click "Create rule"
4. **Name**: `sleeper-hit-sync-schedule`
5. **Rule type**: Schedule
6. **Schedule pattern**: `rate(6 hours)`
7. Click "Next"
8. **Target**: Lambda function
9. **Function**: Select `sleeper-hit-drive-sync`
10. Click "Create rule"

## Step 10: Update Your App

In your Next.js app:

1. Update `.env.local`:
```
CLOUDFRONT_DOMAIN=d123abc.cloudfront.net
```

2. Update the photo loading code in `SleeperHitPhotographyDrive.server.ts` to construct S3/CloudFront URLs instead of using the Google Drive API

See the app code changes in the separate instructions.

## Testing

1. Go to Lambda console
2. Click your function
3. Click "Test"
4. Create a test event (any data is fine)
5. Click "Test" button
6. Check CloudWatch logs for errors

## Monitoring

- **Lambda logs**: CloudWatch → Log groups → `/aws/lambda/sleeper-hit-drive-sync`
- **S3 objects**: S3 console → your bucket → see uploaded files
- **CloudFront**: CloudFront dashboard → monitor cache hit rate

## Cost Breakdown (monthly)

- **S3 storage**: ~$0.10 (1GB @ $0.023/GB)
- **CloudFront delivery**: ~$0.05 (minimal due to caching)
- **Lambda**: FREE (under free tier)
- **EventBridge**: FREE (under free tier)
- **Total**: ~$0.15/month

## Troubleshooting

**Lambda times out**: Increase timeout to 15 minutes in configuration

**Images not appearing**: Check CloudWatch logs for Drive API errors

**CloudFront showing old images**: Wait 24 hours for cache expiration, or invalidate manually in CloudFront console

**S3 access denied**: Check bucket policy has correct CloudFront distribution ID
