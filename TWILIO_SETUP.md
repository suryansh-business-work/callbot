# Setting Up Twilio Credentials

Follow these steps to get your Twilio credentials:

## 1. Create a Twilio Account
1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Verify your phone number

## 2. Get Your Account SID and Auth Token
1. After logging in, go to the [Twilio Console Dashboard](https://console.twilio.com/)
2. You'll see your **Account SID** and **Auth Token** on the dashboard
   - Account SID starts with `AC` (e.g., `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - Auth Token is a 32-character string
3. Click "Show" to reveal the Auth Token
4. Copy both values

## 3. Get a Twilio Phone Number
1. In the Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Or if using a trial account, you'll get a trial number automatically
3. Select a number with **Voice** capabilities enabled
4. Note: On trial accounts, you can only call numbers you've verified
5. Copy your phone number in E.164 format (e.g., `+12345678901`)

## 4. Configure Your .env File
1. Open `server/.env`
2. Fill in the values:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # From step 2
TWILIO_AUTH_TOKEN=your_32_character_auth_token          # From step 2
TWILIO_PHONE_NUMBER=+12345678901                        # From step 3

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS
CLIENT_URL=http://localhost:3000
```

## 5. Trial Account Limitations
If using a trial account:
- You can only call phone numbers you've verified in the Twilio Console
- To verify a number: Go to **Phone Numbers** → **Verified Caller IDs** → **Add a new number**
- Calls will have a trial message at the beginning
- Upgrade to a paid account to remove these restrictions

## 6. Test Your Setup
1. Save your `.env` file
2. Restart the server: `npm run dev`
3. Check the server starts without errors
4. Open the UI at `http://localhost:3000`
5. Try making a call to a verified phone number

## Common Issues

### "accountSid must start with AC"
- Your `TWILIO_ACCOUNT_SID` is missing or incorrect
- Make sure it starts with `AC` and is 34 characters long

### "Invalid credentials"
- Double-check your `TWILIO_AUTH_TOKEN` is correct
- Try revealing it again in the Twilio Console and re-copying

### "The number +XXX is unverified" (Trial accounts)
- Go to Twilio Console → **Phone Numbers** → **Verified Caller IDs**
- Add and verify the number you want to call

### "Invalid phone number format"
- Ensure your phone number is in E.164 format: `+[country code][number]`
- Example: `+919876543210` (India), `+12125551234` (US)
