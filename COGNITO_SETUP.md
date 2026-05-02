# AWS Cognito Setup Guide for Unar

This guide will help you set up AWS Cognito for user authentication with email/password login.
Authentication is handled by a backend Lambda function (`unar_auth.py`).

## Step 1: Create a Cognito User Pool

1. Go to **AWS Console → Cognito → User Pools**
2. Click **Create user pool**

### Configure sign-in experience
- **Cognito user pool sign-in options**: Select `Email`
- Click **Next**

### Configure security requirements
- **Password policy**: 
  - Minimum length: `8`
  - Check: Uppercase, Lowercase, Numbers
- **Multi-factor authentication**: `No MFA` (or optional)
- **User account recovery**: `Enable self-service account recovery`
  - Delivery method: `Email only`
- Click **Next**

### Configure sign-up experience
- **Self-registration**: `Enable`
- **Attribute verification**: `Send email message, verify email address`
- **Required attributes**: 
  - `email`
  - `name`
  - `phone_number`
- Click **Next**

### Configure message delivery
- **Email provider**: `Send email with Cognito` (for testing)
  - For production, use **Amazon SES**
- **FROM email address**: Use default or configure SES
- Click **Next**

### Integrate your app
- **User pool name**: `unar-users`
- **Hosted authentication pages**: `Use the Cognito Hosted UI`
- **Domain type**: `Use a Cognito domain`
- **Cognito domain**: `unar-auth` (or your preferred prefix)
  - Full domain will be: `unar-auth.auth.us-east-1.amazoncognito.com`

### Initial app client
- **App client name**: `unar-web-client`
- **Client secret**: `Don't generate a client secret`
- **Authentication flows**: 
  - ✅ ALLOW_USER_SRP_AUTH
  - ✅ ALLOW_REFRESH_TOKEN_AUTH

### Hosted UI settings
- **Allowed callback URLs**: 
  ```
  http://localhost:5500/login.html
  https://yourdomain.com/login.html
  ```
- **Allowed sign-out URLs**:
  ```
  http://localhost:5500/login.html
  https://yourdomain.com/login.html
  ```
- **Identity providers**: `Cognito user pool`
- **OAuth 2.0 grant types**: `Authorization code grant`
- **OpenID Connect scopes**: `email`, `openid`, `profile`

5. Click **Next** → Review → **Create user pool**

---

## Step 2: Set Up Google Sign-In

### A. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Configure consent screen if prompted:
   - User Type: `External`
   - App name: `Unar`
   - User support email: Your email
   - Developer contact: Your email
6. Create OAuth client ID:
   - Application type: `Web application`
   - Name: `Unar Web Client`
   - **Authorized JavaScript origins**:
     ```
     https://unar-auth.auth.us-east-1.amazoncognito.com
     ```
   - **Authorized redirect URIs**:
     ```
     https://unar-auth.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
     ```
7. Copy the **Client ID** and **Client Secret**

### B. Add Google as Identity Provider in Cognito

1. Go to **Cognito → User Pools → unar-users**
2. Go to **Sign-in experience** tab
3. Under **Federated identity provider sign-in**, click **Add identity provider**
4. Select **Google**
5. Enter:
   - **Client ID**: (from Google)
   - **Client secret**: (from Google)
   - **Authorized scopes**: `profile email openid`
6. Map attributes:
   - `email` → `email`
   - `name` → `name`
7. Click **Add identity provider**

### C. Update App Client

1. Go to **App integration** tab
2. Click on your app client (`unar-web-client`)
3. Under **Hosted UI**, click **Edit**
4. Add `Google` to **Identity providers**
5. Save changes

---

## Step 3: Create DynamoDB Table for Users

1. Go to **AWS Console → DynamoDB → Tables**
2. Click **Create table**
3. Configure:
   - **Table name**: `unar_users`
   - **Partition key**: `cognito_user_id` (String)
4. Click **Create table**

---

## Step 4: Deploy the Auth Lambda Function

### Create Lambda Function

1. Go to **AWS Console → Lambda → Create function**
2. Configure:
   - **Function name**: `unar-auth`
   - **Runtime**: Python 3.11
   - **Architecture**: x86_64
3. Click **Create function**

### Upload Code

1. Copy contents of `server/unar_auth.py`
2. Paste into Lambda code editor
3. Click **Deploy**

### Configure Environment Variables

Go to **Configuration → Environment variables** and add:

| Key | Value |
|-----|-------|
| `COGNITO_USER_POOL_ID` | `us-east-1_aBcDeFgHi` (your User Pool ID) |
| `COGNITO_CLIENT_ID` | `1a2b3c4d5e6f7g8h9i0j` (your App Client ID) |
| `USERS_TABLE_NAME` | `unar_users` |

### Configure IAM Permissions

Add these permissions to the Lambda execution role:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cognito-idp:SignUp",
                "cognito-idp:ConfirmSignUp",
                "cognito-idp:ResendConfirmationCode",
                "cognito-idp:InitiateAuth",
                "cognito-idp:GlobalSignOut",
                "cognito-idp:ForgotPassword",
                "cognito-idp:ConfirmForgotPassword",
                "cognito-idp:GetUser",
                "cognito-idp:AdminGetUser"
            ],
            "Resource": "arn:aws:cognito-idp:us-east-1:YOUR_ACCOUNT_ID:userpool/YOUR_USER_POOL_ID"
        },
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem"
            ],
            "Resource": "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/unar_users"
        }
    ]
}
```

### Enable Function URL

1. Go to **Configuration → Function URL**
2. Click **Create function URL**
3. Auth type: **NONE** (public access)
4. Configure CORS:
   - Allow origin: `*`
   - Allow methods: `POST, OPTIONS`
   - Allow headers: `Content-Type, Authorization`
5. Copy the Function URL (e.g., `https://xxxxx.lambda-url.us-east-1.on.aws`)

---

## Step 5: Update login.html

Open `login.html` and update the API URL (line ~581):

```javascript
const AUTH_API_URL = 'https://xxxxx.lambda-url.us-east-1.on.aws'; // Your Lambda Function URL
```

---

## Step 6: Test Your Setup

### Local Testing

1. Start a local server:
   ```bash
   # Using Python
   python -m http.server 5500
   
   # Or using Node.js
   npx serve -p 5500
   ```

2. Open `http://localhost:5500/login.html`

3. Test:
   - ✅ Sign up with email
   - ✅ Verify email with code
   - ✅ Sign in with email/password
   - ✅ Google sign-in
   - ✅ Forgot password flow

### Production

1. Update callback URLs in Cognito to include your production domain
2. Update callback URLs in Google Cloud Console
3. Deploy and test

---

## Troubleshooting

### "redirect_mismatch" error
- Ensure callback URLs in Cognito exactly match your domain
- Include both `http://localhost:5500` and your production URL

### "Invalid UserPoolId" error
- Double-check the User Pool ID format: `region_xxxxxxxxx`

### Google sign-in not working
- Verify Google OAuth credentials are correct
- Check authorized redirect URIs in Google Console
- Ensure Google is added as identity provider in Cognito

### Email not sending
- Check SES sandbox mode (may need to verify recipient emails)
- Request SES production access for sending to any email

---

## Security Best Practices

1. **Never expose client secrets** in frontend code
2. **Use HTTPS** in production
3. **Enable MFA** for admin accounts
4. **Set up CloudWatch** for monitoring auth events
5. **Configure account lockout** after failed attempts

---

## Next Steps

After setup, you can:
1. Add user profile page
2. Implement protected routes
3. Store user data in DynamoDB
4. Add order history for logged-in users
