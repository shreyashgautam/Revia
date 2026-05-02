const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
  AdminInitiateAuthCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
});

async function signUpUser({ email, password }) {
  const command = new SignUpCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: 'email',
        Value: email,
      },
    ],
  });

  const response = await client.send(command);

  if (process.env.COGNITO_AUTO_CONFIRM === 'true') {
    const confirmCommand = new AdminConfirmSignUpCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email,
    });

    await client.send(confirmCommand);
  }

  return response;
}

async function loginUser({ email, password }) {
  const command = new AdminInitiateAuthCommand({
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  return client.send(command);
}

module.exports = {
  signUpUser,
  loginUser,
};
