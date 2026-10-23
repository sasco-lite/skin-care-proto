/**
 * Lumina Skin Clinic — White-Label Website & Booking Engine
 * Runtime: Node.js 24.x | Express + official mongodb driver
 * Output files: index.js, admin.js, vercel.json, package.json
 */

const express = require('express');
const { MongoClient } = require('mongodb');
const createAdminRouter = require('./admin');

// ============================================================================
// CONFIG OBJECT — EDIT PER CLIENT
// ============================================================================
const CONFIG = {
  // Business Settings
  name: 'Lumina Skin Clinic',
  tagline: 'Clinical Dermatology & Bespoke Facial Therapies',
  subheading: 'Science-led medical aesthetics, restorative clinical facials, and evidence-based skin rejuvenation tailored to your skin biology.',
  address: '428 Crescent Boulevard, Suite 300, Metropolis',
  phone: '+1 555 782 4601',
  whatsAppNumber: '+15557824601',
  email: 'concierge@luminaskinclinic.com',
  timezone: 'America/New_York',
  currency: 'USD',
  timeFormat: '12h', // '12h' or '24h'
  accentColor: '#6B8E7D', // Pastel Sage
  mapQuery: '428 Crescent Boulevard, Metropolis',
  googleReviewsUrl: 'https://maps.google.com/?q=Lumina+Skin+Clinic',
  url: 'https://luminaskinclinic.com',
  social: {
    instagram: 'https://instagram.com/luminaskinclinic',
    facebook: 'https://facebook.com/luminaskinclinic',
  },

  // Operating Hours (for weekly table and dynamic slot calculation)
  openingHours: {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '20:00' },
    friday: { open: '09:00', close: '19:00' },
    saturday: { open: '10:00', close: '17:00' },
    sunday: { closed: true },
  },

  // Trust Statistics (Counters)
  trustStats: [
    { label: 'Clinical Treatments', value: 14200, suffix: '+', decimals: 0 },
    { label: 'Google Rating', value: 4.9, suffix: ' / 5.0', decimals: 1 },
    { label: 'Years Experience', value: 15, suffix: ' Years', decimals: 0 },
    { label: 'Client Retention', value: 98.7, suffix: '%', decimals: 1 },
  ],

  // 8 Clinical Services
  services: [
    {
      id: 'signature-hydro-glow',
      title: 'Signature Hydro-Glow Infusion',
      category: 'Facial Therapy',
      duration: '60 min',
      price: 165,
      description: 'Medical-grade vortex extraction paired with hyaluronic acid peptide infusion for immediate skin barrier renewal and lit-from-within luminosity.',
      benefits: ['Deep pore purification', 'Intense cellular hydration', 'Instant radiance with zero downtime'],
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'microneedling-collagen',
      title: 'Cellular Microneedling & Exosomes',
      category: 'Skin Remodeling',
      duration: '75 min',
      price: 280,
      description: 'Precision automated micro-channeling infused with bio-identical exosomes to trigger collagen neocollagenesis and smooth texture.',
      benefits: ['Softens fine lines & acne scarring', 'Refines enlarged pore architecture', 'Accelerates cellular turnover'],
      image: 'https://images.unsplash.com/photo-1512290900672-1f486d389a81?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'biorevitalizing-peel',
      title: 'PRX Bio-Revitalizing Peel',
      category: 'Clinical Peels',
      duration: '45 min',
      price: 210,
      description: 'Non-photosensitizing TCA formulated with hydrogen peroxide that stimulates deep dermis renewal without superficial peeling or flaking.',
      benefits: ['Firming & tissue tightening', 'Brightens stubborn melasma', 'Year-round suitability for all skin tones'],
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'led-phototherapy-facial',
      title: 'Medical LED & Lymphatic Sculpt',
      category: 'Regenerative',
      duration: '50 min',
      price: 135,
      description: 'Targeted multi-wavelength medical LED therapy combined with gentle lymphatic contouring to soothe inflammation and stimulate ATP production.',
      benefits: ['Calms rosacea & vascular flare-ups', 'Reduces facial puffiness', 'Accelerates post-treatment healing'],
      image: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'clarifying-dermal-infusion',
      title: 'Clarifying Blemish & Salicylic Therapy',
      category: 'Acne Care',
      duration: '60 min',
      price: 155,
      description: 'Targeted high-frequency and liposomal salicylic peel engineered specifically for congested, blemish-prone or cystic acne conditions.',
      benefits: ['Regulates sebum production', 'Eliminates bacteria beneath stratum corneum', 'Prevents post-inflammatory marks'],
      image: 'https://images.unsplash.com/photo-1512290903672-0402b8d035fb?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'dermaplaning-antioxidant',
      title: 'Dermaplaning + C-Shield Glow',
      category: 'Exfoliation',
      duration: '50 min',
      price: 140,
      description: 'Manual surgical-blade exfoliation removing vellus hair and stratum corneum, sealed with pure pharmaceutical l-ascorbic acid.',
      benefits: ['Immaculate glass-skin finish', 'Enhances skincare product penetration 4x', 'Silky canvas for makeup'],
      image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'radiofrequency-lift',
      title: 'Quad-Polar RF Tightening & Sculpt',
      category: 'Skin Remodeling',
      duration: '70 min',
      price: 245,
      description: 'Non-invasive thermal radiofrequency targeting the SMAS and deep dermal layers to stimulate structural collagen contracting and jawline contouring.',
      benefits: ['Visible jawline definition', 'Lifts laxity in cheeks & neck', 'Stimulates long-term elastin fibers'],
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'barrier-repair-deluxe',
      title: 'Bio-Ceramide Barrier Restoration',
      category: 'Facial Therapy',
      duration: '60 min',
      price: 150,
      description: 'Intensive restorative protocol designed for compromised, sensitized, or barrier-depleted skin using pure centella, ectoin, and phytosterols.',
      benefits: ['Relieves burning & stinging', 'Restores cutaneous lipid matrix', 'Shields against environmental aggressors'],
      image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80',
    },
  ],

  // Google Reviews Summary & 8 Testimonials
  reviewsData: {
    averageRating: 4.9,
    totalReviews: 348,
    distribution: [
      { stars: 5, percentage: 92, count: 320 },
      { stars: 4, percentage: 6, count: 21 },
      { stars: 3, percentage: 1, count: 4 },
      { stars: 2, percentage: 0.5, count: 2 },
      { stars: 1, percentage: 0.5, count: 1 },
    ],
    items: [
      {
        name: 'Elena Rostova',
        initial: 'E',
        rating: 5,
        timeAgo: '2 weeks ago',
        text: 'The Hydro-Glow Infusion transformed my dry winter skin in one session. The clinic is spotless, tranquil, and the estheticians are genuinely clinical experts. Worth every single cent.',
      },
      {
        name: 'Marcus Vance',
        initial: 'M',
        rating: 5,
        timeAgo: '3 weeks ago',
        text: 'As someone dealing with stubborn adult acne, the Clarifying Blemish Therapy has been a life saver. They explained the biology behind my routine without pushing unnecessary products.',
      },
      {
        name: 'Sophia Chen-Davies',
        initial: 'S',
        rating: 5,
        timeAgo: '1 month ago',
        text: 'I booked the PRX Bio-Revitalizing Peel before my wedding. Zero peeling, incredible bounce, and instant firmness. The booking system was seamless and confirming via WhatsApp made scheduling easy.',
      },
      {
        name: 'David O’Connor',
        initial: 'D',
        rating: 5,
        timeAgo: '1 month ago',
        text: 'High-end environment without any snobbery. The microneedling treatment was virtually painless with their numbing technique and my texture has improved drastically.',
      },
      {
        name: 'Amara Patel',
        initial: 'A',
        rating: 5,
        timeAgo: '2 months ago',
        text: 'Easily the cleanest, most serene skincare practice in the city. The LED phototherapy calm down my rosacea flare within 24 hours. I have already booked my follow-up.',
      },
      {
        name: 'Charlotte Dubois',
        initial: 'C',
        rating: 5,
        timeAgo: '2 months ago',
        text: 'Dermaplaning + C-Shield left my skin like spun silk. The attention to hygienic sterile procedures here gives me absolute peace of mind. Five stars every time.',
      },
      {
        name: 'James L. Sterling',
        initial: 'J',
        rating: 4,
        timeAgo: '3 months ago',
        text: 'Very thorough consultation and noticeable lifting after the RF sculpt session. Finding parking during peak hours was slightly tricky, but the clinic experience itself was 10/10.',
      },
      {
        name: 'Hannah Morales',
        initial: 'H',
        rating: 5,
        timeAgo: '3 months ago',
        text: 'The Bio-Ceramide Barrier treatment healed my over-exfoliated skin barrier when nothing else worked. Thoughtful, scientifically grounded, and wonderfully relaxing.',
      },
    ],
  },

  // 4 Clinical Team Members
  team: [
    {
      name: 'Dr. Vivienne Mercer, MD',
      title: 'Medical Director & Dermatologist',
      specialty: 'Dermal Pathology & Laser Rejuvenation',
      bio: 'Board-certified with 16 years specializing in laser histology and barrier therapeutics. Dedicated to evidence-backed skin restoration.',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Camille Laurent, LE',
      title: 'Master Clinical Esthetician',
      specialty: 'Cellular Microneedling & Exosome Therapy',
      bio: 'CIDESCO-certified clinical esthetician specializing in corrective collagen therapy and post-inflammatory skin recovery.',
      image: 'https://images.unsplash.com/photo-1594824813587-578b66723223?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Dr. Julian Thorne, PhD',
      title: 'Formulation Biochemist & Specialist',
      specialty: 'Peels & Biochemical Formulations',
      bio: 'Former clinical skincare researcher focusing on peptide carriers and deep epidermal hydration pathways.',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Maya Lin, RN, BSN',
      title: 'Aesthetic Nurse Specialist',
      specialty: 'Bio-Revitalizing & RF Remodeling',
      bio: 'Experienced clinical aesthetic nurse with a delicate touch and passion for non-surgical facial sculpting.',
      image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=600&q=80',
    },
  ],

  // 6 Gallery Items
  gallery: [
    {
      title: 'Clinical Treatment Suite',
      category: 'Sanctuary',
      caption: 'Sterile medical comfort meets organic calm',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Active Peptide Infusion',
      category: 'Treatment',
      caption: 'Targeted hydration delivered via micro-misting',
      image: 'https://images.unsplash.com/photo-1512290900672-1f486d389a81?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Botanical Formulation Bar',
      category: 'Formulation',
      caption: 'Freshly compounded active antioxidants',
      image: 'https://images.unsplash.com/photo-1608248597359-009188d32b50?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Medical LED Spectrum',
      category: 'Technology',
      caption: 'Narrow-band biological light rejuvenation',
      image: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Quiet Post-Treatment Lounge',
      category: 'Wellness',
      caption: 'Organic herbal teas and acoustic de-stressing',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Dermal Sculpting Protocol',
      category: 'Technique',
      caption: 'Precision RF contouring and tissue tightening',
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    },
  ],

  // 6 FAQs
  faqs: [
    {
      question: 'How should I prepare my skin before a facial or peel?',
      answer: 'We recommend pausing active exfoliants (AHAs, BHAs, retinoids, benzoyl peroxide) 72 hours prior to your visit. Avoid heavy direct sun exposure or tanning beds. Arrive with clean skin if possible, although your therapist will perform a thorough double cleanse upon arrival.',
    },
    {
      question: 'What is your cancellation and rescheduling policy?',
      answer: 'We understand that plans can change. Appointments can be rescheduled or cancelled with at least 24 hours advance notice with zero penalty. Because each slot is reserved exclusively for you, late cancellations within 24 hours may incur a modest reservation fee.',
    },
    {
      question: 'Are your treatments safe for sensitive skin or rosacea?',
      answer: 'Yes. Every session begins with a dermal examination. Therapists customize every serum, enzyme strength, and modality to match your specific barrier threshold. We offer specialized calming protocols specifically formulated for reactive or rosacea-prone skin.',
    },
    {
      question: 'Will there be visible redness or downtime?',
      answer: 'Most of our treatments—including the Signature Hydro-Glow and PRX Peel—have zero downtime, leaving you glowing immediately. For deeper collagen microneedling, mild pinkness resembling a light sunburn may persist for 12 to 24 hours.',
    },
    {
      question: 'How do I confirm my appointment after booking online?',
      answer: 'Once you submit your booking through our system, you will receive an immediate booking reference on screen. You can instantly click the "Confirm on WhatsApp" button to verify with our front desk in real-time, or our concierge team will reach out via SMS/email.',
    },
    {
      question: 'Can I purchase gift cards or multi-treatment packages?',
      answer: 'Yes, both digital gift certificates and curated series packages (courses of 3 or 6 sessions) are available at our clinic or upon inquiry via WhatsApp or phone.',
    },
  ],
};

