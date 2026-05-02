const { signUpUser } = require('../../services/cognito');
const { putUserProfile } = require('../../services/users');
const {
  created,
  badRequest,
  conflict,
  internalServerError,
  parseJsonBody,
} = require('../../lib/http');

exports.handler = async (event) => {
  try {
    const body = parseJsonBody(event);
    const email = body.email ? String(body.email).trim().toLowerCase() : '';
    const password = body.password ? String(body.password) : '';

    if (!email || !password) {
      return badRequest('email and password are required');
    }

    const signupResponse = await signUpUser({ email, password });
    const userId = signupResponse.UserSub;
    const createdAt = new Date().toISOString();

    const user = await putUserProfile({
      userId,
      email,
      createdAt,
    });

    return created({
      message: 'Signup successful',
      user,
    });
  } catch (error) {
    console.error('Signup error', error);

    if (error.name === 'UsernameExistsException') {
      return conflict('User already exists with this email');
    }

    if (error.name === 'InvalidPasswordException') {
      return badRequest('Password does not meet Cognito policy requirements');
    }

    if (error.name === 'ConditionalCheckFailedException') {
      return conflict('User profile already exists');
    }

    if (error.message === 'Invalid JSON body') {
      return badRequest('Request body must be valid JSON');
    }

    return internalServerError('Failed to sign up user');
  }
};
