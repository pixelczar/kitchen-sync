import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { google } from 'googleapis';

admin.initializeApp();
const secretManager = new SecretManagerServiceClient();

export const storeOAuthToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }

  const { provider, accessToken, refreshToken, expiresAt } = data as {
    provider: 'calendar' | 'photos';
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  };

  if (!provider || !accessToken) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing provider or accessToken');
  }

  const uid = context.auth.uid;
  const secretId = `users-${uid}-oauth-${provider}`;

  // Ensure secret exists (idempotent)
  const parent = `projects/${process.env.GCLOUD_PROJECT}`;
  try {
    await secretManager.createSecret({
      parent,
      secretId,
      secret: { replication: { automatic: {} } },
    });
  } catch (e: any) {
    if (e?.message?.includes('Already exists')) {
      // ok
    } else {
      throw e;
    }
  }

  const [secret] = await secretManager.getSecret({ name: `${parent}/secrets/${secretId}` });

  await secretManager.addSecretVersion({
    parent: secret.name!,
    payload: { data: Buffer.from(JSON.stringify({ accessToken, refreshToken, expiresAt })) },
  });

  await admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('integrations')
    .doc(provider)
    .set(
      {
        provider,
        secretName: secret.name,
        connectedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: expiresAt ?? null,
      },
      { merge: true }
    );

  return { success: true };
});

export const getOAuthToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }

  const { provider } = data as { provider: 'calendar' | 'photos' };
  const uid = context.auth.uid;

  const integrationDoc = await admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('integrations')
    .doc(provider)
    .get();

  if (!integrationDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Integration not found');
  }

  const { secretName, expiresAt } = integrationDoc.data() as { secretName: string; expiresAt?: number };

  const [version] = await secretManager.accessSecretVersion({ name: `${secretName}/versions/latest` });
  const tokenData = JSON.parse(version.payload?.data?.toString() || '{}') as {
    accessToken: string;
    refreshToken?: string;
  };

  // Refresh if needed and refreshToken exists
  if (expiresAt && Date.now() >= expiresAt && tokenData.refreshToken) {
    const refreshed = await refreshGoogleToken(tokenData.refreshToken);

    const expiresAt = typeof (refreshed as any).expiry_date === 'number'
      ? (refreshed as any).expiry_date
      : Date.now() + 3600 * 1000;

    await storeOAuthToken.run({
      provider,
      accessToken: refreshed.access_token as string,
      refreshToken: tokenData.refreshToken,
      expiresAt,
    } as any, { auth: context.auth } as any);

    return { accessToken: refreshed.access_token };
  }

  return { accessToken: tokenData.accessToken };
});

async function refreshGoogleToken(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}


