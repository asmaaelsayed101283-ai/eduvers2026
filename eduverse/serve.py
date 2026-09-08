#!/usr/bin/env python3
"""
EduVerse — local dev server.

Serves this folder over http://localhost so localStorage, the service
worker, and every page's relative links behave consistently and
reliably. Opening these HTML files directly via file:// is NOT
recommended: some browsers (Safari in particular) partition or
restrict localStorage differently for file:// pages, and service
workers cannot register under file:// at all — either can make a
teacher-published lesson fail to reach the student view even though
the underlying code and data are correct.

Usage:
    python3 serve.py [port]

Then open:
    http://localhost:8000/index.html   (or whatever port you chose)

No dependencies beyond Python's own standard library.
"""

import http.server
import socketserver
import sys
import webbrowser
import os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

os.chdir(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Never cache during local testing — makes it obvious that any
        # code change takes effect immediately on refresh.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/index.html"
        print(f"EduVerse is running at {url}")
        print("Press Ctrl+C to stop.")
        try:
            webbrowser.open(url)
        except Exception:
            pass  # no GUI available — that's fine, the URL above still works
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
