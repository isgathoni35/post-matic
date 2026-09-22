import urllib.request
import urllib.parse
import json

candidates = [
    'File:Kevin MacLeod - The Endless.ogg',
    'File:Kevin MacLeod - Volatile Reaction.ogg',
    'File:Kevin MacLeod - Five Armies.ogg',
    'File:Kevin MacLeod - Hero Down.ogg',
    'File:Kevin MacLeod - Carefree.ogg',
    'File:Kevin MacLeod - Windswept.ogg',
    'File:Canon in D (Pachelbel).ogg',
    'File:Gymnopedie No. 2 (ISRC USUAN1100786).mp3',
    'File:Beethoven Moonlight Sonata mvt 1.ogg',
    'File:Ride of the Valkyries.ogg',
    'File:Dvorak Symphony 9 Movement 4.ogg'
]

for title in candidates:
    url = f'https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url&format=json'
    req = urllib.request.Request(url, headers={'User-Agent': 'PostMatic/1.0 (contact@postmatic.app)'})
    try:
        data = json.loads(urllib.request.urlopen(req, timeout=10).read().decode('utf-8'))
        pages = data['query']['pages']
        for pid, pdata in pages.items():
            if int(pid) > 0 and 'imageinfo' in pdata:
                print(f"FOUND: {title} -> {pdata['imageinfo'][0]['url']}")
            else:
                print(f"NOT FOUND: {title}")
    except Exception as e:
        print(f"ERROR: {title} -> {e}")
