# 🌐 Domain, Subdomain & Email Setup Guide for Kumasi Heritage Virtual Leo-Lions Club

This guide provides step-by-step instructions to configure your domain `kumasiheritageleolions.org` for clean subdomain routing and high-deliverability email subdomains (`notify.` & `mail.`).

---

## Part 1: Subdomain DNS Configuration

Log in to your domain registrar (Namecheap, GoDaddy, Cloudflare, Google Domains, etc.) and open the **DNS Management / Advanced DNS** panel. Add the following records:

### 1. Main Website (`kumasiheritageleolions.org`)
* **Type**: `A` or `CNAME`
* **Host / Name**: `@` (and `www`)
* **Value**: Your hosting provider IP (e.g. GitHub Pages `185.199.108.153` or Netlify CNAME).

### 2. Member Portal (`portal.kumasiheritageleolions.org`)
* **Type**: `CNAME`
* **Host / Name**: `portal` (or `members`)
* **Value**: `kumasiheritageleolions.org` (or your hosting app URL).

### 3. President Admin Dashboard (`admin.kumasiheritageleolions.org`)
* **Type**: `CNAME`
* **Host / Name**: `admin`
* **Value**: `kumasiheritageleolions.org` (or your hosting app URL).

---

## Part 2: Email Subdomain Configuration (`notify.` & `mail.`)

To send transactional dues receipts and monthly newsletters without landing in spam, set up 2 email subdomains on a free transactional provider like **Brevo (formerly Sendinblue)** or **Resend**.

### 1. Transactional Email Subdomain (`notify.kumasiheritageleolions.org`)
Used for automated dues receipts, password resets, and login links.
* **Sender Address**: `no-reply@notify.kumasiheritageleolions.org`

#### DNS Records to Add for `notify.` Subdomain:
| Record Type | Host / Name | Value / Destination | Purpose |
| :--- | :--- | :--- | :--- |
| **TXT (SPF)** | `notify` | `v=spf1 include:spf.brevo.com ~all` | Authorizes email sending |
| **TXT (DKIM)** | `mail._domainkey.notify` | *(Provided by your email provider)* | Digital signature verification |
| **TXT (DMARC)** | `_dmarc.notify` | `v=DMARC1; p=none; sp=none;` | Spam protection policy |

### 2. Newsletter & Community Subdomain (`mail.kumasiheritageleolions.org`)
Used for monthly newsletters, service event announcements, and public relations.
* **Sender Address**: `info@mail.kumasiheritageleolions.org`

#### DNS Records to Add for `mail.` Subdomain:
| Record Type | Host / Name | Value / Destination | Purpose |
| :--- | :--- | :--- | :--- |
| **TXT (SPF)** | `mail` | `v=spf1 include:spf.brevo.com ~all` | Authorizes newsletter sending |
| **TXT (DKIM)** | `mail._domainkey.mail` | *(Provided by your email provider)* | Digital signature verification |
| **TXT (DMARC)** | `_dmarc.mail` | `v=DMARC1; p=none; sp=none;` | Spam protection policy |

---

## Part 3: Deploying the Site to Production (Free SSL HTTPS)

### Option A: Netlify (Recommended)
1. Drag and drop the website folder to Netlify, or connect your GitHub repo `K9CHRIS/kumasiheritage-leo`.
2. Netlify will automatically detect `_redirects` and issue a free SSL Certificate.

### Option B: GitHub Pages
1. Go to repository Settings → Pages.
2. Select `main` branch as the source.
3. Enter `kumasiheritageleolions.org` under Custom Domain.