// ============================================================================
// DATABASE & CONNECTION CACHING (MONGODB + MEMORY FALLBACK)
// ============================================================================
let cachedClient = null;
let cachedDb = null;

// In-memory fallback collection for local dev or if MongoDB URI is not yet configured
const inMemoryBookings = [];
const inMemoryCol = {
  find: (query = {}) => {
    const filterFn = (b) => {
      let matches = true;
      if (query.date && b.date !== query.date) matches = false;
      if (query.timeSlot && b.timeSlot !== query.timeSlot) matches = false;
      if (query.status && query.status.$ne && b.status === query.status.$ne) matches = false;
      return matches;
    };
    const getFiltered = () => inMemoryBookings.filter(filterFn);
    return {
      sort: () => ({
        toArray: async () => {
          return [...getFiltered()].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
        },
      }),
      toArray: async () => {
        return [...getFiltered()];
      },
    };
  },
  findOne: async (query) => {
    return inMemoryBookings.find((b) => {
      let matches = true;
      if (query.date && b.date !== query.date) matches = false;
      if (query.timeSlot && b.timeSlot !== query.timeSlot) matches = false;
      if (query.status && query.status.$ne && b.status === query.status.$ne) matches = false;
      return matches;
    }) || null;
  },
  insertOne: async (doc) => {
    // Check unique index logic: date + timeSlot
    const exists = inMemoryBookings.find(
      (b) => b.date === doc.date && b.timeSlot === doc.timeSlot && b.status !== 'cancelled'
    );
    if (exists) {
      const err = new Error('Duplicate key error');
      err.code = 11000;
      throw err;
    }
    const newDoc = { ...doc, _id: 'mem_' + Date.now() + Math.random().toString(36).substr(2, 4) };
    inMemoryBookings.push(newDoc);
    return { insertedId: newDoc._id };
  },
  updateOne: async (filter, update) => {
    const id = String(filter._id);
    const item = inMemoryBookings.find((b) => String(b._id) === id);
    if (item && update.$set) {
      Object.assign(item, update.$set);
    }
    return { modifiedCount: item ? 1 : 0 };
  },
  deleteOne: async (filter) => {
    const id = String(filter._id);
    const idx = inMemoryBookings.findIndex((b) => String(b._id) === id);
    if (idx !== -1) {
      inMemoryBookings.splice(idx, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  },
};

const memoryDbAdapter = {
  collection: (name) => inMemoryCol,
};

async function getDb() {
  if (cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return memoryDbAdapter;
  }

  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });
      await cachedClient.connect();
      const db = cachedClient.db();
      // Ensure unique index on date + timeSlot (excluding cancelled bookings)
      try {
        await db.collection('bookings').createIndex(
          { date: 1, timeSlot: 1 },
          {
            unique: true,
            partialFilterExpression: { status: { $ne: 'cancelled' } },
            name: 'uniq_active_booking_slot',
          }
        );
      } catch (idxErr) {
        // Index may already exist
      }
    }
    cachedDb = cachedClient.db();
    return cachedDb;
  } catch (err) {
    console.error('MongoDB connection error, falling back to memory store:', err.message);
    return memoryDbAdapter;
  }
}

// In-memory rate limiting for booking submissions (IP -> array of timestamps)
const bookingRateLimit = new Map();

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1'
  );
}

function checkBookingRateLimit(ip) {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  let timestamps = bookingRateLimit.get(ip) || [];
  timestamps = timestamps.filter((t) => now - t < oneHour);
  if (timestamps.length >= 8) {
    return false;
  }
  timestamps.push(now);
  bookingRateLimit.set(ip, timestamps);
  return true;
}

// ============================================================================
// EXPRESS APP CONFIGURATION
// ============================================================================
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Environment Variables Diagnostic Check
const missingEnvs = [];
if (!process.env.MONGODB_URI) missingEnvs.push('MONGODB_URI');
if (!process.env.ADMIN_USERNAME) missingEnvs.push('ADMIN_USERNAME');
if (!process.env.ADMIN_PASSWORD) missingEnvs.push('ADMIN_PASSWORD');

if (missingEnvs.length > 0) {
  console.warn(
    `[Lumina Skin Clinic] Notice: Missing environment variables [${missingEnvs.join(
      ', '
    )}]. Defaulting to local memory persistence and credentials (admin / lumina2026).`
  );
}

// Mount Admin Router at /admin
app.use('/admin', createAdminRouter(getDb, CONFIG));

// ============================================================================
// PUBLIC API ENDPOINTS
// ============================================================================

// Helper to calculate available slots for a given date
function generateSlotsForDay(dayOfWeek, timeFormat) {
  const schedule = CONFIG.openingHours[dayOfWeek];
  if (!schedule || schedule.closed) return [];

  const [openH, openM] = schedule.open.split(':').map(Number);
  const [closeH, closeM] = schedule.close.split(':').map(Number);

  const startMinutes = openH * 60 + openM;
  const endMinutes = closeH * 60 + closeM;
  const slotDuration = 60; // 60-minute appointment slots

  const slots = [];
  for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const minStr = min < 10 ? '0' + min : min;

    if (timeFormat === '24h') {
      const hStr = h < 10 ? '0' + h : h;
      slots.push(`${hStr}:${minStr}`);
    } else {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const hStr = h12 < 10 ? '0' + h12 : h12;
      slots.push(`${hStr}:${minStr} ${ampm}`);
    }
  }
  return slots;
}

