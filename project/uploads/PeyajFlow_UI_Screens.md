# PeyajFlow — UI Screens Specification

**Scope:** every screen needed for the FutureMakers 2026 pitch demo.
**Product:** PeyajFlow, one onion marketplace where farmers, middlemen and buyers meet, see a fair price, and close deals directly.
**Pitch features:** (1) Smart Price, (2) Direct Deal.

---

## 1. Screen Inventory

| ID | Screen | User | Story scene | Feature | Priority |
| --- | --- | --- | --- | --- | --- |
| S01 | Login | All | 1 | — | Must |
| S02 | Role selection | All | 1 | — | Must |
| F01 | Farmer home | Farmer | 2 | Smart Price | Must |
| F02 | Photo grade (camera) | Farmer | 2 | Smart Price | Must |
| F03 | Grade result | Farmer | 2 | Smart Price | Must |
| F04 | Post stock | Farmer | 3 | Direct Deal | Must |
| B01 | Post demand | Buyer | 3 | Direct Deal | Must |
| M01 | Nearby stock and orders | Middleman | 3 | Direct Deal | Must |
| M02 | Combine and offer | Middleman | 3 | Direct Deal | Must |
| F05 | Offer received | Farmer | 4 | Direct Deal | Must |
| P01 | SMS mock-up (basic phone) | Farmer | 4 | Direct Deal | Must |
| D01 | Deal done | All | 4 | Direct Deal | Must |
| F06 | Price alert | Farmer | 5 | Smart Price | Must |
| B02 | Buyer orders | Buyer | 3–4 | Direct Deal | Nice to have |

Total: 13 must-have screens, 1 optional.

---

## 2. Demo Flow

```
S01 Login → S02 Role
   ├─ Farmer:    F01 Home → F02 Camera → F03 Grade → F04 Post stock
   │                                                   ↓
   ├─ Buyer:     B01 Post demand ─────────────────→ (match)
   │                                                   ↓
   ├─ Middleman: M01 Nearby stock & orders → M02 Combine & offer
   │                                                   ↓
   └─ Farmer:    F05 Offer received  (or P01 SMS on a basic phone)
                                                       ↓
                 D01 Deal done (all roles) → … 4 weeks later … → F06 Price alert
```

Presentation order on stage: S01 → S02 → F01 → F02 → F03 → F04 → B01 → M01 → M02 → F05 → P01 → D01 → F06.

---

## 3. Design Basics

| Item | Rule |
| --- | --- |
| Platform | Mobile app frames (360 × 800); one web frame optional for buyer |
| Language | Bangla first, English toggle in the header |
| Units | Maund (মণ) and taka (৳) on farmer screens; tonnes allowed for buyers |
| Colours | Primary onion purple `#5B2A6E`; accent leaf green `#2E7D32` (good / rising); amber `#F9A825` (wait); red `#C62828` (alerts only); background `#FAF7FB` |
| Type | Bangla: Hind Siliguri or Noto Sans Bengali; English: Inter. Body 16 px minimum on farmer screens |
| Buttons | Full-width primary button at the bottom, 52 px tall; one primary action per screen |
| Icons | Always paired with a text label; colour never carries meaning alone |
| AI output | Every AI result shows the value, a short reason and a confidence label (High / Medium) |

**Sample data (use the same numbers on every screen):**

| Field | Value |
| --- | --- |
| Farmer | Karim Mia, Santhia, Pabna, 01711-XXXXXX |
| Stock | 100 maunds total; 40 posted now, 60 kept |
| Trader's offer (before PeyajFlow) | ৳1,000 / maund |
| Fair price today | ৳1,250–1,350 / maund |
| Grade | A (large, dry neck, no sprouting) |
| Middleman | Rahim Bepari, Sujanagar, Pabna |
| Buyer | Nadia Rahman, Karwan Bazar wholesaler, Dhaka; needs 5 tonnes (≈134 maunds), Grade A |
| Offer | ৳1,300 / maund × 40 maunds = ৳52,000 |
| Later price | ৳1,650 / maund (4 weeks later) |

---

## 4. Screen Specifications

### S01 — Login

**Purpose:** sign in with a phone number; no passwords.

