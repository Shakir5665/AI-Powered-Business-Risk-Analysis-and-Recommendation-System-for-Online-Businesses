import re
import html
import json
import logging
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse

logger = logging.getLogger("scraper")


class FastPreviewFetcher:
    """
    Tier 1 Fast Preview Fetcher.
    Fetches raw product HTML via lightweight HTTP GET (no headless browser overhead)
    and extracts metadata using JSON-LD structured data, embedded __INIT_DATA__ page state,
    and regex-based HTML extraction.
    Executes in under 1.5 seconds.
    """

    DEFAULT_USER_AGENT = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )

    INVALID_SELLERS = {
        "no brand", "nobrand", "become a seller", "become a seller!",
        "n/a", "none", "unknown", "chat", "visit store", "store"
    }

    INVALID_TITLES = {
        "error", "404", "page not found", "not found", "products", "catalog",
        "category", "daraz products", "search", "daraz verified product",
        "online shopping", "daraz", "daraz.lk"
    }

    def __init__(self, timeout_seconds: float = 8.0):
        self.timeout_seconds = timeout_seconds

    def _get_headers(self) -> dict:
        return {
            "User-Agent": self.DEFAULT_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate",
            "Cache-Control": "max-age=0",
            "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
        }

    def _fetch_html(self, url: str) -> Optional[str]:
        """
        Fetches raw HTML using httpx if available, falling back to urllib.request.
        """
        headers = self._get_headers()

        # 1. Try httpx first
        try:
            import httpx
            with httpx.Client(timeout=self.timeout_seconds, follow_redirects=True, verify=False) as client:
                response = client.get(url, headers=headers)
                if response.status_code == 200:
                    return response.text
                logger.warning(f"FastPreviewFetcher: HTTP status {response.status_code} for {url}")
                return None
        except ImportError:
            pass
        except Exception as e:
            logger.warning(f"FastPreviewFetcher: httpx request failed ({e}), trying urllib fallback")

        # 2. Fallback to urllib.request
        try:
            import urllib.request
            import ssl
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=self.timeout_seconds, context=ctx) as resp:
                if resp.status == 200:
                    raw_bytes = resp.read()
                    try:
                        return raw_bytes.decode("utf-8")
                    except UnicodeDecodeError:
                        return raw_bytes.decode("latin-1", errors="replace")
        except Exception as e:
            logger.warning(f"FastPreviewFetcher: urllib request failed: {e}")

        return None

    def _parse_title_from_url(self, url: str) -> str:
        """
        Parses title slug from Daraz product URL as a baseline fallback.
        """
        try:
            path = urlparse(url).path
            slug = path.split("/")[-1]
            if slug.endswith(".html"):
                slug = slug[:-5]
            if "-i" in slug:
                slug = slug.split("-i")[0]
            words = slug.replace("-", " ").strip()
            return " ".join(w.capitalize() for w in words.split())
        except Exception:
            return "Daraz Product"

    def _extract_json_ld(self, html_text: str) -> Optional[dict]:
        """
        Finds and parses schema.org Product JSON-LD block.
        """
        try:
            matches = re.findall(
                r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
                html_text,
                re.DOTALL | re.IGNORECASE,
            )
            for m in matches:
                try:
                    data = json.loads(m.strip())
                    if isinstance(data, dict):
                        schema_type = data.get("@type", "")
                        if schema_type in ("Product", "ItemPage") or "name" in data:
                            return data
                    elif isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict) and item.get("@type") == "Product":
                                return item
                except json.JSONDecodeError:
                    continue
        except Exception:
            pass
        return None

    def _extract_init_data(self, html_text: str) -> Optional[dict]:
        """
        Extracts embedded page state JSON (window.__INIT_DATA__, pageData, appData)
        using json.JSONDecoder.raw_decode for robust bracket matching.
        """
        targets = [
            "__INIT_DATA__",
            "pageData",
            "appData",
            "pdpData",
            "__INITIAL_DATA__",
        ]
        decoder = json.JSONDecoder()

        for target in targets:
            start_pos = 0
            while True:
                idx = html_text.find(target, start_pos)
                if idx == -1:
                    break
                brace_idx = html_text.find("{", idx)
                if brace_idx != -1 and (brace_idx - idx) < 150:
                    try:
                        data, _ = decoder.raw_decode(html_text[brace_idx:])
                        if isinstance(data, dict):
                            return data
                    except Exception:
                        pass
                start_pos = idx + len(target)

        return None

    def _deep_find(self, container: Any, target_key: str) -> List[Any]:
        """
        Recursively collects all values for a given key in a nested dict or list.
        """
        results = []
        if isinstance(container, dict):
            for k, v in container.items():
                if str(k).lower() == target_key.lower():
                    results.append(v)
                if isinstance(v, (dict, list)):
                    results.extend(self._deep_find(v, target_key))
        elif isinstance(container, list):
            for item in container:
                if isinstance(item, (dict, list)):
                    results.extend(self._deep_find(item, target_key))
        return results

    def _parse_from_init_data(self, data: dict) -> Dict[str, Any]:
        """
        Parses seller, rating, reviews, title, and image from Daraz __INIT_DATA__.
        """
        extracted: Dict[str, Any] = {}

        # 1. Locate fields container
        fields = {}
        if isinstance(data.get("data"), dict) and isinstance(data["data"].get("root"), dict):
            fields = data["data"]["root"].get("fields", {})
        elif isinstance(data.get("root"), dict):
            fields = data["root"].get("fields", {})
        elif isinstance(data.get("fields"), dict):
            fields = data.get("fields", {})

        # --- A. Seller Extraction ---
        seller_candidates = []
        seller_obj = fields.get("seller", {})
        if isinstance(seller_obj, dict):
            seller_candidates.append(seller_obj)

        for s in self._deep_find(data, "seller") + self._deep_find(data, "shop"):
            if isinstance(s, dict):
                seller_candidates.append(s)

        for s in seller_candidates:
            name = (
                s.get("name")
                or s.get("sellerTitle")
                or s.get("sellerName")
                or s.get("title")
                or s.get("storeName")
            )
            if name:
                clean_name = html.unescape(str(name).strip())
                if clean_name.lower() not in self.INVALID_SELLERS:
                    extracted["seller"] = clean_name
                    break

        # --- B. Rating & Reviews Extraction ---
        review_candidates = []
        review_obj = fields.get("review", {})
        if isinstance(review_obj, dict):
            review_candidates.append(review_obj)

        for r in self._deep_find(data, "review") + self._deep_find(data, "ratings"):
            if isinstance(r, dict):
                review_candidates.append(r)

        for r in review_candidates:
            # Check nested ratings or scores dict
            info = r.get("ratings") or r.get("info") or r.get("scores") or r

            if isinstance(info, dict):
                # Score / Rating
                if "overallRating" not in extracted:
                    score_val = (
                        info.get("score")
                        or info.get("rate")
                        or info.get("ratingValue")
                        or info.get("average")
                        or info.get("rating")
                    )
                    if score_val is not None:
                        try:
                            f_score = float(score_val)
                            if 0.0 < f_score <= 5.0:
                                extracted["overallRating"] = round(f_score, 1)
                        except (ValueError, TypeError):
                            pass

                # Review / Rating count
                if "totalReviews" not in extracted:
                    count_val = (
                        info.get("reviewCount")
                        or info.get("ratingCount")
                        or info.get("count")
                        or info.get("total")
                        or info.get("totalRatings")
                    )
                    if count_val is not None:
                        try:
                            extracted["totalReviews"] = int(count_val)
                        except (ValueError, TypeError):
                            pass

        # --- C. Product Title & Image from fields ---
        product_obj = fields.get("product", {})
        if isinstance(product_obj, dict) and product_obj.get("title"):
            extracted["title"] = html.unescape(str(product_obj["title"]).strip())

        sku_galleries = fields.get("skuGalleries", [])
        if isinstance(sku_galleries, list) and sku_galleries:
            first_img = sku_galleries[0]
            if isinstance(first_img, dict) and first_img.get("src"):
                extracted["imageUrl"] = first_img["src"]
            elif isinstance(first_img, str) and first_img.startswith("http"):
                extracted["imageUrl"] = first_img

        return extracted

    def fetch(self, product_url: str) -> Optional[Dict[str, Any]]:
        """
        Attempts fast metadata extraction without launching a browser.
        Returns parsed dict if successful, or None to signal fallback to Tier 2 (Selenium).
        """
        html_text = self._fetch_html(product_url)
        if not html_text or len(html_text) < 500:
            logger.info("FastPreviewFetcher: HTML payload empty or too small, falling back.")
            return None

        fallback_title = self._parse_title_from_url(product_url)
        title = fallback_title
        image_url = ""
        seller = "N/A"
        overall_rating = 0.0
        total_reviews = 0
        category = "N/A"
        platform = "Daraz"

        # ----------------------------------------------------
        # 1. Parse __INIT_DATA__ page state (richest source)
        # ----------------------------------------------------
        init_data = self._extract_init_data(html_text)
        if init_data:
            parsed_init = self._parse_from_init_data(init_data)
            if parsed_init.get("seller"):
                seller = parsed_init["seller"]
            if parsed_init.get("overallRating") is not None:
                overall_rating = parsed_init["overallRating"]
            if parsed_init.get("totalReviews") is not None:
                total_reviews = parsed_init["totalReviews"]
            if parsed_init.get("title"):
                title = parsed_init["title"]
            if parsed_init.get("imageUrl"):
                image_url = parsed_init["imageUrl"]

        # ----------------------------------------------------
        # 2. Parse JSON-LD structured data
        # ----------------------------------------------------
        json_ld = self._extract_json_ld(html_text)
        if json_ld:
            # Title
            if (not title or title == fallback_title) and json_ld.get("name"):
                title = html.unescape(str(json_ld["name"]).strip())

            # Image
            if not image_url:
                img = json_ld.get("image")
                if isinstance(img, str) and img.startswith("http"):
                    image_url = img
                elif isinstance(img, list) and img and isinstance(img[0], str):
                    image_url = img[0]

            # Seller from offers (NEVER use brand as seller!)
            if seller == "N/A" or seller.lower() in self.INVALID_SELLERS:
                offers = json_ld.get("offers")
                if isinstance(offers, dict):
                    seller_obj = offers.get("seller")
                    if isinstance(seller_obj, dict) and seller_obj.get("name"):
                        s_name = html.unescape(str(seller_obj["name"]).strip())
                        if s_name.lower() not in self.INVALID_SELLERS:
                            seller = s_name
                elif isinstance(offers, list) and offers:
                    for off in offers:
                        if isinstance(off, dict):
                            seller_obj = off.get("seller")
                            if isinstance(seller_obj, dict) and seller_obj.get("name"):
                                s_name = html.unescape(str(seller_obj["name"]).strip())
                                if s_name.lower() not in self.INVALID_SELLERS:
                                    seller = s_name
                                    break

            # Rating & Review Count from JSON-LD
            if overall_rating == 0.0 or total_reviews == 0:
                agg_rating = json_ld.get("aggregateRating")
                if isinstance(agg_rating, dict):
                    if overall_rating == 0.0:
                        try:
                            r_val = float(agg_rating.get("ratingValue") or 0.0)
                            if 0.0 < r_val <= 5.0:
                                overall_rating = round(r_val, 1)
                        except (ValueError, TypeError):
                            pass
                    if total_reviews == 0:
                        try:
                            c_val = int(agg_rating.get("reviewCount") or agg_rating.get("ratingCount") or 0)
                            total_reviews = max(0, c_val)
                        except (ValueError, TypeError):
                            pass

            # Category
            if category == "N/A" and json_ld.get("category"):
                category = html.unescape(str(json_ld["category"]).strip())

        # ----------------------------------------------------
        # 3. OpenGraph & HTML Meta Tags
        # ----------------------------------------------------
        if title == fallback_title or not title:
            og_title = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']', html_text, re.IGNORECASE)
            if not og_title:
                og_title = re.search(r'<meta\s+content=["\']([^"\']+)["\']\s+property=["\']og:title["\']', html_text, re.IGNORECASE)
            if og_title:
                raw_t = html.unescape(og_title.group(1).strip())
                clean_t = re.sub(r'\s*\|\s*Daraz.*$', '', raw_t, flags=re.IGNORECASE).strip()
                if clean_t:
                    title = clean_t
            else:
                title_tag = re.search(r'<title>([^<]+)</title>', html_text, re.IGNORECASE)
                if title_tag:
                    raw_t = html.unescape(title_tag.group(1).strip())
                    clean_t = re.sub(r'\s*\|\s*Daraz.*$', '', raw_t, flags=re.IGNORECASE).strip()
                    if clean_t and clean_t.lower() not in ["daraz", "online shopping"]:
                        title = clean_t

        if not image_url:
            og_img = re.search(r'<meta\s+(?:property|name)=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html_text, re.IGNORECASE)
            if not og_img:
                og_img = re.search(r'<meta\s+content=["\']([^"\']+)["\']\s+(?:property|name)=["\']og:image["\']', html_text, re.IGNORECASE)
            if og_img and og_img.group(1).startswith("http"):
                image_url = og_img.group(1).strip()

        # ----------------------------------------------------
        # 4. HTML Elements & Regex Extraction (Seller, Rating, Reviews)
        # ----------------------------------------------------
        # Seller fallback
        if seller == "N/A" or seller.lower() in self.INVALID_SELLERS:
            # HTML tags (class with seller-name or pdp-seller-info-name)
            seller_html_matches = re.findall(
                r'class="[^"]*(?:seller-name|pdp-seller-info-name)[^"]*"[^>]*>([^<]+)<',
                html_text,
                re.IGNORECASE
            )
            for sm in seller_html_matches:
                cleaned = html.unescape(sm.strip())
                if cleaned and cleaned.lower() not in self.INVALID_SELLERS:
                    seller = cleaned
                    break

        if seller == "N/A" or seller.lower() in self.INVALID_SELLERS:
            # Shop / seller links
            shop_link_matches = re.findall(
                r'<a[^>]*href="[^"]*(?:/shop/|/seller/)[^"]*"[^>]*>([^<]+)</a>',
                html_text,
                re.IGNORECASE
            )
            for slm in shop_link_matches:
                cleaned = html.unescape(slm.strip())
                if cleaned and cleaned.lower() not in self.INVALID_SELLERS:
                    seller = cleaned
                    break

        if seller == "N/A" or seller.lower() in self.INVALID_SELLERS:
            # Regex JSON strings
            s_match = re.search(r'"(?:sellerName|sellerTitle|storeName)"\s*:\s*"([^"]+)"', html_text)
            if s_match:
                cleaned = html.unescape(s_match.group(1).strip())
                if cleaned.lower() not in self.INVALID_SELLERS:
                    seller = cleaned

        # Rating fallback
        if overall_rating == 0.0:
            # score-average HTML tag
            r_html = re.search(
                r'class="[^"]*(?:score-average|pdp-review-summary__score)[^"]*"[^>]*>\s*([\d\.]+)\s*<',
                html_text,
                re.IGNORECASE
            )
            if r_html:
                try:
                    val = float(r_html.group(1))
                    if 0.0 < val <= 5.0:
                        overall_rating = round(val, 1)
                except Exception:
                    pass

        if overall_rating == 0.0:
            r_match = re.search(r'"(?:ratingValue|score|rate)"\s*:\s*"?([\d\.]+)"?', html_text)
            if not r_match:
                r_match = re.search(r'([\d\.]+)\s*/\s*5', html_text)
            if r_match:
                try:
                    r_val = float(r_match.group(1))
                    if 0.0 < r_val <= 5.0:
                        overall_rating = round(r_val, 1)
                except Exception:
                    pass

        # Total Reviews fallback
        if total_reviews == 0:
            count_html = re.search(
                r'class="[^"]*(?:pdp-review-summary__link|score-total|count)[^"]*"[^>]*>.*?(\d+)\s*(?:Ratings|Reviews|ratings|reviews)?',
                html_text,
                re.IGNORECASE | re.DOTALL
            )
            if count_html:
                try:
                    total_reviews = int(count_html.group(1))
                except Exception:
                    pass

        if total_reviews == 0:
            rev_match = re.search(r'"(?:reviewCount|ratingCount|totalReview|totalRatings)"\s*:\s*"?(\d+)"?', html_text)
            if not rev_match:
                rev_match = re.search(r'(\d+)\s*(?:Ratings|Reviews|ratings|reviews)', html_text)
            if rev_match:
                try:
                    total_reviews = int(rev_match.group(1))
                except Exception:
                    pass

        # Category fallback
        if category == "N/A":
            cat_match = re.search(r'"category"\s*:\s*"([^"]+)"', html_text)
            if cat_match and cat_match.group(1).strip():
                category = html.unescape(cat_match.group(1).strip())
            else:
                crumbs = re.findall(r'class="[^"]*(?:breadcrumb|pdp-breadcrumb)[^"]*"[^>]*>.*?<a[^>]*>([^<]+)</a>', html_text, re.DOTALL | re.IGNORECASE)
                if crumbs and len(crumbs) > 1:
                    last_crumb = html.unescape(crumbs[-1].strip())
                    if last_crumb.lower() != "home":
                        category = last_crumb

        # ----------------------------------------------------
        # 5. Completeness & Fallback Decision
        # ----------------------------------------------------
        clean_title = (title or "").strip().lower()
        clean_seller = (seller or "").strip().lower()

        # A. Check Title validity
        is_title_bad = (
            clean_title in self.INVALID_TITLES
            or "404" in clean_title
            or clean_title.startswith("error")
        )
        if is_title_bad:
            logger.warning(f"FastPreviewFetcher: Invalid title '{title}'. Falling back to Tier 2.")
            return None

        # B. Check Seller validity: Seller MUST be a real store, NOT placeholder or missing
        is_seller_invalid = (
            seller == "N/A"
            or clean_seller in self.INVALID_SELLERS
            or not seller.strip()
        )
        if is_seller_invalid:
            logger.warning(
                f"FastPreviewFetcher: Seller could not be determined ('{seller}'). "
                f"Falling back to Tier 2 (Selenium) to extract store details."
            )
            return None

        # C. Check Reviews / Ratings completeness:
        # If rating is 0.0 and totalReviews is 0, check if the HTML has review components indicating reviews exist
        if overall_rating == 0.0 and total_reviews == 0:
            has_review_elements = bool(
                re.search(r'pdp-review|score-average|ratings|module_product_review', html_text, re.IGNORECASE)
            )
            # If review elements exist in the page HTML but numbers couldn't be extracted,
            # trigger fallback to Tier 2 (Selenium) so client-rendered reviews are captured!
            if has_review_elements:
                logger.warning(
                    "FastPreviewFetcher: Review elements detected but 0 ratings parsed from static HTML. "
                    "Falling back to Tier 2 (Selenium) to render dynamic review data."
                )
                return None

        # If all essential checks pass, return complete preview dictionary
        return {
            "productUrl": product_url,
            "title": title,
            "imageUrl": image_url,
            "seller": seller,
            "overallRating": overall_rating,
            "totalReviews": total_reviews,
            "platform": platform,
            "category": category,
        }
