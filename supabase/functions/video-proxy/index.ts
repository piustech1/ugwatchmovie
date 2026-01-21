import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const videoUrl = url.searchParams.get('url');

    if (!videoUrl) {
      console.error('No video URL provided');
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Proxying video:', videoUrl);

    // Get range header for seeking support
    const rangeHeader = req.headers.get('range');
    
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    if (rangeHeader) {
      headers['Range'] = rangeHeader;
      console.log('Range request:', rangeHeader);
    }

    const response = await fetch(videoUrl, { headers });

    if (!response.ok && response.status !== 206) {
      console.error('Failed to fetch video:', response.status, response.statusText);
      return new Response(JSON.stringify({ error: 'Failed to fetch video' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build response headers
    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    };

    // Forward content headers
    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }

    const contentRange = response.headers.get('Content-Range');
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange;
    }

    console.log('Streaming video, status:', response.status);

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error: unknown) {
    console.error('Error in video-proxy:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