| Element | Content |
| --- | --- |
| Logo + tagline | PeyajFlow — "ন্যায্য দামে পেঁয়াজ, সরাসরি" (Fair price, direct) |
| Input | Mobile number, +88 prefix fixed |
| Button | "OTP পাঠান" (Send OTP) |
| OTP step | 4 boxes, auto-read; "Resend in 30s" |
| Footer | Language toggle বাংলা / EN |

**States:** wrong OTP shows inline red text; loading spinner on the button.

---

### S02 — Role Selection

**Purpose:** one app, three roles.

| Element | Content |
| --- | --- |
| Title | "আপনি কে?" (Who are you?) |
| Cards (3, large, icon + label + one line) | **কৃষক / Farmer** — sell your onions at a fair price · **ব্যাপারী / Middleman** — find stock and fill orders · **ক্রেতা / Buyer** — buy graded onions directly |
| Button | "শুরু করুন" (Start) |

**Note:** selected card gets a purple border and tick.

---

### F01 — Farmer Home (Smart Price)

**Purpose:** answer "what is my onion worth today, and should I sell?" in one glance.

| Zone | Content |
| --- | --- |
| Header | "আসসালামু আলাইকুম, করিম ভাই" · location chip "সাঁথিয়া, পাবনা" |
| Price card (hero) | Today's fair price **৳1,250–1,350 / মণ** · small trend arrow ↑ · "Yesterday ৳1,220" |
| Advice card | Amber badge **"অপেক্ষা করুন" (Wait)** · "আগামী ৩–৪ সপ্তাহে দাম বাড়তে পারে" (Price may rise in 3–4 weeks) · suggestion: "৪০ মণ এখন বিক্রি, ৬০ মণ রাখুন" (Sell 40 now, keep 60) · confidence: High |
| Mini chart | 6-week price line: 4 weeks past (solid), 2 weeks forecast (dashed band) |
| My stock | "আমার মজুদ: ১০০ মণ" with a "Grade" button |
| Primary button | "📷 পেঁয়াজের ছবি তুলুন" (Photograph onions) → F02 |
| Secondary button | "বিক্রির জন্য দিন" (Post for sale) → F04 |
| Bottom nav | Home · My stock · Offers (badge) · Profile |

**States:** advice can be green "এখন বিক্রি করুন" (Sell now) / amber "অপেক্ষা করুন" (Wait) / split "আংশিক বিক্রি" (Sell part).

---

### F02 — Photo Grade (Camera)

**Purpose:** capture a sample for AI grading.

| Element | Content |
| --- | --- |
| Camera view | Full screen with a dashed circular guide |
| Guide text | "১০–১৫টি পেঁয়াজ একসাথে রেখে ছবি তুলুন" (Place 10–15 onions together) |
| Counter | "ছবি ১/৩" (Photo 1 of 3) |
| Controls | Shutter button, gallery, flash |
| After 3 photos | "বিশ্লেষণ হচ্ছে…" (Analysing…) loader, 2 seconds → F03 |

---

### F03 — Grade Result

**Purpose:** show grade and the fair price that goes with it.

| Zone | Content |
| --- | --- |
| Photo strip | 3 thumbnails |
| Grade badge (large) | **Grade A** (green) |
| Checks (tick list) | ✓ বড় আকার (Large size) · ✓ শুকনো গলা (Dry neck) · ✓ অঙ্কুর নেই (No sprouting) · ⚠ ২% দাগ (2% spots) |
| Price for this grade | **৳1,300 / মণ** suggested · range ৳1,250–1,350 |
| Comparison line | "ব্যাপারীর প্রস্তাব ৳1,000 — ন্যায্য দামের চেয়ে ৳300 কম" (Trader offered ৳1,000 — ৳300 below fair) |
| Primary button | "বিক্রির জন্য দিন" (Post for sale) → F04 |
| Secondary | "আবার ছবি তুলুন" (Retake) |

---

### F04 — Post Stock

**Purpose:** list onions in under 30 seconds; most fields pre-filled.

