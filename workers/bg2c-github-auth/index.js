const SITE_ORIGIN = "https://www.beginnersguidetocanada.ca";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const callback = `${url.origin}/callback`;

    if (url.pathname === "/auth") {
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
        return new Response("GitHub credentials are missing", {
          status: 500,
          headers: { "Cache-Control": "no-store" }
        });
      }

      const state = crypto.randomUUID();
      const github = new URL("https://github.com/login/oauth/authorize");
      github.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      github.searchParams.set("redirect_uri", callback);
      github.searchParams.set("scope", "repo");
      github.searchParams.set("state", state);

      return new Response(null, {
        status: 302,
        headers: {
          Location: github.toString(),
          "Set-Cookie": `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
          "Cache-Control": "no-store"
        }
      });
    }

    if (url.pathname === "/callback") {
      const githubError = url.searchParams.get("error");
      if (githubError) {
        const description = url.searchParams.get("error_description") || "GitHub authorization was not completed.";
        return new Response(`GitHub authorization error: ${githubError}\n${description}`, {
          status: 401,
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
        });
      }

      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const cookie = request.headers.get("Cookie") || "";
      const savedState = cookie
        .split(";")
        .map(x => x.trim())
        .find(x => x.startsWith("oauth_state="))
        ?.slice("oauth_state=".length);

      if (!code || !state || state !== savedState) {
        return new Response("Invalid login request. Please close this window and try again.", {
          status: 403,
          headers: { "Cache-Control": "no-store" }
        });
      }

      let response;
      try {
        response = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: callback
          })
        });
      } catch {
        return new Response("Could not contact GitHub to complete login. Please try again.", {
          status: 502,
          headers: { "Cache-Control": "no-store" }
        });
      }

      let result;
      try {
        result = await response.json();
      } catch {
        return new Response("Unable to read GitHub authentication response.", {
          status: 502,
          headers: { "Cache-Control": "no-store" }
        });
      }

      if (!response.ok || !result.access_token) {
        const error = result.error || "unknown_error";
        const description = result.error_description || "No further details provided.";
        return new Response(`GitHub OAuth error: ${error}\n${description}`, {
          status: 401,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store"
          }
        });
      }

      const payload = JSON.stringify({
        token: result.access_token,
        provider: "github"
      });

      const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BG2C GitHub Authentication</title></head>
<body>
<p>Completing GitHub login...</p>
<script>
(function () {
  const origin = ${JSON.stringify(SITE_ORIGIN)};
  const payload = ${JSON.stringify(payload)};

  if (!window.opener) {
    document.body.textContent = "Please return to the dashboard and try again.";
    return;
  }

  function receive(event) {
    if (event.origin !== origin) return;
    if (event.data === "authorizing:github") {
      window.opener.postMessage("authorization:github:success:" + payload, origin);
      window.removeEventListener("message", receive);
      setTimeout(function () { window.close(); }, 500);
    }
  }

  window.addEventListener("message", receive);
  window.opener.postMessage("authorizing:github", origin);
})();
</script>
</body>
</html>`;

      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "Set-Cookie": "oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
        }
      });
    }

    return new Response("BG2C GitHub authentication ready", {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
};
