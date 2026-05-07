const { randomUUID } = require('node:crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const { getDefaultPersonasForUser } = require('./default-personas');

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
});

const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

function buildPersonaRecord(input) {
  const timestamp = new Date().toISOString();
  const personaId = randomUUID();

  return {
    personaId,
    agentId: personaId,
    userId: input.userId,
    name: input.name,
    age: input.age,
    gender: input.gender,
    language: input.language,
    traits: input.traits || [],
    speakingStyle: input.speakingStyle || [],
    emotionalTone: input.emotionalTone,
    relationshipType: input.relationshipType,
    replyBehavior: input.replyBehavior,
    modelProvider: input.modelProvider || process.env.DEFAULT_MODEL_PROVIDER || 'gemini',
    modelName: input.modelName || process.env.DEFAULT_MODEL_NAME || 'gemini-2.5-flash',
    personaConfig: input.personaConfig || {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function createPersona(input) {
  const persona = buildPersonaRecord(input);

  await docClient.send(
    new PutCommand({
      TableName: process.env.AGENTS_TABLE,
      Item: persona,
      ConditionExpression: 'attribute_not_exists(userId) AND attribute_not_exists(agentId)',
    })
  );

  return persona;
}

async function listPersonasByUser(userId) {
  let result = await docClient.send(
    new QueryCommand({
      TableName: process.env.AGENTS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false,
    })
  );

  if (!result.Items || result.Items.length === 0) {
    const defaultPersonas = getDefaultPersonasForUser(userId);

    for (const persona of defaultPersonas) {
      await docClient.send(
        new PutCommand({
          TableName: process.env.AGENTS_TABLE,
          Item: persona,
          ConditionExpression: 'attribute_not_exists(userId) AND attribute_not_exists(agentId)',
        })
      );
    }

    result = await docClient.send(
      new QueryCommand({
        TableName: process.env.AGENTS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false,
      })
    );
  }

  return (result.Items || []).map(normalizeLegacyPersonaRecord);
}

async function getPersonaById(userId, personaId) {
  const result = await docClient.send(
    new GetCommand({
      TableName: process.env.AGENTS_TABLE,
      Key: {
        userId,
        agentId: personaId,
      },
    })
  );

  return result.Item ? normalizeLegacyPersonaRecord(result.Item) : null;
}

async function updatePersona(userId, personaId, updates) {
  const updateEntries = Object.entries(updates).filter(([, value]) => value !== undefined);

  if (updateEntries.length === 0) {
    return getPersonaById(userId, personaId);
  }

  const expressionAttributeNames = {};
  const expressionAttributeValues = {};
  const updateExpressionParts = [];

  updateEntries.forEach(([key, value]) => {
    const nameKey = `#${key}`;
    const valueKey = `:${key}`;
    expressionAttributeNames[nameKey] = key;
    expressionAttributeValues[valueKey] = value;
    updateExpressionParts.push(`${nameKey} = ${valueKey}`);
  });

  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();
  updateExpressionParts.push('#updatedAt = :updatedAt');

  const result = await docClient.send(
    new UpdateCommand({
      TableName: process.env.AGENTS_TABLE,
      Key: {
        userId,
        agentId: personaId,
      },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: 'attribute_exists(userId) AND attribute_exists(agentId)',
      ReturnValues: 'ALL_NEW',
    })
  );

  return result.Attributes ? normalizeLegacyPersonaRecord(result.Attributes) : null;
}

async function deletePersona(userId, personaId) {
  await docClient.send(
    new DeleteCommand({
      TableName: process.env.AGENTS_TABLE,
      Key: {
        userId,
        agentId: personaId,
      },
      ConditionExpression: 'attribute_exists(userId) AND attribute_exists(agentId)',
    })
  );
}

function normalizeLegacyPersonaRecord(record) {
  if (!record) {
    return null;
  }

  const normalizedRecord = record.personaId
    ? record
    : {
    personaId: record.agentId,
    userId: record.userId,
    name: record.name,
    age: record.age,
    gender: record.gender,
    language: record.language,
    traits: record.traits || [],
    speakingStyle: Array.isArray(record.conversationStyle)
      ? record.conversationStyle
      : record.conversationStyle
        ? [record.conversationStyle]
        : [],
    emotionalTone: record.personaConfig?.emotionalTone || 'balanced',
    relationshipType: record.personaConfig?.relationshipType || 'companion',
    replyBehavior: record.personaConfig?.replyBehavior || 'thoughtful',
    modelProvider: record.personaConfig?.modelProvider || process.env.DEFAULT_MODEL_PROVIDER || 'gemini',
    modelName: record.personaConfig?.modelName || process.env.DEFAULT_MODEL_NAME || 'gemini-2.5-flash',
    personaConfig: record.personaConfig || {},
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };

  return {
    ...normalizedRecord,
    agentId: normalizedRecord.agentId || normalizedRecord.personaId,
    personaConfig: {
      avatar: normalizedRecord.personaConfig?.avatar,
      tagline: normalizedRecord.personaConfig?.tagline,
      description: normalizedRecord.personaConfig?.description,
      lastMessage: normalizedRecord.personaConfig?.lastMessage || '',
      status: normalizedRecord.personaConfig?.status || 'ready',
      lastSeen: normalizedRecord.personaConfig?.lastSeen || '',
      responseSpeed: normalizedRecord.personaConfig?.responseSpeed || normalizedRecord.replyBehavior || 'Thoughtful',
      theme: normalizedRecord.personaConfig?.theme,
      ...normalizedRecord.personaConfig,
    },
  };
}

module.exports = {
  createPersona,
  listPersonasByUser,
  getPersonaById,
  updatePersona,
  deletePersona,
};