| Field | Input | Pre-filled |
| --- | --- | --- |
| Quantity | Stepper in maunds | 40 মণ (from advice) |
| Grade | Read-only chip | A |
| Asking price | Editable | ৳1,300 / মণ |
| Location | Read-only | Santhia, Pabna |
| Available from | Date picker | Today |
| Pickup | Toggle: "বাড়ি থেকে নেবে" (Buyer picks up) / "হাটে দেব" (I deliver to market) | Buyer picks up |

| Element | Content |
| --- | --- |
| Summary bar | "৪০ মণ × ৳1,300 = ৳52,000" |
| Primary button | "পোস্ট করুন" (Post) |
| Success toast | "আপনার পেঁয়াজ ৩ জন ক্রেতা ও ব্যাপারী দেখছেন" (3 buyers and middlemen are viewing your onions) |

---

### B01 — Post Demand (Buyer)

**Purpose:** buyer states exactly what they need.

| Field | Input | Sample |
| --- | --- | --- |
| Quantity | Number + unit (tonnes / maunds) | 5 tonnes (≈134 maunds) |
| Grade | Chips A / B / C | A |
| Target price | Range | ৳1,250–1,350 / maund |
| Deliver to | Address | Karwan Bazar, Dhaka |
| Deliver by | Date | 7 days from today |
| Payment | Chips | bKash / Nagad / Bank |

| Element | Content |
| --- | --- |
| Live match hint | "পাবনায় ১৮০ মণ Grade A পেঁয়াজ পাওয়া যাচ্ছে" (180 maunds Grade A available in Pabna) |
| Primary button | "চাহিদা পোস্ট করুন" (Post demand) |

---

### M01 — Nearby Stock and Orders (Middleman)

**Purpose:** let the middleman see supply and demand in one place.

| Zone | Content |
| --- | --- |
| Tabs | **নিকটের মজুদ** (Nearby stock) · **ক্রেতার চাহিদা** (Buyer orders) |
| Top banner (open order) | "নাদিয়া রহমান, কারওয়ান বাজার — ৫ টন Grade A, ৳1,250–1,350, ৭ দিন" with "Fill this order" button |
| Stock list (cards) | Karim Mia — 40 মণ · A · ৳1,300 · 3 km · Rafiq — 35 মণ · A · ৳1,280 · 5 km · Selina — 30 মণ · A · ৳1,320 · 6 km · Habib — 30 মণ · A · ৳1,300 · 8 km |
| Card controls | Checkbox to select · photo thumbnail · grade badge |
| Map toggle | Pins of the same lots around Sujanagar–Santhia |
| Sticky bottom bar | "নির্বাচিত: ১৩৫ মণ — অর্ডার পূরণ ✓" (Selected: 135 maunds — order covered) + button "একসাথে অফার দিন" (Combine and offer) → M02 |

---

### M02 — Combine and Offer (Middleman)

**Purpose:** send offers to each farmer and one combined quote to the buyer.

| Zone | Content |
| --- | --- |
| Farmer offers table | Each selected farmer: quantity, offer price (editable), subtotal; Karim: 40 × ৳1,300 = ৳52,000 |
| Truck & pickup | Pickup date, truck size (one 5-tonne truck), route preview |
| Quote to buyer | Total 135 maunds · landed price ৳1,420 / maund in Dhaka · margin shown to the middleman only: ৳120 / maund |
| Primary button | "অফার পাঠান" (Send offers) |
| Confirmation | "৪ জন কৃষক ও ১ জন ক্রেতাকে অফার পাঠানো হয়েছে" (Offers sent to 4 farmers and 1 buyer) |

**Note:** farmer always sees the price offered to them; the platform never hides the farm-gate price.

---

### F05 — Offer Received (Farmer)

**Purpose:** a simple yes / no decision.

