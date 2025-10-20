"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOAuthToken = exports.storeOAuthToken = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const secret_manager_1 = require("@google-cloud/secret-manager");
const googleapis_1 = require("googleapis");
admin.initializeApp();
const secretManager = new secret_manager_1.SecretManagerServiceClient();
exports.storeOAuthToken = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }
    const { provider, accessToken, refreshToken, expiresAt } = data;
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
    }
    catch (e) {
        if (e?.message?.includes('Already exists')) {
            // ok
        }
        else {
            throw e;
        }
    }
    const [secret] = await secretManager.getSecret({ name: `${parent}/secrets/${secretId}` });
    await secretManager.addSecretVersion({
        parent: secret.name,
        payload: { data: Buffer.from(JSON.stringify({ accessToken, refreshToken, expiresAt })) },
    });
    await admin
        .firestore()
        .collection('users')
        .doc(uid)
        .collection('integrations')
        .doc(provider)
        .set({
        provider,
        secretName: secret.name,
        connectedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: expiresAt ?? null,
    }, { merge: true });
    return { success: true };
});
exports.getOAuthToken = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }
    const { provider } = data;
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
    const { secretName, expiresAt } = integrationDoc.data();
    const [version] = await secretManager.accessSecretVersion({ name: `${secretName}/versions/latest` });
    const tokenData = JSON.parse(version.payload?.data?.toString() || '{}');
    // Refresh if needed and refreshToken exists
    if (expiresAt && Date.now() >= expiresAt && tokenData.refreshToken) {
        const refreshed = await refreshGoogleToken(tokenData.refreshToken);
        const expiresAt = typeof refreshed.expiry_date === 'number'
            ? refreshed.expiry_date
            : Date.now() + 3600 * 1000;
        await exports.storeOAuthToken.run({
            provider,
            accessToken: refreshed.access_token,
            refreshToken: tokenData.refreshToken,
            expiresAt,
        }, { auth: context.auth });
        return { accessToken: refreshed.access_token };
    }
    return { accessToken: tokenData.accessToken };
});
async function refreshGoogleToken(refreshToken) {
    const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
}
