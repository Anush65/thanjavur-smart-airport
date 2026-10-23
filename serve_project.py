#!/usr/bin/env python3

import argparse
import http.server
import socketserver
from functools import partial
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Serve the Thanjavur Smart Airport demo locally.")
    parser.add_argument("--port", type=int, default=8000, help="Port to serve on (default: 8000)")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface to bind to")
    args = parser.parse_args()

    web_dir = str(root)
    handler = partial(http.server.SimpleHTTPRequestHandler, directory=web_dir)

    with socketserver.TCPServer((args.host, args.port), handler) as httpd:
        url = f"http://{args.host}:{args.port}/webapp/index.html"
        print(f"Serving {root}")
        print(f"Open: {url}")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
