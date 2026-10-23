# Lumina Skin Clinic — White-Label Skin Care Platform & Booking Engine

A complete, production-ready, white-label web application for local skin care businesses (clinics, facial studios, spas, dermatology practices) built on Express and Node.js with native MongoDB persistence, server-rendered HTML, inline 80:15:5 styling, and a dedicated admin booking portal.

## User Review & Critical Decisions

> [!IMPORTANT]
> The clarifying questions were skipped; the following industry-tailored defaults will be implemented:
> - **Brand & Aesthetic**: **Lumina Skin Clinic** — Pastel sage (`#6B8E7D`), blush (`#F7EBE8`), warm cream (`#FAF8F5`), and soft sand (`#EFE8DE`) palette adhering strictly to the **80:15:5** UI ratio with Cormorant Garamond serif headings and Plus Jakarta Sans body.
> - **Database & Environment Resilience**: The backend strictly validates `MONGODB_URI`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD`. When environment variables are present, it connects via the official `mongodb` driver with connection pooling and a unique index (`date + time_slot`). To ensure immediate out-of-the-box evaluation and local dev preview without crashing, a graceful in-memory storage fallback and diagnostic helper will activate if MongoDB credentials are not yet configured.

---

## 1. Overview & Core Concept

- **What It Does**: Serves a high-converting, mobile-first website for skin clinics and facial spas. Clients can browse treatments, view verified-style Google reviews with animated rating distribution, read provider credentials, explore treatment galleries, and book appointments directly through a frictionless modal or section form. The appointment triggers a direct WhatsApp confirmation flow. Clinic managers log into `/admin` to monitor appointment KPIs, filter schedules, update booking statuses, and export CSV reports.
- **Target Audience / Persona**: Local skincare clients seeking clinical facials, chemical peels, and laser treatments; clinic owners needing a turnkey, fast-loading, zero-maintenance web presence.
- **Key Value**: Zero build step, single-process deployment on Vercel or Node.js 24, instant client re-branding via a central `CONFIG` block, and native double-booking prevention without heavy third-party SaaS subscriptions.

---

## 2. User Experience & Visual Design

### 80:15:5 UI System & Spatial Discipline
- **80% Flat Soft Color**: Canvas in warm cream (`#FAF8F5`), structural cards and content blocks in pastel sage (`#F0F4F1`) and soft blush (`#FCF6F5`), text in deep slate charcoal (`#2D3748`). No heavy shadows or harsh borders.
- **15% Glassmorphism (Overlays & Context Only)**:
  - Sticky navigation bar with `backdrop-filter: blur(12px)`, translucent fill (`rgba(250, 248, 245, 0.85)`), and 1px hairline border (`rgba(255, 255, 255, 0.6)`).
  - Floating 5-action quick-dock (WhatsApp, Call, Email, Directions, Book Now) rendered as a floating glass pill on mobile bottom and side dock on desktop.
  - Interactive booking modal with backdrop blur and spring-in motion.
  - Review cards overlaid across treatment imagery.
- **5% Claymorphism (Action Buttons & Primary CTAs Only)**:
  - Generous border-radius (`14px`–`18px`), subtle outer drop shadow paired with soft inner highlight (`inset 0 1px 1px rgba(255,255,255,0.7)`), and tactile squish compression on `:active` (`transform: scale(0.97)`).
- **Typography & Hierarchy**:
  - Headings: *Cormorant Garamond* (Google Fonts, serif, elegant luxury aesthetic).
  - Body: *Plus Jakarta Sans* (clean, legible neo-grotesque sans, 15px–16px, 1.6 line-height).
  - Tabular Numbers: `font-variant-numeric: tabular-nums` for price tags, ratings, and time slots.
  - Anti-slop adherence: unboxed metadata with `·` separators, zero pill-badge sandwiches, balanced headline wraps.

