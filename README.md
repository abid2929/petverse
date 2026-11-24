# PetVerse – Online Pet Shop (Bangladesh)

**Caring for Every Paw, Every Need!** · Bashundhara R/A Branch · Call / WhatsApp: 01880972500

A fast, phone-first pet shop website for PetVerse, with an admin panel.

## Live demo (GitHub Pages)
- Shop: https://abid2929.github.io/petverse/
- Admin demo: https://abid2929.github.io/petverse/admin/ (opens without a password on the demo; changes are saved only in your own browser)

## What's inside
- Home page with auto-sliding banners, Shop by Animal, services with booking, home service, offers, deal of the day, brands, about and contact. All text in English.
- **Cat Food** by type: Dry Food, Wet Pouch, Canned, Creamy Treats, Dry Treats. Plus Cat Litter, Toys, Accessories, Dog, Bird and Small Pets.
- Product quick view (gallery, sizes, colours, description), cart, wishlist.
- **Checkout** that saves the order on the server (delivery charge inside / outside Dhaka, Cash on Delivery, bKash, Nagad with TrxID), order number and **Track Order**. WhatsApp ordering is still there.
- Facebook Pixel + Conversions API (deduplicated Purchase), Google Analytics, SEO settings.
- **Admin panel** (`/admin`): dashboard (visitors, live activity, sales, orders, stock, 7-day chart, status donut), orders with invoice print and CSV export, Steadfast courier hub, customers, reports, products (sizes, colours, multi-image gallery, AI copywriter, flash sale / new / best seller / featured), categories, collections, inventory, reviews, hero banners, homepage CMS, admins and roles (super admin, manager, staff), and site settings (store, delivery, payment, courier, SMS, Pixel/CAPI, Google SEO, password).

## Install on cPanel
1. Upload the files to `public_html` (or upload the zip and Extract). Keep the hidden `.htaccess` files.
2. Open `yourdomain.com/admin` and create the main admin account (username + password, 8+ characters).
3. Fill in Site Settings, then edit products and press **Save**.

Needs PHP 8 with cURL (standard on cPanel). No database: shop data is in `data/*.json`; orders, accounts and API keys are in `data/private/` (blocked from the web).

## Notes
- Food, litter and treat photos come from online pet shops as reference images. Replace them with your own shop photos from the admin when possible.
- Prices are market reference prices; set your own prices in the admin.

Designed & developed by Abid Islam · Boostnix Media