// GET /api/available-slots?date=YYYY-MM-DD
app.get('/api/available-slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Valid date parameter (YYYY-MM-DD) required' });
    }

    const targetDate = new Date(date + 'T12:00:00Z');
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[targetDate.getUTCDay()];

    const allSlots = generateSlotsForDay(dayOfWeek, CONFIG.timeFormat);
    if (allSlots.length === 0) {
      return res.json({ date, slots: [], closed: true, message: 'The clinic is closed on this day.' });
    }

    // Query active bookings for this date
    const db = await getDb();
    const col = db.collection('bookings');
    let booked = [];
    if (col) {
      booked = await col
        .find({ date, status: { $ne: 'cancelled' } })
        .toArray();
    }

    const bookedSlotSet = new Set(booked.map((b) => b.timeSlot));
    const slots = allSlots.map((slot) => ({
      slot,
      available: !bookedSlotSet.has(slot),
    }));

    res.json({ date, slots, closed: false });
  } catch (err) {
    console.error('Error fetching available slots:', err);
    res.status(500).json({ error: 'Failed to compute slot availability' });
  }
});

// POST /api/bookings
app.post('/api/bookings', async (req, res) => {
  const ip = getClientIp(req);
  if (!checkBookingRateLimit(ip)) {
    return res.status(429).json({
      error: 'Too many booking requests from this network. Please wait a short while or call us directly.',
    });
  }

  // Honeypot check
  if (req.body.hp_website || req.body.bot_catcher) {
    return res.status(400).json({ error: 'Invalid submission detected' });
  }

  const { serviceId, date, timeSlot, clientName, clientPhone, clientEmail, notes } = req.body;

  // Validation
  if (!serviceId || !date || !timeSlot || !clientName || !clientPhone || !clientEmail) {
    return res.status(400).json({ error: 'All primary contact and booking fields are required.' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  if (!/\S+@\S+\.\S+/.test(clientEmail)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (clientName.trim().length < 2) {
    return res.status(400).json({ error: 'Please enter your full name.' });
  }

  const service = CONFIG.services.find((s) => s.id === serviceId);
  if (!service) {
    return res.status(400).json({ error: 'Selected treatment service does not exist.' });
  }

  try {
    const db = await getDb();
    const col = db.collection('bookings');

    // Double-booking check
    const existing = await col.findOne({
      date,
      timeSlot,
      status: { $ne: 'cancelled' },
    });

    if (existing) {
      return res.status(409).json({
        error: 'This appointment slot has just been reserved. Please select another time or date.',
      });
    }

    const bookingRef = 'LUM-' + Math.floor(100000 + Math.random() * 900000);
    const newBooking = {
      bookingRef,
      serviceId: service.id,
      serviceTitle: service.title,
      price: service.price,
      date,
      timeSlot,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim().toLowerCase(),
      notes: (notes || '').trim(),
      status: 'pending',
      ipAddress: ip,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await col.insertOne(newBooking);

    // Format WhatsApp confirmation link
    const waCleanPhone = CONFIG.whatsAppNumber.replace(/[^0-9]/g, '');
    const waMessage = `Hello ${CONFIG.name}, I have booked the ${service.title} for ${date} at ${timeSlot}. My booking reference is ${bookingRef}. Name: ${clientName.trim()}.`;
    const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(waMessage)}`;

    res.json({
      success: true,
      bookingRef,
      serviceTitle: service.title,
      date,
      timeSlot,
      clientName: clientName.trim(),
      whatsAppUrl: waUrl,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'This appointment slot was just booked by another client. Please choose another time.',
      });
    }
    console.error('Error creating booking:', err);
    res.status(500).json({ error: 'Server encountered an error saving your booking. Please try again.' });
  }
});

// GET /robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${CONFIG.url}/sitemap.xml\n`);
});

// GET /sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${CONFIG.url}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
});

// ============================================================================
// SERVER-RENDERED PUBLIC SITE (GET /)
// ============================================================================
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderPublicSite(CONFIG, missingEnvs));
});

