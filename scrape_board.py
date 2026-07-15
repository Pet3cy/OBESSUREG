import urllib.request
import json
from bs4 import BeautifulSoup
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch_members(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req, context=ctx).read()
    soup = BeautifulSoup(html, 'html.parser')
    
    # Try finding team members... usually inside cards, like .wd-info-box or .woodmart-info-box
    # Let's just grab all info boxes
    members = []
    for box in soup.find_all(class_=['wd-info-box', 'woodmart-info-box', 'wpb_wrapper', 'title']):
        # If the box contains a title or subtitle
        title_tag = box.find(class_='info-box-title') or box.find(['h3', 'h4', 'h5', 'strong'])
        subtitle_tag = box.find(class_='info-box-subtitle') or box.find(['p', 'span'])
        if title_tag:
            name = title_tag.get_text(strip=True)
            if not name or len(name) > 30: continue
            
            # search nearby for a role
            role = ""
            if subtitle_tag:
                role = subtitle_tag.get_text(strip=True)
            
            # just print raw found text to debug
            members.append(name + " - " + role)
            
    print(f"URL: {url}")
    print(members[:20])

fetch_members('https://obessu.org/structure/board/')
fetch_members('https://obessu.org/structure/secretariat/')
