# Environment Variables Setup

## Client Environment Variables

Create a `.env.local` file in the `client` directory with the following content:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### For Production:
```env
NEXT_PUBLIC_API_URL=https://your-production-api.com/api
```

## Server Environment Variables

The server `.env` file is already configured with:
- MongoDB connection string
- JWT secret
- Port configuration
- CORS settings

## Important Notes

1. **Never commit `.env.local` or `.env` files to version control**
2. The `NEXT_PUBLIC_` prefix makes the variable accessible in the browser
3. Restart the development server after changing environment variables
4. For production deployment, set these variables in your hosting platform

## Quick Setup

```bash
# In the client directory
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

# In the server directory (already done)
# The .env file is already configured
```
