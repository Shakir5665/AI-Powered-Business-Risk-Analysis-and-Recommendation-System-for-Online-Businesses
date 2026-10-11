import time
import threading
from urllib.parse import urlparse, urlunparse
from typing import Optional, Dict, Any


class PreviewCache:
    """
    Thread-safe in-memory cache for product previews with TTL support.
    Avoids redundant web requests for recently previewed products.
    """

    def __init__(self, default_ttl_seconds: int = 3600):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self._default_ttl = default_ttl_seconds

    def _normalize_url(self, url: str) -> str:
        """
        Normalizes product URL by stripping query parameters and fragments.
        E.g. https://www.daraz.lk/products/...-i123.html?spm=... -> https://www.daraz.lk/products/...-i123.html
        """
        if not url:
            return ""
        parsed = urlparse(url.strip())
        # Keep scheme, netloc (lowercase), path
        normalized = urlunparse((
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            parsed.path.rstrip("/"),
            "",
            "",
            ""
        ))
        return normalized

    def get(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a cached preview dictionary if present and not expired.
        """
        key = self._normalize_url(url)
        if not key:
            return None

        with self._lock:
            entry = self._cache.get(key)
            if not entry:
                return None

            # Check expiration
            if time.time() > entry.get("expires_at", 0):
                del self._cache[key]
                return None

            # Return a copy of cached data to prevent external mutation
            data = dict(entry.get("data", {}))

            # Self-healing: if cached data has invalid/placeholder seller, discard cache
            cached_seller = str(data.get("seller") or "").strip().lower()
            if cached_seller in ["no brand", "none", "n/a", "become a seller"]:
                del self._cache[key]
                return None

            return data

    def set(self, url: str, data: Dict[str, Any], ttl_seconds: Optional[int] = None) -> None:
        """
        Stores preview data in cache with TTL.
        """
        key = self._normalize_url(url)
        if not key or not data:
            return

        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        expires_at = time.time() + ttl

        with self._lock:
            self._cache[key] = {
                "data": dict(data),
                "expires_at": expires_at,
                "cached_at": time.time(),
            }

    def clear(self) -> None:
        """
        Clears all cached entries.
        """
        with self._lock:
            self._cache.clear()

    def size(self) -> int:
        """
        Returns number of active, non-expired cache entries.
        """
        now = time.time()
        with self._lock:
            # Clean expired on size check
            expired_keys = [k for k, v in self._cache.items() if now > v.get("expires_at", 0)]
            for k in expired_keys:
                del self._cache[k]
            return len(self._cache)


# Global singleton instance
preview_cache = PreviewCache()
