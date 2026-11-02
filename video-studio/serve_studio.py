#!/usr/bin/env python3
"""Run the free static studio. Python standard library only."""
import argparse,functools,http.server,pathlib,platform,subprocess,webbrowser
p=argparse.ArgumentParser();p.add_argument('--share',action='store_true',help='Allow devices on the same Wi-Fi to open the editor');p.add_argument('--port',type=int,default=8765);args=p.parse_args()
root=pathlib.Path(__file__).resolve().parent
class Handler(http.server.SimpleHTTPRequestHandler):
 def end_headers(self):
  self.send_header('X-Content-Type-Options','nosniff');super().end_headers()
 def do_GET(self):
  if self.path.split('?')[0].startswith(('/api/','/.')) or self.path.split('?')[0].endswith(('.py','.command')):
   self.send_error(404);return
  super().do_GET()
server=http.server.ThreadingHTTPServer(('0.0.0.0' if args.share else '127.0.0.1',args.port),functools.partial(Handler,directory=str(root)))
url='http://127.0.0.1:'+str(server.server_port)+'/'
print('\nMama\u2019s Love free video studio: '+url,flush=True)
if args.share:
 address=None
 if platform.system()=='Darwin':
  for interface in ['en0','en1']:
   r=subprocess.run(['/usr/sbin/ipconfig','getifaddr',interface],capture_output=True,text=True)
   if r.returncode==0 and r.stdout.strip():address=r.stdout.strip();break
 if address:print('Phone on the same Wi-Fi: http://'+address+':'+str(server.server_port)+'/',flush=True)
 else:print('On your phone, open http://YOUR-MAC-WIFI-IP:'+str(server.server_port)+'/',flush=True)
print('Keep this window open while using the studio. Press Control+C to stop.\n',flush=True)
webbrowser.open(url)
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
