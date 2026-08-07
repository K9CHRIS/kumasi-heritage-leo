import os
import sys
import re
import json
from html.parser import HTMLParser

class SEOParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = None
        self.in_title = False
        self.meta_tags = []
        self.link_tags = []
        self.h1_count = 0
        self.headings = []
        self.images = []
        self.html_lang = None
        self.json_ld_scripts = []
        self.in_json_ld = False
        self.current_json_ld = ""

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == 'html':
            self.html_lang = attrs_dict.get('lang')
        elif tag == 'title':
            self.in_title = True
            self.title = ""
        elif tag == 'meta':
            self.meta_tags.append(attrs_dict)
        elif tag == 'link':
            self.link_tags.append(attrs_dict)
        elif tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            if tag == 'h1':
                self.h1_count += 1
            self.headings.append(tag)
        elif tag == 'img':
            self.images.append({
                'src': attrs_dict.get('src', ''),
                'alt': attrs_dict.get('alt', None)
            })
        elif tag == 'script' and attrs_dict.get('type') == 'application/ld+json':
            self.in_json_ld = True
            self.current_json_ld = ""

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        elif tag == 'script' and self.in_json_ld:
            self.in_json_ld = False
            self.json_ld_scripts.append(self.current_json_ld)

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        elif self.in_json_ld:
            self.current_json_ld += data

def audit_file(filepath):
    print(f"\n==========================================")
    print(f"AUDITING SEO FOR: {os.path.basename(filepath)}")
    print(f"==========================================")

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    parser = SEOParser()
    parser.feed(content)

    passed = True

    # 1. HTML lang attribute
    if parser.html_lang:
        print(f"[PASS] HTML lang attribute present: '{parser.html_lang}'")
    else:
        print(f"[FAIL] Missing lang attribute in <html> tag")
        passed = False

    # 2. Title Tag
    if parser.title and parser.title.strip():
        title_text = parser.title.strip()
        print(f"[PASS] Meta Title: '{title_text}' ({len(title_text)} chars)")
    else:
        print(f"[FAIL] Title tag is missing or empty")
        passed = False

    # 3. Meta Description
    desc_meta = next((m for m in parser.meta_tags if m.get('name', '').lower() == 'description'), None)
    if desc_meta and desc_meta.get('content', '').strip():
        desc_text = desc_meta.get('content', '').strip()
        print(f"[PASS] Meta Description: '{desc_text[:60]}...' ({len(desc_text)} chars)")
    else:
        print(f"[FAIL] Meta description missing or empty")
        passed = False

    # 4. Meta Robots
    robots_meta = next((m for m in parser.meta_tags if m.get('name', '').lower() == 'robots'), None)
    if robots_meta:
        print(f"[PASS] Meta Robots: '{robots_meta.get('content')}'")
    else:
        print(f"[FAIL] Meta robots tag missing")
        passed = False

    # 5. Canonical Link
    canonical = next((l for l in parser.link_tags if l.get('rel', '').lower() == 'canonical'), None)
    if canonical and canonical.get('href'):
        print(f"[PASS] Canonical URL: '{canonical.get('href')}'")
    else:
        print(f"[FAIL] Canonical link missing")
        passed = False

    # 6. Open Graph Tags
    og_title = next((m for m in parser.meta_tags if m.get('property', '').lower() == 'og:title'), None)
    og_desc = next((m for m in parser.meta_tags if m.get('property', '').lower() == 'og:description'), None)
    og_image = next((m for m in parser.meta_tags if m.get('property', '').lower() == 'og:image'), None)

    if og_title and og_desc and og_image:
        print(f"[PASS] Open Graph tags (og:title, og:description, og:image) complete")
    else:
        print(f"[FAIL] Incomplete Open Graph tags")
        passed = False

    # 7. JSON-LD Structured Data
    if parser.json_ld_scripts:
        valid_json_count = 0
        for raw_json in parser.json_ld_scripts:
            try:
                data = json.loads(raw_json.strip())
                valid_json_count += 1
            except Exception as e:
                print(f"[FAIL] Invalid JSON-LD format: {e}")
                passed = False
        if valid_json_count > 0:
            print(f"[PASS] {valid_json_count} valid JSON-LD Schema.org script(s) found")
    else:
        print(f"[WARN] No JSON-LD Schema.org structured data script found")

    # 8. H1 Heading Count
    if parser.h1_count == 1:
        print(f"[PASS] Heading Structure: Exactly 1 <h1> heading present")
    else:
        print(f"[FAIL] Found {parser.h1_count} <h1> headings (must be exactly 1)")
        passed = False

    # 9. Image Alt Attributes
    images_without_alt = [img for img in parser.images if img['alt'] is None or img['alt'].strip() == '']
    if not images_without_alt:
        print(f"[PASS] All {len(parser.images)} images have descriptive alt attributes!")
    else:
        print(f"[FAIL] {len(images_without_alt)} out of {len(parser.images)} images missing alt text:")
        for img in images_without_alt[:5]:
            print(f"   - {img['src']}")
        passed = False

    return passed

def audit_root_files(root_dir):
    print(f"\n==========================================")
    print(f"AUDITING TECHNICAL SEO ROOT FILES")
    print(f"==========================================")
    robots_path = os.path.join(root_dir, 'robots.txt')
    sitemap_path = os.path.join(root_dir, 'sitemap.xml')

    passed = True
    if os.path.exists(robots_path):
        print(f"[PASS] robots.txt exists")
    else:
        print(f"[FAIL] robots.txt is missing")
        passed = False

    if os.path.exists(sitemap_path):
        print(f"[PASS] sitemap.xml exists")
    else:
        print(f"[FAIL] sitemap.xml is missing")
        passed = False

    return passed

if __name__ == '__main__':
    workspace_dir = r"c:\Users\Hermes\.gemini\antigravity\scratch\leo-lion-club-website"
    files_to_check = [
        os.path.join(workspace_dir, 'index.html'),
        os.path.join(workspace_dir, 'portal.html'),
        os.path.join(workspace_dir, 'admin.html')
    ]

    all_passed = True
    all_passed &= audit_root_files(workspace_dir)

    for file_path in files_to_check:
        if os.path.exists(file_path):
            file_passed = audit_file(file_path)
            all_passed &= file_passed

    print("\n------------------------------------------")
    if all_passed:
        print("ALL SEO AUDIT CHECKS PASSED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("SEO AUDIT COMPLETED WITH FAILURES. FIXING REQUIRED.")
        sys.exit(1)