// ============================================================================
// HTML TEMPLATE BUILDER WITH INLINE CSS AND JS (80:15:5 SYSTEM)
// ============================================================================
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderPublicSite(config, envWarnings) {
  const priceFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: config.currency,
    maximumFractionDigits: 0,
  });

  const waLink = `https://wa.me/${config.whatsAppNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hello ${config.name}, I would like to inquire about booking a facial treatment.`
  )}`;
  const telLink = `tel:${config.phone.replace(/[^0-9+]/g, '')}`;
  const mailLink = `mailto:${config.email}?subject=${encodeURIComponent(
    `Appointment Inquiry — ${config.name}`
  )}`;
  const dirLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    config.address
  )}`;

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: config.name,
    description: config.tagline,
    url: config.url,
    telephone: config.phone,
    email: config.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: config.address,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(config.reviewsData.averageRating),
      reviewCount: String(config.reviewsData.totalReviews),
    },
    priceRange: '$$',
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.name)} — ${escapeHtml(config.tagline)}</title>
  <meta name="description" content="${escapeHtml(config.subheading)}">
  <meta property="og:title" content="${escapeHtml(config.name)} — ${escapeHtml(config.tagline)}">
  <meta property="og:description" content="${escapeHtml(config.subheading)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${config.url}">
  <meta property="og:image" content="${config.services[0].image}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script type="application/ld+json">
    ${JSON.stringify(jsonLd)}
  </script>

  <style>
    /* ==========================================================================
       80:15:5 DESIGN SYSTEM (FLAT COLOR : GLASSMORPHISM : CLAYMORPHISM)
       ========================================================================== */
    :root {
      /* 80% Flat Soft Palette */
      --bg-cream: #FAF8F5;
      --bg-surface: #FFFFFF;
      --color-sage: #6B8E7D;
      --color-sage-dark: #537564;
      --color-sage-soft: #EEF3EF;
      --color-blush: #FBF2EF;
      --color-blush-soft: #FDF9F8;
      --color-sand: #EFE8DE;
      --text-main: #242E2B;
      --text-muted: #64746E;
      --border-subtle: rgba(36, 46, 43, 0.08);

      /* 15% Glassmorphism (Overlays, Nav & Dock) */
      --glass-bg: rgba(250, 248, 245, 0.88);
      --glass-card: rgba(255, 255, 255, 0.82);
      --glass-border: rgba(255, 255, 255, 0.65);
      --glass-shadow: 0 16px 40px -10px rgba(83, 117, 100, 0.08);

      /* 5% Claymorphism (Buttons & Actions Only) */
      --clay-radius: 16px;
      --clay-shadow: 0 6px 14px rgba(107, 142, 125, 0.28), inset 0 1px 1.5px rgba(255, 255, 255, 0.85);
      --clay-shadow-hover: 0 8px 18px rgba(107, 142, 125, 0.35), inset 0 1px 1.5px rgba(255, 255, 255, 0.9);
      --clay-shadow-active: 0 2px 6px rgba(107, 142, 125, 0.2), inset 0 1px 1px rgba(0, 0, 0, 0.12);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-cream);
      color: var(--text-main);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    h1, h2, h3, h4 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-weight: 600;
      line-height: 1.18;
      letter-spacing: -0.015em;
      text-wrap: balance;
    }

    .container {
      max-width: 1240px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .tabular { font-variant-numeric: tabular-nums; }

    /* Claymorphism Buttons */
    .clay-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background-color: var(--color-sage);
      color: #FFFFFF;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 600;
      font-size: 0.925rem;
      padding: 0.85rem 1.75rem;
      border-radius: var(--clay-radius);
      border: 1px solid rgba(255, 255, 255, 0.35);
      box-shadow: var(--clay-shadow);
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      white-space: nowrap;
      user-select: none;
    }
    .clay-btn:hover {
      background-color: var(--color-sage-dark);
      box-shadow: var(--clay-shadow-hover);
      transform: translateY(-2px);
    }
    .clay-btn:active {
      transform: scale(0.97);
      box-shadow: var(--clay-shadow-active);
    }
    .clay-btn-sm {
      padding: 0.55rem 1.15rem;
      font-size: 0.825rem;
      border-radius: 12px;
    }
    .clay-btn-secondary {
      background-color: #FFFFFF;
      color: var(--text-main);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04), inset 0 1px 1px #FFFFFF;
    }
    .clay-btn-secondary:hover {
      background-color: var(--color-sage-soft);
      color: var(--color-sage-dark);
      border-color: rgba(107, 142, 125, 0.3);
    }

    /* Glassmorphism Elements */
    .glass-surface {
      background: var(--glass-card);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid var(--glass-border);
      border-radius: 20px;
      box-shadow: var(--glass-shadow);
    }

    /* Top Sticky Navigation */
    .top-nav {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--glass-bg);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--border-subtle);
      transition: all 0.25s ease;
    }
    .nav-inner {
      height: 76px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
    }
    .brand-wordmark {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 1.65rem;
      font-weight: 700;
      color: var(--text-main);
      text-decoration: none;
      letter-spacing: -0.02em;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 1.75rem;
      list-style: none;
    }
    .nav-link {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-muted);
      text-decoration: none;
      position: relative;
      transition: color 0.2s;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .nav-link:hover { color: var(--color-sage-dark); }
    .nav-link::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 0;
      height: 2px;
      background: var(--color-sage);
      transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      border-radius: 2px;
    }
    .nav-link:hover::after { width: 100%; }

    /* Ambient Floating Blobs */
    .ambient-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(70px);
      z-index: 0;
      pointer-events: none;
      opacity: 0.65;
      animation: floatSlow 18s ease-in-out infinite alternate;
    }
    @keyframes floatSlow {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(30px, -20px) scale(1.08); }
      100% { transform: translate(-20px, 25px) scale(0.95); }
    }

    /* Hero Section */
    .hero-section {
      position: relative;
      padding: 5rem 0 4.5rem;
      overflow: hidden;
    }
    .hero-grid {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 3.5rem;
      align-items: center;
    }
    .hero-headline {
      font-size: clamp(2.75rem, 5vw, 4.25rem);
      margin-bottom: 1.25rem;
      color: var(--text-main);
    }
    .hero-lead {
      font-size: 1.1rem;
      color: var(--text-muted);
      margin-bottom: 2rem;
      max-width: 580px;
      line-height: 1.7;
    }
    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      margin-bottom: 2.5rem;
    }
    .hero-card {
      padding: 2.25rem;
      position: relative;
    }

    /* Trust Stats Grid */
    .trust-strip {
      background: var(--bg-surface);
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
      padding: 3rem 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2rem;
      text-align: center;
    }
    .stat-number {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 2.85rem;
      font-weight: 700;
      color: var(--color-sage-dark);
      line-height: 1;
      margin-bottom: 0.35rem;
    }
    .stat-label {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 500;
      letter-spacing: 0.02em;
    }

    /* Section Headers */
    .section-wrap {
      padding: 5.5rem 0;
      position: relative;
    }
    .section-header {
      text-align: center;
      max-width: 680px;
      margin: 0 auto 3.5rem;
    }
    .section-kicker {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--color-sage-dark);
      font-weight: 600;
      margin-bottom: 0.75rem;
      display: block;
    }
    .section-title {
      font-size: clamp(2.2rem, 3.5vw, 3rem);
      color: var(--text-main);
      margin-bottom: 1rem;
    }
    .section-desc {
      color: var(--text-muted);
      font-size: 1.05rem;
    }

    /* Services Grid */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.75rem;
    }
    .service-card {
      background: var(--bg-surface);
      border-radius: 18px;
      border: 1px solid var(--border-subtle);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s;
    }
    .service-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(83, 117, 100, 0.08);
    }
    .service-img-wrap {
      width: 100%;
      height: 200px;
      position: relative;
      background: var(--color-sage-soft);
      overflow: hidden;
    }
    .service-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .service-card:hover .service-img {
      transform: scale(1.04);
    }
    .service-body {
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .service-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.65rem;
    }
    .service-title {
      font-size: 1.45rem;
      margin-bottom: 0.75rem;
      color: var(--text-main);
    }
    .service-desc {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
      flex-grow: 1;
    }
    .service-benefits {
      list-style: none;
      margin-bottom: 1.5rem;
      border-top: 1px solid var(--border-subtle);
      padding-top: 1rem;
    }
    .service-benefits li {
      font-size: 0.8rem;
      color: var(--text-main);
      margin-bottom: 0.4rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .service-benefits li::before {
      content: '✓';
      color: var(--color-sage);
      font-weight: 700;
    }
    .service-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
    }
    .service-price {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-main);
    }

    /* Google Reviews Section (Modeled after Google Business Profile) */
    .google-card {
      background: var(--bg-surface);
      border-radius: 20px;
      border: 1px solid var(--border-subtle);
      padding: 2.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
      margin-bottom: 3rem;
    }
    .google-summary-grid {
      display: grid;
      grid-template-columns: 0.8fr 1.2fr;
      gap: 3rem;
      align-items: center;
    }
    .google-score-box {
      text-align: center;
      padding-right: 2rem;
      border-right: 1px solid var(--border-subtle);
    }
    .google-big-score {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 4.5rem;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1;
      margin-bottom: 0.25rem;
    }
    .stars-row {
      color: #F59E0B;
      font-size: 1.35rem;
      letter-spacing: 2px;
      margin-bottom: 0.5rem;
    }
    .dist-bar-row {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-bottom: 0.5rem;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .dist-progress-bg {
      flex-grow: 1;
      height: 8px;
      background: var(--color-sage-soft);
      border-radius: 999px;
      overflow: hidden;
    }
    .dist-progress-fill {
      height: 100%;
      background: #F59E0B;
      width: 0%;
      border-radius: 999px;
      transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .reviews-carousel-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
      gap: 1.5rem;
    }
    .review-card {
      background: var(--bg-surface);
      border-radius: 16px;
      border: 1px solid var(--border-subtle);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
    }
    .reviewer-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .reviewer-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--color-blush);
      color: var(--color-sage-dark);
      font-weight: 700;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .reviewer-info h4 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-main);
    }
    .reviewer-info span {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .review-text {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    /* Gallery Grid */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
    .gallery-card {
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      aspect-ratio: 4 / 3;
      background: var(--color-sage-soft);
    }
    .gallery-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .gallery-card:hover .gallery-img {
      transform: scale(1.05);
    }
    .gallery-scrim {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0,0,0,0.2) 40%, transparent 100%);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 1.25rem;
      color: #FFFFFF;
      opacity: 0.95;
    }
    .gallery-cat {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #F7EBE8;
      margin-bottom: 0.25rem;
    }
    .gallery-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 1.25rem;
      color: #FFFFFF;
    }

    /* Team Grid */
    .team-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 2rem;
    }
    .team-card {
      background: var(--bg-surface);
      border-radius: 18px;
      border: 1px solid var(--border-subtle);
      overflow: hidden;
      text-align: center;
    }
    .team-img-wrap {
      width: 100%;
      height: 280px;
      background: var(--color-sage-soft);
      overflow: hidden;
    }
    .team-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .team-info {
      padding: 1.5rem;
    }
    .team-name {
      font-size: 1.35rem;
      margin-bottom: 0.25rem;
      color: var(--text-main);
    }
    .team-title {
      font-size: 0.8rem;
      color: var(--color-sage-dark);
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    .team-bio {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* Booking Form & Modal */
    .booking-section {
      background: var(--color-blush-soft);
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
    }
    .booking-form-box {
      max-width: 780px;
      margin: 0 auto;
      background: var(--bg-surface);
      border-radius: 20px;
      border: 1px solid var(--border-subtle);
      padding: 2.5rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      margin-bottom: 1.25rem;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 1.25rem;
    }
    .form-field label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-main);
    }
    .form-field input, .form-field select, .form-field textarea {
      padding: 0.8rem 1rem;
      border-radius: 12px;
      border: 1px solid var(--border-subtle);
      background: #FFFFFF;
      font-family: inherit;
      font-size: 0.925rem;
      color: var(--text-main);
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-field input:focus, .form-field select:focus, .form-field textarea:focus {
      border-color: var(--color-sage);
      box-shadow: 0 0 0 3px rgba(107, 142, 125, 0.15);
    }
    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
      gap: 0.65rem;
      margin-top: 0.5rem;
    }
    .slot-chip {
      padding: 0.6rem 0.5rem;
      text-align: center;
      border-radius: 10px;
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border-subtle);
      background: var(--bg-cream);
      color: var(--text-main);
      transition: all 0.15s;
    }
    .slot-chip:hover:not(.disabled) {
      background: var(--color-sage-soft);
      border-color: var(--color-sage);
      color: var(--color-sage-dark);
    }
    .slot-chip.selected {
      background: var(--color-sage);
      color: #FFFFFF;
      border-color: var(--color-sage);
      box-shadow: var(--clay-shadow);
    }
    .slot-chip.disabled {
      opacity: 0.4;
      cursor: not-allowed;
      text-decoration: line-through;
      background: #F3F4F6;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(36, 46, 43, 0.45);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      opacity: 0;
      visibility: hidden;
      transition: all 0.25s ease;
    }
    .modal-overlay.open {
      opacity: 1;
      visibility: visible;
    }
    .modal-card {
      background: var(--bg-surface);
      border-radius: 24px;
      max-width: 650px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      padding: 2.5rem;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
      transform: scale(0.95);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }
    .modal-overlay.open .modal-card {
      transform: scale(1);
    }
    .modal-close {
      position: absolute;
      top: 1.25rem;
      right: 1.25rem;
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--text-muted);
      cursor: pointer;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-close:hover { background: var(--color-sage-soft); color: var(--text-main); }

    /* Floating Contact Dock (Glassmorphism 15%) */
    .floating-dock {
      position: fixed;
      z-index: 90;
      background: var(--glass-card);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--glass-border);
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.12);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-radius: 999px;
      transition: all 0.25s ease;
    }
    /* Mobile: Bottom Bar */
    @media (max-width: 768px) {
      .floating-dock {
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        width: calc(100% - 2rem);
        max-width: 440px;
        justify-content: space-around;
        padding: 0.65rem 0.5rem;
      }
      .dock-label { display: none; }
    }
    /* Desktop: Side Rail Dock */
    @media (min-width: 769px) {
      .floating-dock {
        right: 1.5rem;
        bottom: 2rem;
        flex-direction: column;
        border-radius: 20px;
        padding: 0.85rem 0.65rem;
        gap: 0.65rem;
      }
      .dock-label { font-size: 0.75rem; font-weight: 600; }
    }
    .dock-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 0.85rem;
      border-radius: 12px;
      text-decoration: none;
      color: var(--text-main);
      font-size: 0.825rem;
      font-weight: 600;
      transition: all 0.2s;
    }
    .dock-btn:hover {
      background: var(--color-sage-soft);
      color: var(--color-sage-dark);
    }
    .dock-btn-primary {
      background: var(--color-sage);
      color: #FFFFFF !important;
      box-shadow: var(--clay-shadow);
    }
    .dock-btn-primary:hover {
      background: var(--color-sage-dark);
    }

    /* FAQ Accordion */
    .faq-list {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .faq-item {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .faq-question {
      width: 100%;
      text-align: left;
      padding: 1.35rem 1.75rem;
      background: none;
      border: none;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-main);
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }
    .faq-icon {
      font-size: 1.25rem;
      color: var(--color-sage);
      transition: transform 0.25s ease;
    }
    .faq-answer {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), padding 0.2s;
      color: var(--text-muted);
      font-size: 0.925rem;
      line-height: 1.65;
      padding: 0 1.75rem;
    }
    .faq-item.active .faq-icon {
      transform: rotate(45deg);
    }
    .faq-item.active .faq-answer {
      max-height: 250px;
      padding-bottom: 1.5rem;
    }

    /* Schedule & Keyless Map */
    .map-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 2.5rem;
      align-items: stretch;
    }
    .hours-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    .hours-table tr {
      border-bottom: 1px solid var(--border-subtle);
    }
    .hours-table tr:last-child { border-bottom: none; }
    .hours-table td {
      padding: 0.85rem 0;
      color: var(--text-muted);
    }
    .hours-table td:last-child {
      text-align: right;
      font-weight: 600;
      color: var(--text-main);
    }
    .map-iframe-wrap {
      width: 100%;
      height: 100%;
      min-height: 380px;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid var(--border-subtle);
      background: var(--color-sage-soft);
    }

    /* Footer */
    .footer {
      background: var(--text-main);
      color: #FFFFFF;
      padding: 4.5rem 0 2rem;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 3rem;
      margin-bottom: 3.5rem;
    }
    .footer a {
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      transition: color 0.2s;
    }
    .footer a:hover { color: #FFFFFF; }

    /* Responsive */
    @media (max-width: 992px) {
      .hero-grid { grid-template-columns: 1fr; gap: 2.5rem; }
      .google-summary-grid { grid-template-columns: 1fr; }
      .google-score-box { border-right: none; border-bottom: 1px solid var(--border-subtle); padding-bottom: 2rem; padding-right: 0; }
      .gallery-grid { grid-template-columns: repeat(2, 1fr); }
      .map-grid { grid-template-columns: 1fr; }
      .footer-grid { grid-template-columns: 1fr 1fr; }
      .nav-links { display: none; }
    }
    @media (max-width: 640px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
      .form-grid-2 { grid-template-columns: 1fr; }
      .gallery-grid { grid-template-columns: 1fr; }
      .footer-grid { grid-template-columns: 1fr; }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  </style>
</head>
<body>

  <!-- Top Sticky Bar (3-Zone Contract) -->
  <header class="top-nav">
    <div class="container nav-inner">
      <!-- Zone 1: Wordmark -->
      <a href="/" class="brand-wordmark">${escapeHtml(config.name)}</a>

      <!-- Zone 2: 5 Concise Links -->
      <nav class="nav-links">
        <a href="#services" class="nav-link">Treatments</a>
        <a href="#why-us" class="nav-link">Clinical Philosophy</a>
        <a href="#reviews" class="nav-link">Google Reviews</a>
        <a href="#gallery" class="nav-link">Clinic Suite</a>
        <a href="#hours" class="nav-link">Hours &amp; Location</a>
      </nav>

      <!-- Zone 3: 1 Primary CTA -->
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button onclick="openBookingModal()" class="clay-btn clay-btn-sm">
          Book Treatment
        </button>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero-section">
    <div class="ambient-blob" style="width: 480px; height: 480px; background: #F0F5F1; top: -100px; right: -50px;"></div>
    <div class="ambient-blob" style="width: 360px; height: 360px; background: #FBF0ED; bottom: -50px; left: -100px; animation-delay: -6s;"></div>

    <div class="container hero-grid">
      <div>
        <span class="section-kicker">Clinical Aesthetics &amp; Skin Health</span>
        <h1 class="hero-headline">${escapeHtml(config.tagline)}</h1>
        <p class="hero-lead">${escapeHtml(config.subheading)}</p>

        <div class="hero-actions">
          <button onclick="openBookingModal()" class="clay-btn">
            Book an Appointment
          </button>
          <a href="#services" class="clay-btn clay-btn-secondary">
            Explore Treatments &darr;
          </a>
        </div>

        <!-- 5 Actions Quick Strip in Hero -->
        <div style="display: flex; flex-wrap: wrap; gap: 1.25rem; font-size: 0.85rem; color: var(--text-muted); align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 1.5rem;">
          <a href="${waLink}" target="_blank" style="color: var(--color-sage-dark); font-weight: 600; text-decoration: none;">WhatsApp Concierge</a>
          <span>&middot;</span>
          <a href="${telLink}" style="color: var(--text-main); font-weight: 600; text-decoration: none;">${escapeHtml(config.phone)}</a>
          <span>&middot;</span>
          <a href="${dirLink}" target="_blank" style="color: var(--text-main); text-decoration: none;">Get Directions &rarr;</a>
        </div>
      </div>

      <!-- Hero Glass Info Card -->
      <div class="glass-surface hero-card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
          <span style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--color-sage-dark); letter-spacing: 0.1em;">Metropolis Clinic</span>
          <span style="font-size: 0.75rem; background: var(--color-sage-soft); color: var(--color-sage-dark); padding: 0.25rem 0.6rem; border-radius: 999px; font-weight: 600;">Accepting New Patients</span>
        </div>

        <h3 style="font-size: 1.85rem; margin-bottom: 1rem; color: var(--text-main);">Evidence-Based Rejuvenation</h3>
        <p style="font-size: 0.925rem; color: var(--text-muted); margin-bottom: 1.75rem; line-height: 1.6;">
          Located on Crescent Boulevard, our multi-disciplinary aesthetic clinic combines medical-grade active formulations with advanced transdermal delivery systems.
        </p>

        <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 14px; border: 1px solid var(--border-subtle); margin-bottom: 1.5rem;">
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.35rem;">Today's Operating Hours</div>
          <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-main);">Open 09:00 AM – 06:00 PM</div>
          <div style="font-size: 0.8rem; color: var(--color-sage-dark); margin-top: 0.35rem; font-weight: 500;">Same-day consultations subject to slot availability</div>
        </div>

        <button onclick="openBookingModal()" class="clay-btn" style="width: 100%;">
          Reserve Slot Online
        </button>
      </div>
    </div>
  </section>

  <!-- Trust Stats (Animated Counting Effect via IntersectionObserver) -->
  <section class="trust-strip">
    <div class="container">
      <div class="stats-grid">
        ${config.trustStats
          .map(
            (s) => `
          <div>
            <div class="stat-number tabular" data-count-target="${s.value}" data-decimals="${s.decimals}" data-suffix="${escapeHtml(s.suffix)}">0</div>
            <div class="stat-label">${escapeHtml(s.label)}</div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  </section>

  <!-- Services & Treatments (8 items) -->
  <section id="services" class="section-wrap">
    <div class="container">
      <div class="section-header">
        <span class="section-kicker">Tailored Formulations</span>
        <h2 class="section-title">Clinical Treatments</h2>
        <p class="section-desc">Each treatment begins with a digital skin barrier analysis to prescribe pure active ingredients matching your cell turnover cycle.</p>
      </div>

      <div class="services-grid">
        ${config.services
          .map(
            (s) => `
          <div class="service-card" id="card-${s.id}">
            <div class="service-img-wrap">
              <img src="${s.image}"
                   alt="${escapeHtml(s.title)}"
                   class="service-img"
                   loading="lazy"
                   width="400"
                   height="200"
                   referrerpolicy="no-referrer"
                   onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'200\\' viewBox=\\'0 0 400 200\\'><rect fill=\\'%23EEF3EF\\' width=\\'400\\' height=\\'200\\'/><text fill=\\'%236B8E7D\\' x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\' font-size=\\'16\\'>${encodeURIComponent(s.title)}</text></svg>';">
            </div>
            <div class="service-body">
              <div class="service-meta">
                <span>${escapeHtml(s.category)}</span>
                <span>&middot;</span>
                <span class="tabular">${escapeHtml(s.duration)}</span>
              </div>
              <h3 class="service-title">${escapeHtml(s.title)}</h3>
              <p class="service-desc">${escapeHtml(s.description)}</p>

              <ul class="service-benefits">
                ${s.benefits.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
              </ul>

              <div class="service-footer">
                <span class="service-price tabular">${priceFormatter.format(s.price)}</span>
                <button onclick="selectServiceAndBook('${s.id}')" class="clay-btn clay-btn-sm">
                  Book Treatment
                </button>
              </div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  </section>

  <!-- Why Choose Us -->
  <section id="why-us" class="section-wrap" style="background: var(--bg-surface); border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle);">
    <div class="container">
      <div class="section-header">
        <span class="section-kicker">Clinical Integrity</span>
        <h2 class="section-title">The Lumina Standard</h2>
        <p class="section-desc">We avoid ephemeral trends in favor of cellular dermatology, sterile clinical protocol, and documented patient outcomes.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
        <div style="padding: 2rem; border-radius: 16px; background: var(--bg-cream); border: 1px solid var(--border-subtle);">
          <div style="font-size: 1.5rem; color: var(--color-sage-dark); margin-bottom: 1rem; font-family: 'Cormorant Garamond', serif; font-weight: 700;">01.</div>
          <h3 style="font-size: 1.35rem; margin-bottom: 0.65rem; color: var(--text-main);">Sterile Medical Rigor</h3>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">Autoclave sterilization for every single instrument, single-use tips, and hospital-grade surgical hygiene standards.</p>
        </div>

        <div style="padding: 2rem; border-radius: 16px; background: var(--bg-cream); border: 1px solid var(--border-subtle);">
          <div style="font-size: 1.5rem; color: var(--color-sage-dark); margin-bottom: 1rem; font-family: 'Cormorant Garamond', serif; font-weight: 700;">02.</div>
          <h3 style="font-size: 1.35rem; margin-bottom: 0.65rem; color: var(--text-main);">Certified Dermal Specialists</h3>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">Every treatment is delivered exclusively by licensed estheticians and nurses with minimum 5 years clinical tenure.</p>
        </div>

        <div style="padding: 2rem; border-radius: 16px; background: var(--bg-cream); border: 1px solid var(--border-subtle);">
          <div style="font-size: 1.5rem; color: var(--color-sage-dark); margin-bottom: 1rem; font-family: 'Cormorant Garamond', serif; font-weight: 700;">03.</div>
          <h3 style="font-size: 1.35rem; margin-bottom: 0.65rem; color: var(--text-main);">Bio-Identical Actives</h3>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">Pharmaceutical grade peptides, pure growth factors, and liposomal acids without artificial fragrances or fillers.</p>
        </div>

        <div style="padding: 2rem; border-radius: 16px; background: var(--bg-cream); border: 1px solid var(--border-subtle);">
          <div style="font-size: 1.5rem; color: var(--color-sage-dark); margin-bottom: 1rem; font-family: 'Cormorant Garamond', serif; font-weight: 700;">04.</div>
          <h3 style="font-size: 1.35rem; margin-bottom: 0.65rem; color: var(--text-main);">Long-Term Regimen Plan</h3>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">Personalized homecare protocol sent after every appointment, designed to sustain dermal collagen density between visits.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Google Reviews & Rating Profile (Structured like Google Business Profile) -->
  <section id="reviews" class="section-wrap">
    <div class="container">
      <div class="section-header">
        <span class="section-kicker">Verified Patient Experiences</span>
        <h2 class="section-title">Google Business Reviews</h2>
        <p class="section-desc">Live community ratings independently verified by patients on our official Google Business profile.</p>
      </div>

      <!-- Google Profile Summary Card -->
      <div class="google-card">
        <div class="google-summary-grid">
          <div class="google-score-box">
            <div style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 0.25rem;">Overall Rating</div>
            <div class="google-big-score tabular" data-count-target="${config.reviewsData.averageRating}" data-decimals="1">0.0</div>
            <div class="stars-row">★★★★★</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">
              Based on <strong class="tabular" style="color: var(--text-main); font-weight: 700;" data-count-target="${config.reviewsData.totalReviews}">0</strong> verified reviews
            </div>
            <div style="margin-top: 1.25rem;">
              <a href="${config.googleReviewsUrl}" target="_blank" rel="noopener noreferrer" class="clay-btn clay-btn-secondary clay-btn-sm">
                View all on Google &rarr;
              </a>
            </div>
          </div>

          <!-- 5-to-1 Distribution Bars -->
          <div>
            ${config.reviewsData.distribution
              .map(
                (d) => `
              <div class="dist-bar-row">
                <span style="width: 50px; font-weight: 500;">${d.stars} stars</span>
                <div class="dist-progress-bg">
                  <div class="dist-progress-fill" data-progress-width="${d.percentage}%"></div>
                </div>
                <span class="tabular" style="width: 35px; text-align: right; color: var(--text-muted);">${d.percentage}%</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>

      <!-- 8 Review Cards -->
      <div class="reviews-carousel-grid">
        ${config.reviewsData.items
          .map(
            (r) => `
          <div class="review-card">
            <div class="reviewer-header">
              <div class="reviewer-avatar">${escapeHtml(r.initial)}</div>
              <div class="reviewer-info">
                <h4>${escapeHtml(r.name)}</h4>
                <span>${escapeHtml(r.timeAgo)} &middot; Verified Patient</span>
              </div>
            </div>
            <div class="stars-row" style="font-size: 1rem; margin-bottom: 0.5rem;">
              ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
            </div>
            <p class="review-text">"${escapeHtml(r.text)}"</p>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  </section>

  <!-- Clinic Gallery (6 Items) -->
  <section id="gallery" class="section-wrap" style="background: var(--bg-surface); border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle);">
    <div class="container">
      <div class="section-header">
        <span class="section-kicker">Sanctuary of Care</span>
        <h2 class="section-title">The Treatment Space</h2>
        <p class="section-desc">Designed with architectural minimalism, private ambient temperature control, and clinical air purification.</p>
      </div>

      <div class="gallery-grid">
        ${config.gallery
          .map(
            (g) => `
          <div class="gallery-card">
            <img src="${g.image}"
                 alt="${escapeHtml(g.title)}"
                 class="gallery-img"
                 loading="lazy"
                 width="400"
                 height="300"
                 referrerpolicy="no-referrer"
                 onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'300\\' viewBox=\\'0 0 400 300\\'><rect fill=\\'%23EEF3EF\\' width=\\'400\\' height=\\'300\\'/><text fill=\\'%236B8E7D\\' x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\' font-size=\\'16\\'>${encodeURIComponent(g.title)}</text></svg>';">
            <div class="gallery-scrim">
              <span class="gallery-cat">${escapeHtml(g.category)}</span>
              <h4 class="gallery-title">${escapeHtml(g.title)}</h4>
              <p style="font-size: 0.75rem; color: rgba(255,255,255,0.8);">${escapeHtml(g.caption)}</p>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  </section>

  <!-- Clinical Team (4 Members) -->
  <section class="section-wrap">
    <div class="container">
      <div class="section-header">
        <span class="section-kicker">Specialist Credentials</span>
        <h2 class="section-title">Our Clinical Practitioners</h2>
        <p class="section-desc">Led by board-certified dermatologists and licensed master estheticians with specialized degrees in dermal science.</p>
      </div>

      <div class="team-grid">
        ${config.team
          .map(
            (m) => `
          <div class="team-card">
            <div class="team-img-wrap">
              <img src="${m.image}"
                   alt="${escapeHtml(m.name)}"
                   class="team-img"
                   loading="lazy"
                   width="300"
                   height="280"
                   referrerpolicy="no-referrer"
                   onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'280\\' viewBox=\\'0 0 300 280\\'><rect fill=\\'%23EEF3EF\\' width=\\'300\\' height=\\'280\\'/><text fill=\\'%236B8E7D\\' x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\' font-size=\\'16\\'>${encodeURIComponent(m.name)}</text></svg>';">
            </div>
            <div class="team-info">
              <h3 class="team-name">${escapeHtml(m.name)}</h3>
              <div class="team-title">${escapeHtml(m.title)}</div>
              <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.5rem;">${escapeHtml(m.specialty)}</div>
              <p class="team-bio">${escapeHtml(m.bio)}</p>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  </section>

  <!-- Interactive Online Booking Section -->
  <section id="booking" class="section-wrap booking-section">
    <div class="container">
      <div class="section-header">
        <span class="section-kicker">Instant Reservation</span>
        <h2 class="section-title">Book Your Appointment</h2>
        <p class="section-desc">Select your desired treatment, choose an available time slot, and receive immediate appointment confirmation.</p>
      </div>

      <div class="booking-form-box">
        <form id="sectionBookingForm" onsubmit="handleBookingSubmit(event, 'sectionBookingForm')">
          <!-- Anti-bot honeypot -->
          <input type="text" name="hp_website" style="display: none !important;" tabindex="-1" autocomplete="off">

          <div class="form-grid-2">
            <div class="form-field">
              <label for="sec-service">Treatment Service</label>
              <select id="sec-service" name="serviceId" required onchange="handleServiceChange(this.value)">
                <option value="">Select a treatment...</option>
                ${config.services
                  .map(
                    (s) => `
                  <option value="${s.id}">${escapeHtml(s.title)} (${priceFormatter.format(s.price)} &middot; ${s.duration})</option>
                `
                  )
                  .join('')}
              </select>
            </div>

            <div class="form-field">
              <label for="sec-date">Preferred Date</label>
              <input type="date" id="sec-date" name="date" required onchange="fetchAvailableSlots(this.value, 'sec-slots-container', 'sec-timeSlot-input')">
            </div>
          </div>

          <!-- Time Slot Selector -->
          <div class="form-field">
            <label>Available Appointment Slots</label>
            <input type="hidden" id="sec-timeSlot-input" name="timeSlot" required>
            <div id="sec-slots-container" class="slots-grid">
              <div style="grid-column: 1 / -1; padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.875rem; background: var(--bg-cream); border-radius: 10px;">
                Please select a treatment date above to generate available appointment slots.
              </div>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-field">
              <label for="sec-name">Full Name</label>
              <input type="text" id="sec-name" name="clientName" placeholder="e.g. Sarah Jenkins" required>
            </div>
            <div class="form-field">
              <label for="sec-phone">Phone Number (E.164)</label>
              <input type="tel" id="sec-phone" name="clientPhone" placeholder="e.g. +1 555 234 5678" required>
            </div>
          </div>

          <div class="form-field">
            <label for="sec-email">Email Address</label>
            <input type="email" id="sec-email" name="clientEmail" placeholder="e.g. sarah@example.com" required>
          </div>

          <div class="form-field">
            <label for="sec-notes">Special Skin Notes / Allergies (Optional)</label>
            <textarea id="sec-notes" name="notes" rows="3" placeholder="Tell us about skin allergies, active sensitivities, or specific goals..."></textarea>
          </div>

          <div id="sec-booking-error" style="display: none; background: #FFF5F5; border: 1px solid #FEB2B2; color: #C53030; padding: 0.85rem; border-radius: 12px; font-size: 0.875rem; margin-bottom: 1.25rem;"></div>

          <button type="submit" id="sec-submit-btn" class="clay-btn" style="width: 100%; padding: 1rem;">
            Confirm &amp; Reserve Appointment
          </button>
        </form>

        <!-- Success View State -->
        <div id="sec-booking-success" style="display: none; text-align: center; padding: 2rem 1rem;">
          <div style="width: 60px; height: 60px; background: var(--color-sage-soft); color: var(--color-sage-dark); font-size: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem;">✓</div>
          <h3 style="font-size: 2rem; margin-bottom: 0.5rem; color: var(--text-main);">Appointment Reserved!</h3>
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">
            Your booking reference is <strong id="sec-success-ref" style="color: var(--color-sage-dark); font-family: monospace;"></strong>. A confirmation has been logged with our clinic concierge.
          </p>
          <div style="display: flex; flex-direction: column; gap: 0.75rem; max-width: 380px; margin: 0 auto;">
            <a id="sec-success-wa" href="#" target="_blank" class="clay-btn" style="background: #25D366; border-color: rgba(255,255,255,0.4);">
              Confirm on WhatsApp &rarr;
            </a>
            <button onclick="resetBookingForm('sectionBookingForm')" class="clay-btn clay-btn-secondary">
              Book Another Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ Accordion (6 Items) -->
  <section class="section-wrap">
    <div class="container">
      <div class="section-header">
        <span class="section-kicker">Common Questions</span>
        <h2 class="section-title">Frequently Asked Questions</h2>
        <p class="section-desc">Everything you need to know about preparing for your facial, policies, and post-care routines.</p>
      </div>

      <div class="faq-list">
        ${config.faqs
          .map(
            (faq, idx) => `
          <div class="faq-item ${idx === 0 ? 'active' : ''}">
            <button class="faq-question" onclick="toggleFaq(this)">
              <span>${escapeHtml(faq.question)}</span>
              <span class="faq-icon">+</span>
            </button>
            <div class="faq-answer">
              ${escapeHtml(faq.answer)}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  </section>

  <!-- Hours, Keyless Interactive Map & Directions -->
  <section id="hours" class="section-wrap" style="background: var(--bg-surface); border-top: 1px solid var(--border-subtle);">
    <div class="container">
      <div class="section-header">
        <span class="section-kicker">Find Us</span>
        <h2 class="section-title">Clinic Schedule &amp; Location</h2>
        <p class="section-desc">Centrally located with convenient client parking and elevator access.</p>
      </div>

      <div class="map-grid">
        <!-- Schedule & Contact Card -->
        <div style="background: var(--bg-cream); padding: 2.25rem; border-radius: 20px; border: 1px solid var(--border-subtle); display: flex; flex-direction: column;">
          <h3 style="font-size: 1.65rem; margin-bottom: 0.5rem; color: var(--text-main);">Clinic Operating Hours</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">Timezone: ${escapeHtml(config.timezone)}</p>

          <table class="hours-table">
            <tbody>
              <tr>
                <td>Monday</td>
                <td>09:00 AM – 06:00 PM</td>
              </tr>
              <tr>
                <td>Tuesday</td>
                <td>09:00 AM – 06:00 PM</td>
              </tr>
              <tr>
                <td>Wednesday</td>
                <td>09:00 AM – 06:00 PM</td>
              </tr>
              <tr>
                <td>Thursday (Late Clinic)</td>
                <td>09:00 AM – 08:00 PM</td>
              </tr>
              <tr>
                <td>Friday</td>
                <td>09:00 AM – 07:00 PM</td>
              </tr>
              <tr>
                <td>Saturday</td>
                <td>10:00 AM – 05:00 PM</td>
              </tr>
              <tr>
                <td>Sunday</td>
                <td style="color: #9B1C1C;">Closed</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-subtle);">
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.35rem;">Address:</div>
            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">${escapeHtml(config.address)}</div>

            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <a href="${dirLink}" target="_blank" rel="noopener noreferrer" class="clay-btn clay-btn-sm">
                Get Directions &rarr;
              </a>
              <a href="${telLink}" class="clay-btn clay-btn-secondary clay-btn-sm">
                Call Clinic
              </a>
            </div>
          </div>
        </div>

        <!-- Embedded Keyless Map Iframe -->
        <div class="map-iframe-wrap">
          <iframe
            width="100%"
            height="100%"
            frameborder="0"
            scrolling="no"
            marginheight="0"
            marginwidth="0"
            title="Clinic Location Map"
            loading="lazy"
            src="https://maps.google.com/maps?q=${encodeURIComponent(config.mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed"
            style="border:0; min-height: 400px; width: 100%; height: 100%;">
          </iframe>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <h3 style="font-size: 1.85rem; color: #FFFFFF; margin-bottom: 0.75rem;">${escapeHtml(config.name)}</h3>
          <p style="font-size: 0.9rem; color: rgba(255,255,255,0.7); max-width: 320px; line-height: 1.6; margin-bottom: 1.5rem;">
            ${escapeHtml(config.subheading)}
          </p>
          <div style="display: flex; gap: 1rem;">
            <a href="${config.social.instagram}" target="_blank" rel="noopener noreferrer" style="font-size: 0.85rem;">Instagram</a>
            <a href="${config.social.facebook}" target="_blank" rel="noopener noreferrer" style="font-size: 0.85rem;">Facebook</a>
            <a href="${config.googleReviewsUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.85rem;">Google Reviews</a>
          </div>
        </div>

        <div>
          <h4 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1.25rem;">Treatments</h4>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.875rem;">
            ${config.services.slice(0, 5).map((s) => `<li><a href="#services">${escapeHtml(s.title)}</a></li>`).join('')}
          </ul>
        </div>

        <div>
          <h4 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1.25rem;">Contact</h4>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.875rem;">
            <li><a href="${telLink}">${escapeHtml(config.phone)}</a></li>
            <li><a href="${waLink}" target="_blank">WhatsApp Direct</a></li>
            <li><a href="${mailLink}">${escapeHtml(config.email)}</a></li>
            <li><a href="${dirLink}" target="_blank">Get Directions</a></li>
          </ul>
        </div>

        <div>
          <h4 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1.25rem;">Management</h4>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.875rem;">
            <li><a href="/admin">Staff Login Portal</a></li>
            <li><a href="/robots.txt">Robots.txt</a></li>
            <li><a href="/sitemap.xml">Sitemap.xml</a></li>
          </ul>
        </div>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.12); padding-top: 2rem; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; font-size: 0.8rem; color: rgba(255,255,255,0.5);">
        <div>&copy; ${new Date().getFullYear()} ${escapeHtml(config.name)}. All rights reserved. Clinical treatments subject to medical consultation.</div>
        <div>White-label skin care architecture.</div>
      </div>
    </div>
  </footer>

  <!-- 5 Actions Floating Glass Dock (Bottom bar on mobile, side rail on desktop) -->
  <aside class="floating-dock" aria-label="Quick Actions">
    <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="dock-btn" title="Chat on WhatsApp">
      <span style="font-size: 1.15rem;">💬</span>
      <span class="dock-label">WhatsApp</span>
    </a>
    <a href="${telLink}" class="dock-btn" title="Call Clinic">
      <span style="font-size: 1.15rem;">📞</span>
      <span class="dock-label">Call</span>
    </a>
    <a href="${mailLink}" class="dock-btn" title="Email Us">
      <span style="font-size: 1.15rem;">✉️</span>
      <span class="dock-label">Email</span>
    </a>
    <a href="${dirLink}" target="_blank" rel="noopener noreferrer" class="dock-btn" title="Google Maps Directions">
      <span style="font-size: 1.15rem;">📍</span>
      <span class="dock-label">Directions</span>
    </a>
    <button onclick="openBookingModal()" class="dock-btn dock-btn-primary" title="Book Appointment">
      <span style="font-size: 1.15rem;">📅</span>
      <span class="dock-label">Book</span>
    </button>
  </aside>

  <!-- Interactive Booking Modal -->
  <div id="bookingModal" class="modal-overlay" onclick="if(event.target === this) closeBookingModal()">
    <div class="modal-card">
      <button class="modal-close" onclick="closeBookingModal()" aria-label="Close dialog">&times;</button>
      <div style="margin-bottom: 1.5rem;">
        <span class="section-kicker">Instant Reservation</span>
        <h2 style="font-size: 1.85rem; color: var(--text-main);">Book Your Treatment</h2>
      </div>

      <form id="modalBookingForm" onsubmit="handleBookingSubmit(event, 'modalBookingForm')">
        <input type="text" name="hp_website" style="display: none !important;" tabindex="-1" autocomplete="off">

        <div class="form-grid-2">
          <div class="form-field">
            <label for="modal-service">Treatment Service</label>
            <select id="modal-service" name="serviceId" required onchange="handleServiceChange(this.value)">
              <option value="">Select a treatment...</option>
              ${config.services
                .map(
                  (s) => `
                <option value="${s.id}">${escapeHtml(s.title)} (${priceFormatter.format(s.price)})</option>
              `
                )
                .join('')}
            </select>
          </div>

          <div class="form-field">
            <label for="modal-date">Date</label>
            <input type="date" id="modal-date" name="date" required onchange="fetchAvailableSlots(this.value, 'modal-slots-container', 'modal-timeSlot-input')">
          </div>
        </div>

        <div class="form-field">
          <label>Available Slots</label>
          <input type="hidden" id="modal-timeSlot-input" name="timeSlot" required>
          <div id="modal-slots-container" class="slots-grid">
            <div style="grid-column: 1 / -1; padding: 0.75rem; text-align: center; color: var(--text-muted); font-size: 0.85rem; background: var(--bg-cream); border-radius: 8px;">
              Select a date to view available time slots.
            </div>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-field">
            <label for="modal-name">Full Name</label>
            <input type="text" id="modal-name" name="clientName" placeholder="Full name" required>
          </div>
          <div class="form-field">
            <label for="modal-phone">Phone</label>
            <input type="tel" id="modal-phone" name="clientPhone" placeholder="+1 555 0192" required>
          </div>
        </div>

        <div class="form-field">
          <label for="modal-email">Email</label>
          <input type="email" id="modal-email" name="clientEmail" placeholder="your@email.com" required>
        </div>

        <div class="form-field">
          <label for="modal-notes">Skin Notes / Allergies</label>
          <textarea id="modal-notes" name="notes" rows="2" placeholder="Any medical conditions or skin concerns..."></textarea>
        </div>

        <div id="modal-booking-error" style="display: none; background: #FFF5F5; border: 1px solid #FEB2B2; color: #C53030; padding: 0.75rem; border-radius: 10px; font-size: 0.85rem; margin-bottom: 1rem;"></div>

        <button type="submit" id="modal-submit-btn" class="clay-btn" style="width: 100%; padding: 0.9rem;">
          Confirm Booking
        </button>
      </form>

      <!-- Modal Success Screen -->
      <div id="modal-booking-success" style="display: none; text-align: center; padding: 1.5rem 0.5rem;">
        <div style="width: 54px; height: 54px; background: var(--color-sage-soft); color: var(--color-sage-dark); font-size: 1.85rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">✓</div>
        <h3 style="font-size: 1.85rem; margin-bottom: 0.5rem; color: var(--text-main);">Appointment Confirmed</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">
          Your reference: <strong id="modal-success-ref" style="color: var(--color-sage-dark); font-family: monospace;"></strong>
        </p>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <a id="modal-success-wa" href="#" target="_blank" class="clay-btn" style="background: #25D366; border-color: rgba(255,255,255,0.4);">
            Confirm on WhatsApp &rarr;
          </a>
          <button onclick="closeBookingModal()" class="clay-btn clay-btn-secondary">
            Done
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Client-side Scripts -->
  <script>
    // 1. Minimum Date Guard (Prevent past dates)
    const todayIso = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(inp => {
      inp.min = todayIso;
    });

    // 2. Modal Controls
    function openBookingModal(preselectedServiceId) {
      const modal = document.getElementById('bookingModal');
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (preselectedServiceId) {
        const select = document.getElementById('modal-service');
        if (select) select.value = preselectedServiceId;
      }
    }

    function closeBookingModal() {
      const modal = document.getElementById('bookingModal');
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    function selectServiceAndBook(serviceId) {
      openBookingModal(serviceId);
    }

    // 3. FAQ Accordion Toggle
    function toggleFaq(btn) {
      const item = btn.closest('.faq-item');
      const wasActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      if (!wasActive) {
        item.classList.add('active');
      }
    }

    // 4. Fetch Available Slots for Date
    async function fetchAvailableSlots(date, containerId, hiddenInputId) {
      const container = document.getElementById(containerId);
      const hiddenInput = document.getElementById(hiddenInputId);
      hiddenInput.value = '';

      if (!date) {
        container.innerHTML = '<div style="grid-column: 1 / -1; padding: 0.75rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Select a date to view slots.</div>';
        return;
      }

      container.innerHTML = '<div style="grid-column: 1 / -1; padding: 0.75rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Loading available slots...</div>';

      try {
        const res = await fetch('/api/available-slots?date=' + encodeURIComponent(date));
        const data = await res.json();

        if (data.closed) {
          container.innerHTML = '<div style="grid-column: 1 / -1; padding: 0.75rem; text-align: center; color: #DC2626; font-size: 0.85rem;">The clinic is closed on this day. Please select another date.</div>';
          return;
        }

        if (!data.slots || data.slots.length === 0) {
          container.innerHTML = '<div style="grid-column: 1 / -1; padding: 0.75rem; text-align: center; color: #D97706; font-size: 0.85rem;">No appointments available for this date.</div>';
          return;
        }

        container.innerHTML = '';
        data.slots.forEach(slotObj => {
          const chip = document.createElement('div');
          chip.className = 'slot-chip ' + (slotObj.available ? '' : 'disabled');
          chip.textContent = slotObj.slot;

          if (slotObj.available) {
            chip.onclick = () => {
              container.querySelectorAll('.slot-chip').forEach(c => c.classList.remove('selected'));
              chip.classList.add('selected');
              hiddenInput.value = slotObj.slot;
            };
          } else {
            chip.title = 'Slot already booked';
          }
          container.appendChild(chip);
        });
      } catch (err) {
        container.innerHTML = '<div style="grid-column: 1 / -1; padding: 0.75rem; text-align: center; color: #DC2626; font-size: 0.85rem;">Error loading appointment slots. Please try again.</div>';
      }
    }

    // 5. Booking Form Submission Handler
    async function handleBookingSubmit(e, formId) {
      e.preventDefault();
      const form = document.getElementById(formId);
      const isModal = formId === 'modalBookingForm';
      const errorDiv = document.getElementById(isModal ? 'modal-booking-error' : 'sec-booking-error');
      const submitBtn = document.getElementById(isModal ? 'modal-submit-btn' : 'sec-submit-btn');

      errorDiv.style.display = 'none';
      errorDiv.textContent = '';

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      if (!payload.timeSlot) {
        errorDiv.textContent = 'Please choose an available appointment time slot.';
        errorDiv.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Reserving Appointment...';

      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to submit booking');
        }

        // Show Success
        form.style.display = 'none';
        const successBox = document.getElementById(isModal ? 'modal-booking-success' : 'sec-booking-success');
        const refSpan = document.getElementById(isModal ? 'modal-success-ref' : 'sec-success-ref');
        const waBtn = document.getElementById(isModal ? 'modal-success-wa' : 'sec-success-wa');

        refSpan.textContent = data.bookingRef;
        waBtn.href = data.whatsAppUrl;
        successBox.style.display = 'block';
      } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isModal ? 'Confirm Booking' : 'Confirm & Reserve Appointment';
      }
    }

    function resetBookingForm(formId) {
      const isModal = formId === 'modalBookingForm';
      const form = document.getElementById(formId);
      const successBox = document.getElementById(isModal ? 'modal-booking-success' : 'sec-booking-success');
      form.reset();
      form.style.display = 'block';
      successBox.style.display = 'none';
    }

    // 6. Smooth Animated Number Counters (easeOutCubic over 1.8s)
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animateNumber(element, target, duration, decimals = 0, suffix = '') {
      const startTime = performance.now();
      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = target * easeOutCubic(progress);
        element.textContent = current.toFixed(decimals) + suffix;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          element.textContent = target.toFixed(decimals) + suffix;
        }
      }
      requestAnimationFrame(step);
    }

    // IntersectionObserver to trigger counting & progress bars
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Number counters
            const targets = entry.target.querySelectorAll('[data-count-target]');
            targets.forEach(el => {
              const val = parseFloat(el.getAttribute('data-count-target'));
              const dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
              const suf = el.getAttribute('data-suffix') || '';
              animateNumber(el, val, 1800, dec, suf);
            });

            // Distribution bars
            const bars = entry.target.querySelectorAll('[data-progress-width]');
            bars.forEach(b => {
              const width = b.getAttribute('data-progress-width');
              b.style.width = width;
            });

            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll('.trust-strip, .google-card').forEach(sec => {
      observer.observe(sec);
    });
  </script>
</body>
</html>`;
}

// ============================================================================
// LOCAL SERVER LISTEN & VERCEL EXPORT
// ============================================================================
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Lumina Skin Clinic] Application listening on http://localhost:${PORT}`);
    console.log(`[Lumina Skin Clinic] Public site: http://localhost:${PORT}`);
    console.log(`[Lumina Skin Clinic] Admin dashboard: http://localhost:${PORT}/admin`);
  });
}

module.exports = app;