| Element | Content |
| --- | --- |
| Notification at top | "নতুন অফার!" (New offer!) |
| Offer card | From **রহিম ব্যাপারী**, Sujanagar · ✓ Verified · 4.7★ (32 deals) |
| Deal line | **৪০ মণ × ৳1,300 = ৳52,000** |
| Fair price check | Green chip "ন্যায্য দাম ✓" (Fair price — within today's range) |
| Pickup | Tomorrow, 10 AM, from home |
| Payment | bKash, on pickup |
| Buttons | Large green "গ্রহণ করুন" (Accept) · outline "না" (Decline) · text link "দাম নিয়ে কথা বলুন" (Counter-offer) |

---

### P01 — SMS Mock-up (Basic Phone)

**Purpose:** prove the same deal works on a feature phone. Show it inside a feature-phone frame (small screen, keypad).

**SMS 1 — offer**
```
PeyajFlow: Rahim Bepari offers
Tk 1,300/mon for 40 mon
= Tk 52,000. Pickup tomorrow 10am.
Fair price today: Tk 1,250-1,350.
Reply 1 to ACCEPT, 2 to DECLINE.
```

**User reply:** `1`

**SMS 2 — confirmation**
```
PeyajFlow: Deal confirmed.
Pickup tomorrow 10am.
Tk 52,000 will be sent to
your bKash on pickup.
Ref: PF-24816
```

**Optional SMS — price alert (weekly)**
```
PeyajFlow: Onion today
Tk 1,250-1,350/mon (Santhia).
Advice: WAIT, price may rise.
Missed call 0961XXXXXXX to hear.
```

**Note:** SMS can be shown in Bangla Unicode on stage if the phone mock-up supports it; keep the English version as fallback.

---

### D01 — Deal Done

**Purpose:** close the story with money in hand. One layout, role-specific line.

| Element | Content |
| --- | --- |
| Success icon | Large green tick, light confetti |
| Title | "বিক্রি সম্পন্ন!" (Sale complete!) |
| Amount | **৳52,000 bKash-এ জমা হয়েছে** (received in bKash) |
| Gain line (farmer) | "ব্যাপারীর প্রথম প্রস্তাবের চেয়ে ৳12,000 বেশি" (৳12,000 more than the first trader offer) |
| Timeline | Offer accepted ✓ → Picked up ✓ → Paid ✓ |
| Rating | 5 stars for the other party |
| Buttons | "রসিদ দেখুন" (View receipt) · "হোমে যান" (Go home) |

**Role variants:** middleman sees "Truck full: 135 maunds delivered"; buyer sees "5 tonnes Grade A delivered to Karwan Bazar".

---

### F06 — Price Alert (4 Weeks Later)

**Purpose:** close the Smart Price loop.

| Element | Content |
| --- | --- |
| Lock-screen notification | "PeyajFlow: দাম এখন ৳1,650/মণ। বাকি ৬০ মণ বিক্রির ভালো সময়।" (Price now ৳1,650. Good time to sell your remaining 60 maunds.) |
| Tap → Farmer home | Advice card turns green "এখন বিক্রি করুন" (Sell now) · "৬০ মণ × ৳1,650 = ৳99,000" |
| Primary button | "বাকি ৬০ মণ পোস্ট করুন" (Post the remaining 60) |

**Stage line:** "Karim sold 100 maunds for ৳1,51,000 instead of ৳1,00,000."

---

### B02 — Buyer Orders (Optional)

**Purpose:** buyer tracks the order.

| Element | Content |
| --- | --- |
| Order card | 5 tonnes Grade A · status chips: Offer received → Confirmed → On the way → Delivered |
| Offer from middleman | Rahim Bepari, 135 maunds, ৳1,420 / maund landed, truck ETA |
| Buttons | Accept quote · Track truck |

---

## 5. Shared Components

| Component | Used on |
| --- | --- |
| Price card (range + trend arrow) | F01, F03, F06, P01 |
| Advice badge (Sell now / Wait / Sell part) | F01, F06 |
| Grade badge (A / B / C) | F03, F04, M01, F05 |
| Stock card (name, qty, grade, price, distance, photo) | M01 |
| Offer card (party, verified, rating, deal line, fair-price chip) | F05, B02 |
| Bottom nav (per role) | All app screens |
| Toast / success state | F04, M02, D01 |
| Feature-phone frame | P01 |

---

## 6. Build Checklist

- [ ] Set up colours, fonts and the shared components (Section 5)
- [ ] S01, S02
- [ ] F01, F02, F03 (Smart Price path)
- [ ] F04, B01, M01, M02, F05 (Direct Deal path)
- [ ] P01 feature-phone mock-up
- [ ] D01, F06 (story ending)
- [ ] Check every screen against the sample data table
- [ ] Click through the full demo flow once, in stage order
