import json
import urllib.request

data = json.load(urllib.request.urlopen('http://127.0.0.1:8000/openapi.json'))
print([p for p in data.get('paths', {}).keys() if 'splits' in p])
