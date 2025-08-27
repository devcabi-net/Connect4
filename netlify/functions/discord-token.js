/**
 * Netlify Function for Discord OAuth2 Token Exchange
 * Handles the secure exchange of authorization codes for access tokens
 */

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { code } = JSON.parse(event.body || '{}');
    
    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing authorization code' })
      };
    }

    const CLIENT_ID = process.env.VITE_DISCORD_CLIENT_ID || '1407945986424307713';
    const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
    
    if (!CLIENT_SECRET) {
      console.error('DISCORD_CLIENT_SECRET not configured in environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    // Exchange the authorization code for an access token
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
      }).toString(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Discord token exchange failed:', data);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: data.error || 'Token exchange failed' })
      };
    }

    // Return the access token
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ access_token: data.access_token })
    };
  } catch (error) {
    console.error('Token exchange error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