### Key Sections & Layout Flow
1. **Top Bar**: Clean 3-zone contract (Wordmark brand, 5 concise anchor links, 1 primary "Book Treatment" clay CTA).
2. **Hero Section**: Typographic headline (`clamp(2.5rem, 5vw, 4rem)`), value proposition, floating soft ambient shapes, glassmorphic clinic highlights card, and quick booking entry points.
3. **Trust & Impact Stats**: 4 key figures (e.g. 12,500+ Treatments, 4.9★ Average Rating, 12 Certified Specialists, 98% Satisfaction) with `requestAnimationFrame` ease-out cubic animated counters triggered on IntersectionObserver.
4. **Services & Treatments (8 items)**: Filterable treatment cards with duration, price formatted with `Intl.NumberFormat`, detailed skin benefit description, and instant "Book This Treatment" button that pre-selects the service in the booking modal.
5. **Why Choose Us**: 4 clinical pillars (Medical-Grade Formulations, Licensed Estheticians, Personalized Regimens, Sanitary Guarantee).
6. **Treatment Gallery (6 curated showcase items)**: High-resolution visual treatments with category tags, caption overlays, and image fallback resilience.
7. **Clinical Team (4 Specialists)**: Estheticians and dermatologists with credentials, specialties, and bios.
8. **Google Reviews & Rating Distribution**:
   - Google Business Profile styling: Large `4.9` rating, gold 5-star display, total count (348+ reviews).
   - 5-to-1 distribution progress bars that fill smoothly on scroll reveal.
   - 8 authentic patient testimonials with initial avatar, verification mark, relative timestamp, star rating, and detailed feedback.
   - "View all on Google" button linking directly to the business profile URL in `CONFIG`.
9. **Interactive Online Booking**:
   - Two entry points: Standalone section form and floating/modal dialog.
   - Step 1: Select Treatment & Provider.
   - Step 2: Date Picker with available slot generation derived from `CONFIG.openingHours`.
   - Step 3: Contact info (Name, Phone, Email, Special Skin Notes) + hidden anti-bot honeypot.
   - Submission: Disables duplicate submissions, verifies slot availability via MongoDB, returns booking reference, and presents a 1-click "Confirm on WhatsApp" button with prefilled booking summary.
10. **FAQ Accordion (6 items)**: Smooth CSS/JS accordion answering prep instructions, cancellation policies, skin sensitivity questions, and follow-up care.
11. **Hours, Keyless Interactive Map & Directions**:
    - Weekly schedule table formatted according to 12h/24h client setting.
    - Embedded keyless Google Map iframe (`maps?q=...&output=embed`).
    - One-click Google Maps Directions link (`https://www.google.com/maps/dir/?api=1&destination=...`).
12. **Footer**: Wordmark, quick links, clinic address, phone, email, copyright, and discreet `/admin` portal link.
13. **Floating Glass Dock**: Sticky floating bar on mobile (bottom) and side rail on desktop featuring all 5 direct channels: WhatsApp, Call, Email, Directions, and Book Now.

---

## 3. Key Product Decisions & Trade-Offs

- **Exact 4-File Footprint**:
  1. `index.js`: Express server, `CONFIG` client settings, route handlers, server-rendered HTML template with modular inline CSS/JS, booking API endpoints, SEO metadata, `/robots.txt`, `/sitemap.xml`.
  2. `admin.js`: Router factory `(getDb, config)` mounted at `/admin`, HMAC-cookie session management, timing-safe credential verification, booking dashboard metrics, filterable table, status toggling, and CSV export.
  3. `vercel.json`: Clean serverless routing definition routing all traffic to `index.js`.
  4. `package.json`: Configured for Node 24.x (`engines: { "node": "24.x" }`), script `"start": "node index.js"`, with only `express` and `mongodb` dependencies.
- **Client Customization Strategy (`CONFIG` Object)**:
  - All content, business metadata, hours, services, team, gallery, and reviews are consolidated in an explicit `// EDIT PER CLIENT` object at the top of `index.js`.
  - Zero database seeding required for content; changing client branding requires editing only the `CONFIG` block.
- **Database & Double-Booking Prevention**:
  - MongoDB stores only the `bookings` collection.
  - A compound unique index `{ date: 1, timeSlot: 1 }` prevents race-condition double bookings.
  - Cached `MongoClient` connection across serverless invocations.
- **Security & Rate Limiting**:
  - IP-based rate limiting on booking submissions and admin login attempts.
  - Invisible honeypot field (`website_url` / `hp_confirm`) to catch automated spam bots.
  - HMAC SHA-256 signed session cookie for the admin panel with `httpOnly`, `sameSite: 'lax'`, and constant-time `crypto.timingSafeEqual` comparison.
  - Strict HTML escaping on all dynamic data outputs.

---

## 4. Technical Architecture & Data Strategy

