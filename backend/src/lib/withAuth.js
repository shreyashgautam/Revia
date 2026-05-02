const { CognitoJwtVerifier } = require('aws-jwt-verify');
const { unauthorized, internalServerError } = require('./http');

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID,
});

function extractBearerToken(event) {
  const authorizationHeader =
    event?.headers?.Authorization || event?.headers?.authorization;

  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

function withAuth(handler) {
  return async (event) => {
    try {
      const token = extractBearerToken(event);

      if (!token) {
        return unauthorized('Missing or invalid Authorization header');
      }

      const claims = await verifier.verify(token);
      event.auth = {
        token,
        claims,
      };

      return await handler(event);
    } catch (error) {
      if (error && error.name && error.name.includes('Jwt')) {
        return unauthorized('Invalid or expired token');
      }

      if (error && error.message === 'Token not provided') {
        return unauthorized(error.message);
      }

      console.error('Token validation failed', error);
      return internalServerError('Token validation failed');
    }
  };
}

module.exports = {
  withAuth,
};
