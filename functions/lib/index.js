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
exports.convertPhotosToBase64 = exports.serveGooglePhoto = exports.getOAuthToken = exports.storeOAuthToken = void 0;
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
        if (e instanceof Error && e.message.includes('Already exists')) {
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
/**
 * Proxy function to serve Google Photos images and avoid CORS issues
 */
exports.serveGooglePhoto = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }
    const { photoUrl } = data;
    if (!photoUrl) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing photoUrl');
    }
    try {
        // Get the user's Google Photos access token
        const tokenResult = await exports.getOAuthToken.run({ provider: 'photos' }, { auth: context.auth });
        const accessToken = tokenResult.accessToken;
        // Fetch the image from Google Photos with the access token
        const response = await fetch(photoUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) {
            throw new functions.https.HttpsError('internal', `Failed to fetch photo: ${response.statusText}`);
        }
        // Get the image data
        const imageBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        // Return the image data as base64
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        return {
            imageData: `data:${contentType};base64,${base64Image}`,
            contentType,
        };
    }
    catch (error) {
        console.error('Error serving Google Photo:', error);
        throw new functions.https.HttpsError('internal', 'Failed to serve photo');
    }
});
/**
 * Convert Google Photos media items to base64 data URLs
 */
exports.convertPhotosToBase64 = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }
    const { mediaItems, accessToken, targetWidth, targetHeight, crop } = data;
    if (!mediaItems || !Array.isArray(mediaItems)) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid mediaItems');
    }
    if (!accessToken) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing accessToken');
    }
    try {
        console.log(`Converting ${mediaItems.length} photos to base64...`);
        if (targetWidth || targetHeight) {
            console.log(`Requested target size: ${targetWidth || 'auto'}x${targetHeight || 'auto'} crop=${!!crop}`);
        }
        // LOG THE FULL STRUCTURE OF THE FIRST MEDIA ITEM
        console.log('Full mediaItem[0] structure:', JSON.stringify(mediaItems[0], null, 2));
        console.log('Keys in mediaItem[0]:', Object.keys(mediaItems[0]));
        if (mediaItems[0].mediaFile) {
            console.log('mediaFile keys:', Object.keys(mediaItems[0].mediaFile));
            console.log('mediaFile.baseUrl:', mediaItems[0].mediaFile.baseUrl);
        }
        const results = await Promise.all(mediaItems.map(async (mediaItem, index) => {
            try {
                // Try multiple possible locations for baseUrl
                const rawBaseUrl = mediaItem.mediaFile?.baseUrl
                    || mediaItem.mediaFile?.downloadUrl
                    || mediaItem.mediaFile?.openUrl
                    || mediaItem.baseUrl
                    || mediaItem.productUrl;
                console.log(`[${index}] Attempting to find baseUrl...`);
                console.log(`[${index}] mediaFile?.baseUrl: ${mediaItem.mediaFile?.baseUrl}`);
                console.log(`[${index}] baseUrl: ${mediaItem.baseUrl}`);
                console.log(`[${index}] productUrl: ${mediaItem.productUrl}`);
                if (!rawBaseUrl) {
                    throw new Error('No baseUrl found in any expected location');
                }
                // Strip any existing params after the first '=' per Photos URL rules
                const cleanUrl = String(rawBaseUrl).split('=')[0];
                console.log(`[${index}] Clean base URL: ${cleanUrl}`);
                // Attempt to fetch full media item via Library API to obtain true
                // dimensions and canonical baseUrl for sizing. This may fail if the
                // token/scopes are restricted; we gracefully fall back.
                let libraryBaseUrl = null;
                let fullWidth = 0;
                let fullHeight = 0;
                try {
                    const metaResp = await fetch(`https://photoslibrary.googleapis.com/v1/mediaItems/${encodeURIComponent(mediaItem.id)}`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        }
                    });
                    if (metaResp.ok) {
                        const meta = await metaResp.json();
                        const rawLibUrl = meta?.baseUrl;
                        const dims = meta?.mediaMetadata;
                        if (rawLibUrl) {
                            libraryBaseUrl = String(rawLibUrl).split('=')[0];
                        }
                        if (dims?.width && dims?.height) {
                            fullWidth = parseInt(dims.width, 10) || 0;
                            fullHeight = parseInt(dims.height, 10) || 0;
                        }
                        console.log(`[${index}] Library API ok. baseUrl=${libraryBaseUrl} width=${fullWidth} height=${fullHeight}`);
                    }
                    else {
                        const errTxt = await metaResp.text().catch(() => '');
                        console.warn(`[${index}] Library API get failed: ${metaResp.status} ${metaResp.statusText} ${errTxt}`);
                    }
                }
                catch (e) {
                    console.warn(`[${index}] Library API get threw`, e);
                }
                // Build candidate URLs: prefer caller target size if provided, else exact full-size
                // if known from Library API, then try original download, then large sizes.
                const candidateUrls = [];
                if (targetWidth || targetHeight) {
                    const w = targetWidth && targetWidth > 0 ? `w${Math.round(targetWidth)}` : '';
                    const h = targetHeight && targetHeight > 0 ? `h${Math.round(targetHeight)}` : '';
                    const parts = [w, h].filter(Boolean).join('-');
                    const cropSuffix = crop ? '-c' : '';
                    candidateUrls.push(`${libraryBaseUrl || cleanUrl}=${parts}${cropSuffix}`);
                }
                else if (libraryBaseUrl && fullWidth > 0 && fullHeight > 0) {
                    candidateUrls.push(`${libraryBaseUrl}=w${fullWidth}-h${fullHeight}`);
                }
                candidateUrls.push(`${libraryBaseUrl || cleanUrl}=d`);
                candidateUrls.push(`${libraryBaseUrl || cleanUrl}=w8192-h8192`);
                candidateUrls.push(`${libraryBaseUrl || cleanUrl}=w4096-h4096`);
                candidateUrls.push(`${libraryBaseUrl || cleanUrl}=s4096`);
                let chosenBuffer = null;
                let chosenContentType = 'image/jpeg';
                let chosenUrl = null;
                let chosenLength = 0;
                for (const candidate of candidateUrls) {
                    console.log(`[${index}] Fetching candidate: ${candidate}`);
                    const resp = await fetch(candidate, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        }
                    });
                    if (!resp.ok) {
                        console.warn(`[${index}] Candidate failed: ${resp.status} ${resp.statusText}`);
                        continue;
                    }
                    const contentLengthHeader = resp.headers.get('content-length');
                    const contentTypeHeader = resp.headers.get('content-type') || 'image/jpeg';
                    const buf = await resp.arrayBuffer();
                    const bufSize = buf.byteLength;
                    const lengthParsed = contentLengthHeader ? parseInt(contentLengthHeader, 10) : bufSize;
                    console.log(`[${index}] Candidate OK - type: ${contentTypeHeader}, length: ${lengthParsed} bytes`);
                    // Heuristic: prefer the first candidate that exceeds 300KB
                    if (bufSize >= 300000) {
                        chosenBuffer = buf;
                        chosenContentType = contentTypeHeader;
                        chosenUrl = candidate;
                        chosenLength = bufSize;
                        break;
                    }
                    // Otherwise keep the largest so far
                    if (!chosenBuffer || bufSize > chosenLength) {
                        chosenBuffer = buf;
                        chosenContentType = contentTypeHeader;
                        chosenUrl = candidate;
                        chosenLength = bufSize;
                    }
                }
                if (!chosenBuffer) {
                    throw new Error('All candidate downloads failed');
                }
                console.log(`[${index}] Chosen URL: ${chosenUrl}`);
                console.log(`[${index}] Final buffer size: ${chosenLength} bytes`);
                const base64 = Buffer.from(chosenBuffer).toString('base64');
                return {
                    id: mediaItem.id,
                    base64Data: `data:${chosenContentType};base64,${base64}`,
                    mimeType: chosenContentType,
                    filename: mediaItem.filename || `photo_${mediaItem.id}.jpg`,
                    bufferSize: chosenLength,
                    originalBaseUrl: cleanUrl,
                    usedUrl: chosenUrl,
                    success: true
                };
            }
            catch (error) {
                console.error(`Failed to convert photo ${mediaItem.id}:`, error);
                return {
                    id: mediaItem.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    success: false
                };
            }
        }));
        const successful = results.filter(r => r.success);
        console.log('Successful conversions with sizes:', successful.map(s => ({
            id: s.id,
            bytes: s.bufferSize
        })));
        return {
            results: successful,
            failed: results.filter(r => !r.success),
        };
    }
    catch (error) {
        console.error('Error converting photos:', error);
        throw new functions.https.HttpsError('internal', 'Failed to convert photos');
    }
});
