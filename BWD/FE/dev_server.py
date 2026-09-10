import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class FastDevHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        clean_path = self.path.split("?")[0].lower()

        # HTML pages: always revalidate so fresh markup is loaded
        if clean_path.endswith(".html") or clean_path == "/" or clean_path.endswith("/"):
            self.send_header("Cache-Control", "no-cache, must-revalidate")
            self.send_header("Pragma", "no-cache")
        # Heavy static assets (3D models, images, videos, fonts): cache aggressively in browser
        elif any(clean_path.endswith(ext) for ext in (".glb", ".gltf", ".bin", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".woff2", ".woff", ".ttf", ".svg")):
            self.send_header("Cache-Control", "public, max-age=86400, immutable")
        # Versioned CSS and JS (busted via ?v=...): cache for fast instant switches
        elif any(clean_path.endswith(ext) for ext in (".css", ".js")):
            self.send_header("Cache-Control", "public, max-age=3600")
        else:
            self.send_header("Cache-Control", "no-cache")

        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
    directory = sys.argv[2] if len(sys.argv) > 2 else "."
    handler = partial(FastDevHTTPRequestHandler, directory=directory)
    server = ThreadingHTTPServer(("0.0.0.0", port), handler)
    print(f"Serving HTTP on 0.0.0.0 port {port} (threaded)...")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()

