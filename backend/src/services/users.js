const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
});

const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

async function putUserProfile(user) {
  await docClient.send(
    new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: user,
      ConditionExpression: 'attribute_not_exists(userId)',
    })
  );

  return user;
}

async function getUserProfile(userId) {
  const result = await docClient.send(
    new GetCommand({
      TableName: process.env.USERS_TABLE,
      Key: {
        userId,
      },
    })
  );

  return result.Item || null;
}

module.exports = {
  putUserProfile,
  getUserProfile,
};
