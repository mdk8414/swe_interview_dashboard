export const systemDesignSeed = [
  {
    slug: "url-shortener",
    title: "URL Shortener (bit.ly)",
    prompt:
      "Design a URL shortening service. Users submit long URLs and receive a short alias; visiting the alias redirects to the original URL. Discuss read/write ratio, key generation, storage, caching, analytics, and custom aliases.",
  },
  {
    slug: "twitter-timeline",
    title: "Twitter Timeline / News Feed",
    prompt:
      "Design the home timeline for a Twitter-like service. Discuss fan-out on write vs read, hot users (celebrities), media handling, ranking, and pagination.",
  },
  {
    slug: "rate-limiter",
    title: "Distributed Rate Limiter",
    prompt:
      "Design a rate limiter that can be applied per user / per API key across many service nodes. Discuss algorithms (token bucket, leaky bucket, sliding window), shared state (Redis), failure modes, and accuracy vs cost trade-offs.",
  },
  {
    slug: "distributed-cache",
    title: "Distributed Cache",
    prompt:
      "Design a distributed in-memory cache (think Memcached/Redis cluster). Discuss consistent hashing, replication, eviction policies, hot keys, and cache invalidation strategies.",
  },
  {
    slug: "chat-app",
    title: "Real-time Chat (WhatsApp/Slack)",
    prompt:
      "Design a real-time messaging system supporting 1:1 and group chats. Discuss message delivery semantics, presence, push notifications, message storage, and offline sync.",
  },
  {
    slug: "search-autocomplete",
    title: "Search Autocomplete / Typeahead",
    prompt:
      "Design a typeahead suggestion service for a search box. Discuss trie storage, ranking by popularity, sharding, real-time updates, and personalization.",
  },
  {
    slug: "video-streaming",
    title: "Video Streaming (YouTube/Netflix)",
    prompt:
      "Design a video upload + streaming platform. Discuss transcoding pipeline, CDN, adaptive bitrate, storage (cold/hot), and metadata.",
  },
  {
    slug: "ride-sharing",
    title: "Ride Sharing (Uber/Lyft)",
    prompt:
      "Design the matching backend for a ride-sharing service. Discuss driver location updates, geo-indexing (geohash, S2), surge pricing, ETA calculation, and payment.",
  },
  {
    slug: "payment-system",
    title: "Payment / Wallet System",
    prompt:
      "Design a payment processing system handling money transfers between users. Discuss idempotency, double-entry accounting, consistency, retries, and reconciliation.",
  },
  {
    slug: "news-feed-ranking",
    title: "News Feed Ranking",
    prompt:
      "Design the ranking layer for a personalized news feed. Discuss candidate generation, feature extraction, ML model serving, A/B testing infrastructure, and freshness vs relevance.",
  },
];
