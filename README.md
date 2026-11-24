# PetVerse – Online Pet Shop (Bangladesh)

**Caring for Every Paw, Every Need!** · Bashundhara R/A Branch · Call / WhatsApp: 01880972500

A fast, phone-first pet shop website for PetVerse, with an admin panel.

## Live demo (GitHub Pages)
- Shop: https://abid2929.github.io/petverse/
- Admin demo: https://abid2929.github.io/petverse/admin/ (opens without a password on the demo; changes are saved only in your own browser)

## What's inside
- Home page with auto-sliding banners, Shop by Animal, services with booking, home service, offers, deal of the day, brands, about and contact.
- **Cat Food** by type: Dry Food, Wet Pouch, Canned, Creamy Treats, Dry Treats. Plus Cat Litter, Toys, Accessories, Dog, Bird and Small Pets.
- Cart and wishlist; orders and bookings are sent through WhatsApp.
- Separate app-style phone layout with a bottom tab bar.
- **Admin panel** (`/admin`): password login, add / edit / delete products, photo upload, price and old price, NEW tag, hide product, reorder, and a one-click button that copies product photos to your own server.

## Install on cPanel
1. Upload the files to `public_html` (or upload the zip and Extract).
2. Open `yourdomain.com/admin` and set the admin password on the first visit.
3. Edit products in the admin and press **Save**.

Needs PHP 7.4+ with cURL (standard on cPanel). No database: products are kept in `data/products.json`.

## Notes
- Food, litter and treat photos come from online pet shops as reference images. Replace them with your own shop photos from the admin when possible.
- Prices are market reference prices; set your own prices in the admin.

Designed & developed by Abid Islam · Boostnix Media
