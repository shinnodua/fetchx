interface R2ObjectBody {
  text: () => Promise<string>;
}

interface R2Bucket {
  get: (key: string) => Promise<R2ObjectBody | null>;
}

interface Env {
  DESKTOP_RELEASES: R2Bucket;
  UPDATE_CHANNEL: string;
}

interface PlatformRelease {
  sha256?: string;
  signature: string;
  url: string;
  download_url?: string;
}

interface ReleaseManifest {
  notes?: string;
  platforms: Record<string, PlatformRelease>;
  pub_date?: string;
  version: string;
}

const UPDATE_PATH =
  /^\/v1\/update\/(darwin|windows)\/(aarch64|x86_64)\/([^/]+)$/;
const SEMVER = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

function compareVersions(left: string, right: string) {
  const leftMatch = SEMVER.exec(left);
  const rightMatch = SEMVER.exec(right);
  if (!leftMatch || !rightMatch) return null;

  for (let index = 1; index <= 3; index += 1) {
    const difference = Number(leftMatch[index]) - Number(rightMatch[index]);
    if (difference !== 0) return difference;
  }

  const leftPrerelease = leftMatch[4];
  const rightPrerelease = rightMatch[4];
  if (leftPrerelease === rightPrerelease) return 0;
  if (!leftPrerelease) return 1;
  if (!rightPrerelease) return -1;
  return leftPrerelease.localeCompare(rightPrerelease);
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      ...CORS_HEADERS,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'GET, OPTIONS', ...CORS_HEADERS },
      });
    }

    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return jsonResponse({ status: 'ok' });
    }

    const match = UPDATE_PATH.exec(url.pathname);
    if (!match)
      return new Response('Not Found', { status: 404, headers: CORS_HEADERS });

    const [, target, arch, currentVersion] = match;
    const manifestObject = await env.DESKTOP_RELEASES.get(
      `channels/${env.UPDATE_CHANNEL}.json`,
    );
    if (!manifestObject) {
      return jsonResponse({ error: 'Release manifest is unavailable.' }, 503);
    }

    let manifest: ReleaseManifest;
    try {
      manifest = JSON.parse(await manifestObject.text()) as ReleaseManifest;
    } catch {
      return jsonResponse({ error: 'Release manifest is invalid.' }, 500);
    }

    const comparison = compareVersions(manifest.version, currentVersion);
    if (comparison === null) {
      return jsonResponse({ error: 'Invalid application version.' }, 400);
    }
    if (comparison <= 0)
      return new Response(null, { status: 204, headers: CORS_HEADERS });

    const platform = manifest.platforms[`${target}-${arch}`];
    const updateUrl = platform?.url;
    let downloadUrl = platform?.download_url || updateUrl;

    // Fallback for macOS: compute DMG URL if not explicitly provided
    if (!platform?.download_url && updateUrl && target === 'darwin') {
      const baseUrl = updateUrl.substring(0, updateUrl.lastIndexOf('/'));
      const dmgArch = arch === 'x86_64' ? 'x64' : arch;
      downloadUrl = `${baseUrl}/Fetchx_${manifest.version}_${dmgArch}.dmg`;
    }

    const updateSignature = platform?.signature;
    if (
      !updateUrl?.startsWith('https://downloads.fetchx.dev/') ||
      !updateSignature?.trim()
    ) {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    return jsonResponse({
      version: manifest.version,
      notes: manifest.notes,
      pub_date: manifest.pub_date,
      url: updateUrl,
      signature: updateSignature,
      download_url: downloadUrl,
    });
  },
};