```
 ┌───────────────────────────────────────────────────────────────────┐
 │                       Vercel / Node 24 Server                    │
 │                                                                   │
 │  ┌─────────────────────────────────────────────────────────────┐  │
 │  │ index.js                                                    │  │
 │  │  ├─ CONFIG Object (Business details, 8 Services, 8 Reviews) │  │
 │  │  ├─ Server-Rendered HTML Engine (Inline 80:15:5 CSS & JS)  │  │
 │  │  ├─ Public Routes: GET /, /robots.txt, /sitemap.xml         │  │
 │  │  ├─ Booking API: POST /api/bookings, GET /api/available-slots│  │
 │  │  └─ MongoDB Connection Pool (Cached Client)                 │  │
 │  └───────────────────────────────┬─────────────────────────────┘  │
 │                                  │ mounts                         │
 │                                  ▼                                │
 │  ┌─────────────────────────────────────────────────────────────┐  │
 │  │ admin.js (Mounted at /admin)                                │  │
 │  │  ├─ Auth Guard: HMAC signed cookie & crypto.timingSafeEqual │  │
 │  │  ├─ GET /admin/login & POST /admin/login                    │  │
 │  │  ├─ GET /admin (Dashboard KPIs, status filter, search)      │  │
 │  │  ├─ POST /admin/bookings/:id/status (confirm, cancel, etc.) │  │
 │  │  ├─ DELETE /admin/bookings/:id                              │  │
 │  └─ GET /admin/export.csv (RFC 4180 CSV generation)        │  │
 │  └───────────────────────────────┬─────────────────────────────┘  │
 └──────────────────────────────────┼────────────────────────────────┘
                                    │ queries
                                    ▼
                     ┌─────────────────────────────┐
                     │ MongoDB Atlas / Instance    │
                     │  - db: skincare_clinic      │
                     │  - col: bookings            │
                     │  - unique index: date+slot  │
                     └─────────────────────────────┘
```

### Data Schema (`bookings` Collection)
```json
{
  "_id": "ObjectId(...)",
  "bookingRef": "LUM-84920",
  "serviceId": "hydro-glow-facial",
  "serviceTitle": "Signature Hydro-Glow Facial",
  "price": 145,
  "date": "2026-11-15",
  "timeSlot": "10:30 AM",
  "clientName": "Sarah Jenkins",
  "clientPhone": "+14155552671",
  "clientEmail": "sarah.j@example.com",
  "notes": "Sensitive skin, rosacea prone",
  "status": "pending",
  "ipAddress": "192.168.1.1",
  "createdAt": "2026-10-23T11:00:00.000Z",
  "updatedAt": "2026-10-23T11:00:00.000Z"
}
```

### Interactive Execution Flow
1. **Public Site Load**: `index.js` outputs complete HTML with inline styled CSS variables, Google Fonts links, structured schema (`application/ld+json` for `MedicalBusiness`/`BeautySalon`), and client script.
2. **Animation Engine**: An `IntersectionObserver` inspects numbers, trigger flags, and progress bars. Numbers count from 0 to target over 1.8s using `easeOutCubic`. Rating distribution bars animate width from `0%` to target percentage.
3. **Slot Availability Check**: Dynamic client-side fetch to `/api/available-slots?date=YYYY-MM-DD` checks existing active bookings in MongoDB against the scheduled operating hours in `CONFIG`. Occupied slots display disabled visual states.
4. **Booking Submission**: Form submits to `POST /api/bookings`. Validates phone/email, checks honeypot, executes atomic insert with duplicate-key catch (`code 11000`). If successful, the modal flips to a success screen with booking reference and a pre-configured WhatsApp confirmation deep-link.
5. **Admin Operations**: Clinic administrator logs in at `/admin/login`. On authentication, server issues an HMAC signed cookie (`admin_session`). The dashboard displays count metrics (Total, Today, Pending, Confirmed, Completed, Cancelled), allows single-click status updates, keyword search, date filtering, and live CSV export.

---

## 5. Execution Plan
- **Step 1**: Update `package.json` with Node 24 engine constraint, dependencies (`express`, `mongodb`), dev scripts, and create `vercel.json`.
- **Step 2**: Author `admin.js` with HMAC cookie session security, dashboard UI, API actions, and CSV generator.
- **Step 3**: Author `index.js` containing the complete `CONFIG` schema (8 services, 8 reviews, team, gallery, FAQs, hours), SSR template, responsive 80:15:5 styles, dynamic booking and slot verification engine, and SEO markup.
- **Step 4**: Update `metadata.json` and verify full app compilation and server startup.
