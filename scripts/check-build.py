"""Check generated routes, local assets, feeds, and the web manifest."""
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

OUTPUT = Path('dist').resolve()


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.has_title = False

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == 'title':
            self.has_title = True
        attribute = 'href' if tag in ('a', 'link') else 'src' if tag in ('img', 'script') else None
        if attribute and values.get(attribute):
            self.links.append(values[attribute])


for name in ('index.html', '404/index.html', 'admin/index.html', 'admin/config.yml',
             'feed.xml', 'sitemap.xml', 'site.webmanifest', 'robots.txt', 'sw.js'):
    assert (OUTPUT / name).is_file(), f'Missing output: {name}'

pages = list(OUTPUT.rglob('*.html'))
assert len(pages) >= 5, 'Expected home, posts, admin, and error pages'
for path in pages:
    page = Page()
    page.feed(path.read_text())
    assert page.has_title, f'Missing title: {path}'
    for link in page.links:
        url = urlsplit(link)
        if url.scheme or url.netloc or not url.path:
            continue
        target = ((OUTPUT / unquote(url.path).lstrip('/')) if url.path.startswith('/')
                  else path.parent / unquote(url.path)).resolve()
        assert target.is_relative_to(OUTPUT), f'Link outside output: {link}'
        assert target.is_file() or (target / 'index.html').is_file(), f'Broken local link: {path}: {link}'

for name in ('feed.xml', 'sitemap.xml'):
    ET.parse(OUTPUT / name)
manifest = json.loads((OUTPUT / 'site.webmanifest').read_text())
assert manifest['name'] and manifest['icons'], 'Incomplete web manifest'
print(f'Checked {len(pages)} HTML pages, local links/assets, XML feeds, and web manifest.')
