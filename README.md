Setting Up GitHub OAuth for the Application
To use this application, you need to register an OAuth application with GitHub. Follow these steps:

1. Register a new OAuth application with GitHub

Go to your GitHub account settings
Navigate to "Developer settings" > "OAuth Apps" > "New OAuth App"
Fill in the following details:

Application name: Your app name (e.g., "NextJS OAuth Demo")
Homepage URL: http://localhost:3000 (for development)
Application description: Optional description of your application
Authorization callback URL: http://localhost:3000/api/auth/callback/github

Click "Register application"
After registration, you'll see your Client ID
Generate a new client secret by clicking "Generate a new client secret"

2. Configure environment variables

Copy the .env.local file template
Fill in the required variables:

GITHUB_CLIENT_ID: The client ID from GitHub
GITHUB_CLIENT_SECRET: The client secret from GitHub
OAUTH_REDIRECT_URL_BASE: Set to http://localhost:3000/api/auth/callback for development
JWT_SECRET: Generate a strong random string (at least 32 characters)

Example of generating a JWT secret using Node.js:
bashnode -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 3. Run the application
bashnpm run dev
Visit http://localhost:3000 in your browser. You should be redirected to the login page where you can authenticate with GitHub.
For Production Deployment
When deploying to production:

Update the GitHub OAuth application settings with your production URLs
Update the environment variables with production values
Make sure to set a strong JWT_SECRET
Consider adding rate limiting and additional security measures

Security Considerations

The application uses encrypted cookies to store session data
All cookies are set with HttpOnly, Secure, and SameSite flags
CSRF protection is implemented via state parameters in the OAuth flow
PKCE (Proof Key for Code Exchange) is used to prevent authorization code interception attacks
