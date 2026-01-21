import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create JWT for Google OAuth2
async function createJWT(serviceAccount: any): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  // Base64url encode
  const encoder = new TextEncoder();
  const base64url = (data: Uint8Array): string => {
    const base64 = btoa(String.fromCharCode(...data));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const headerB64 = base64url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64url(encoder.encode(JSON.stringify(payload)));
  const signatureInput = `${headerB64}.${payloadB64}`;

  // Parse PEM private key
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  let pemContents = serviceAccount.private_key;
  pemContents = pemContents.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  // Import the key
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Sign
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = base64url(new Uint8Array(signature));
  return `${signatureInput}.${signatureB64}`;
}

// Get OAuth2 access token
async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwt = await createJWT(serviceAccount);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OAuth token error:", error);
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Send notification via FCM v1 API
async function sendFCMNotification(
  accessToken: string,
  projectId: string,
  token: string,
  notification: { title: string; body: string; image?: string },
  data?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  // Truncate body to prevent "message too big" error (max ~4KB total payload)
  const truncatedBody = notification.body.length > 500 
    ? notification.body.substring(0, 497) + "..." 
    : notification.body;

  const truncatedTitle = notification.title.length > 100
    ? notification.title.substring(0, 97) + "..."
    : notification.title;

  // Clean data object - only include essential string data
  const cleanData: Record<string, string> = {};
  if (data) {
    if (data.link) cleanData.link = data.link.substring(0, 500);
    if (data.movieId) cleanData.movieId = data.movieId;
    if (data.type) cleanData.type = data.type;
  }

  const message: any = {
    message: {
      token,
      notification: {
        title: truncatedTitle,
        body: truncatedBody,
      },
      webpush: {
        notification: {
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-192x192.png",
          requireInteraction: true,
        },
        fcm_options: {},
      },
    },
  };

  // Add image if provided and valid URL
  if (notification.image && notification.image.startsWith("http")) {
    message.message.notification.image = notification.image;
    message.message.webpush.notification.image = notification.image;
  }

  // Add custom data
  if (Object.keys(cleanData).length > 0) {
    message.message.data = cleanData;
    if (cleanData.link) {
      message.message.webpush.fcm_options.link = cleanData.link;
    }
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("FCM send error:", error);
      
      // Check if token is invalid/expired
      if (error.includes("UNREGISTERED") || error.includes("INVALID_ARGUMENT")) {
        return { success: false, error: "invalid_token" };
      }
      
      return { success: false, error };
    }

    const result = await response.json();
    console.log("FCM send success:", result);
    return { success: true };
  } catch (error) {
    console.error("FCM request error:", error);
    return { success: false, error: String(error) };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountJson) {
      console.error("FIREBASE_SERVICE_ACCOUNT_JSON not configured");
      return new Response(
        JSON.stringify({ error: "Service account not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (e) {
      console.error("Invalid service account JSON:", e);
      return new Response(
        JSON.stringify({ error: "Invalid service account JSON" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { tokens, title, body, image, data } = await req.json();
    
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return new Response(
        JSON.stringify({ error: "No tokens provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "Title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending notification to ${tokens.length} tokens`);

    // Get access token
    const accessToken = await getAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;

    // Send to all tokens
    const results = await Promise.all(
      tokens.map((token) =>
        sendFCMNotification(
          accessToken,
          projectId,
          token,
          { title, body, image },
          data
        )
      )
    );

    const successCount = results.filter((r) => r.success).length;
    const failedTokens = results
      .map((r, i) => (r.success ? null : { token: tokens[i], error: r.error }))
      .filter(Boolean);

    console.log(`Sent: ${successCount}/${tokens.length} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failedTokens.length,
        failedTokens: failedTokens.slice(0, 10), // Return first 10 failed for debugging
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
