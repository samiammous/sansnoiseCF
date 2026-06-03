import contactHandler from "./functions/api/contact.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route API requests to the contact handler
    if (url.pathname === "/api/contact") {
      return contactHandler.onRequestPost({ request, env, ctx });
    }

    // Everything else: serve static assets
    return env.ASSETS.fetch(request);
  },
};
