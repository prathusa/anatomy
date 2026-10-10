# Local dev server with caching disabled: python3 test/serve.py [port]
import http.server, sys, os

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
http.server.ThreadingHTTPServer(('127.0.0.1', port), NoCache).serve_forever()
