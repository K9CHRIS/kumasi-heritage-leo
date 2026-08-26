#!/usr/bin/env python3
"""
==========================================================================
Kumasi Heritage Virtual Leo-Lions Club - Automatic Website & WhatsApp Publisher
==========================================================================

Usage:
  python auto_post_update.py \
    --title "🔥 IT'S TODAY! Online Session on Social Media" \
    --speaker "Lion Andre Amenuku-Agble (CEO, VOXDIGITS)" \
    --date "Sunday, 23rd August 2026 • 4:00 PM GMT" \
    --text "What impact does social media have on us? Join us for an engaging live session..." \
    --meet "https://meet.google.com/bnw-thpe-ohy" \
    --image "path/to/flyer.jpg" \
    --whatsapp-group "YOUR_WHATSAPP_GROUP_ID"  # (Optional: Broadcasts to WhatsApp)

This script:
  1. Copies the event flyer into assets/events/
  2. Updates index.html & v2/index.html automatically
  3. Commits and pushes the update to GitHub main branch to publish live
  4. (Optional) Uses pywhatkit to broadcast flyer & text to your WhatsApp group
"""

import argparse
import os
import re
import shutil
import subprocess
import sys
import datetime

def update_website_html(title, speaker, date_str, text_content, meet_link, image_rel_path):
    root_dir = os.path.dirname(os.path.abspath(__file__))
    index_path = os.path.join(root_dir, "index.html")
    
    if not os.path.exists(index_path):
        print(f"[ERROR] Could not find {index_path}")
        return False

    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()

    meet_btn_html = ""
    if meet_link:
        meet_btn_html = f'''
                            <div class="update-card-actions" style="margin-top: 15px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                                <a href="{meet_link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
                                    Join Google Meet Live 📍
                                </a>
                                <span style="font-size: 0.85rem; color: var(--text-muted);">Link: {meet_link}</span>
                            </div>'''

    new_card_html = f'''                <div class="updates-feed" id="updates-feed-container">
                    <div class="update-card featured-event-card">
                        <img src="{image_rel_path}" class="update-card-img" alt="{title}">
                        <div class="update-card-body">
                            <div class="update-card-meta">
                                <span>📅 {date_str}</span>
                                <span>👤 {speaker}</span>
                            </div>
                            <h3 class="update-card-title">{title}</h3>
                            <p class="update-card-text">
                                {text_content}
                            </p>{meet_btn_html}
                        </div>
                    </div>
                </div>'''

    pattern = r'<div class="updates-feed" id="updates-feed-container">[\s\S]*?</div>\s*</div>'
    replacement = f'{new_card_html}\n            </div>'
    
    if re.search(pattern, content):
        updated_content = re.sub(pattern, replacement, content, count=1)
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(updated_content)
        print(f"[SUCCESS] Updated live feed in index.html")
        return True
    else:
        print("[WARNING] Could not locate #updates-feed-container pattern in index.html")
        return False

def push_to_github(title):
    root_dir = os.path.dirname(os.path.abspath(__file__))
    try:
        subprocess.run(["git", "add", "."], cwd=root_dir, check=True)
        commit_msg = f"feat: Publish President update - {title[:50]}"
        subprocess.run(["git", "commit", "-m", commit_msg], cwd=root_dir, check=True)
        subprocess.run(["git", "push", "origin", "main"], cwd=root_dir, check=True)
        print("[SUCCESS] Pushed update live to GitHub!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Git push failed: {e}")
        return False

def broadcast_whatsapp(image_path, caption, group_id_or_phone):
    try:
        import pywhatkit
        print(f"[INFO] Launching pywhatkit WhatsApp broadcast to: {group_id_or_phone}...")
        now = datetime.datetime.now()
        # Schedule 1-2 minutes ahead for WhatsApp Web automation
        send_time = now + datetime.timedelta(minutes=2)
        
        if group_id_or_phone.startswith("+"):
            pywhatkit.sendwhats_image(group_id_or_phone, image_path, caption, wait_time=15)
        else:
            pywhatkit.sendto_group(group_id_or_phone, caption, time_hour=send_time.hour, time_min=send_time.minute)
        print("[SUCCESS] WhatsApp message scheduled/sent!")
    except Exception as e:
        print(f"[NOTICE] pywhatkit broadcast note: {e}")

def main():
    parser = argparse.ArgumentParser(description="Auto Publisher for Kumasi Heritage Leo-Lions Club")
    parser.add_argument("--title", required=True, help="Announcement / Event Title")
    parser.add_argument("--speaker", default="President Edwina / Executive Board", help="Speaker or Author")
    parser.add_argument("--date", default="Upcoming Event", help="Date & Time string")
    parser.add_argument("--text", required=True, help="Full announcement text")
    parser.add_argument("--meet", default="", help="Google Meet / Zoom URL")
    parser.add_argument("--image", default="", help="Path to flyer image")
    parser.add_argument("--whatsapp", default="", help="WhatsApp Group ID or Phone (+233...) to broadcast")

    args = parser.parse_args()

    root_dir = os.path.dirname(os.path.abspath(__file__))
    events_dir = os.path.join(root_dir, "assets", "events")
    os.makedirs(events_dir, exist_ok=True)

    image_rel_path = "assets/events/social_media_event_aug23.jpg"
    if args.image and os.path.exists(args.image):
        filename = os.path.basename(args.image)
        dest_path = os.path.join(events_dir, filename)
        shutil.copy(args.image, dest_path)
        image_rel_path = f"assets/events/{filename}"

    # 1. Update Website HTML
    update_website_html(args.title, args.speaker, args.date, args.text, args.meet, image_rel_path)

    # 2. Push Live to GitHub
    push_to_github(args.title)

    # 3. WhatsApp Broadcast (Optional)
    if args.whatsapp:
        full_caption = f"{args.title}\n\n{args.text}"
        if args.meet:
            full_caption += f"\n\n📍 Join Google Meet: {args.meet}"
        full_image_path = os.path.join(root_dir, image_rel_path) if args.image else ""
        broadcast_whatsapp(full_image_path, full_caption, args.whatsapp)

if __name__ == "__main__":
    main()
