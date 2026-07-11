# EasyPDF Product Roadmap 2026

> **Last Updated:** July 11, 2026  
> **Status:** 26 Tools Live ✅ (2 coming soon)
>
> ℹ️ **Note on this doc:** The "what's shipped" sections below are kept in sync
> with the tool registry (`src/lib/constants.ts`) and git history. The
> forward-looking strategy sections (monetization, MAU/NPS targets, revenue
> projections) are aspirational and have **not** been re-validated since the
> January baseline — treat them as directional, not current.

## 🆕 Recently Shipped (H1 2026)

Since the January baseline, the tool count more than doubled (12 → 26). Notably,
several features the old roadmap slotted behind "requires backend infrastructure"
(Phase 4) shipped **client-side**, and Phase 5's OCR landed early:

- **Document conversion suite** — PDF ⇄ Word, PDF ⇄ Excel, PDF → PowerPoint,
  Word/Excel/Photo → PDF (all client-side; no backend required)
- **OCR PDF** — text recognition (Phase 5.1, shipped early)
- **Redact PDF** — manual redaction with verified text removal (security)
- **Sign PDF** — signature placement
- **Batch Process** — chain operations across many files (PR #17), with a
  pipeline engine; follow-on pipeline work ("Sub-project 2") is scoped
- **Add Text / Add Image / Edit Metadata / Organize PDF** — editing suite (Phase 3.1)
- **Mobile usability** — sticky action bar, touch-aware uploader with camera
  capture, 44px hit targets across all tools (PR #18)

## 📊 User Engagement Research

Based on industry analysis of top PDF tools (Adobe, Smallpdf, PDFCandy, iLovePDF):

### Most Used Features (Industry Data)
1. **PDF Merge** - 32% of users (✅ Implemented)
2. **PDF to Image** - 18% of users (✅ Implemented)
3. **Compress PDF** - 15% of users (✅ Implemented)
4. **Split PDF** - 12% of users (✅ Implemented)
5. **PDF Edit** - 9% of users (✅ Implemented - text, image, watermark, pages, metadata)
6. **Convert to Word** - 6% of users (✅ Implemented - client-side, no backend)
7. **Sign PDF** - 4% of users (✅ Implemented)
8. **OCR** - 2% of users (✅ Implemented - client-side)
9. **Form Fill** - 1.5% of users (❌ Not implemented)
10. **Other Tools** - 0.5% combined

### User Retention Drivers
- **Privacy Concerns:** 78% prefer client-side processing ✅
- **Speed:** 65% abandon if takes >5 seconds ✅
- **Mobile Use:** 45% access from mobile devices ✅
- **Recurring Users:** 34% return within 7 days
- **Feature Discovery:** 22% use more than one tool per visit

## 🎯 Current Status

**26 tools live** across 5 categories (source of truth: `src/lib/constants.ts`).
All processing is client-side.

### ✅ Live Tools by Category

- **Organize (5):** Merge PDF · Split PDF · Rotate PDF · Organize PDF · Batch Process
- **Convert (9):** PDF to Image · Image to PDF · Word to PDF · PDF to Word · Excel to PDF · PDF to Excel · PDF to PowerPoint · Photo to PDF · OCR PDF
- **Edit (8):** Add Watermark · Add Page Numbers · Remove Pages · Extract Pages · Edit Metadata · Add Text to PDF · Add Image to PDF · Sign PDF
- **Security (3):** Protect PDF · Unlock PDF · Redact PDF
- **Optimize (1):** Compress PDF

### 🔜 Coming Soon (registry `comingSoon: true`)

- Edit PDF · Repair PDF

### 🎨 Infrastructure Complete
- ✅ Zustand State Management
- ✅ Toast Notification System
- ✅ Dark Mode with Persistence
- ✅ Next.js Image Optimization
- ✅ Responsive + Mobile-Optimized Design (sticky action bar, touch targets, camera capture)
- ✅ PWA Support (`@ducanh2912/next-pwa`)
- ✅ Legal Pages (Privacy, Terms, Contact, Disclaimer)
- ✅ Settings Page
- ✅ Comprehensive Documentation (Wiki)
- ✅ Automated FTPS Deploy to Hostinger (GitHub Actions)

---

## 🗺️ Product Roadmap

### Phase 2: Enhanced User Experience (Q1 2026)
**Goal:** Improve retention from 34% to 50%

#### 2.1 State Management Integration (2 weeks)
- [x] **Settings Page** ✅ Shipped — UI for managing preferences
  - Priority: High | Effort: Low | Impact: High
  - User Demand: 40% want customization options
- [ ] **Recent Activity Dashboard** - Show last operations on homepage
  - Priority: High | Effort: Low | Impact: Medium
  - User Demand: 28% want to track their work
- [ ] **Usage Statistics** - Visual analytics of tool usage
  - Priority: Medium | Effort: Medium | Impact: Low
  - User Demand: 15% interested in insights

#### 2.2 UX Improvements (3 weeks)
- [x] **Batch Processing** ✅ Shipped (PR #17) — chain operations across many files, with pipeline engine
  - Priority: Very High | Effort: Medium | Impact: Very High
  - User Demand: 52% request this feature
  - Expected: +25% conversion rate
  - Follow-on: pipeline "Sub-project 2" scoped
- [ ] **Keyboard Shortcuts** - Power user features
  - Priority: Medium | Effort: Low | Impact: Medium
  - User Demand: 18% power users
- [ ] **Tool Search/Filter** - Quick find tools
  - Priority: Medium | Effort: Low | Impact: Medium
  - User Demand: 22% struggle with navigation
- [ ] **Progressive Web App (PWA)** - Install as app
  - Priority: High | Effort: Low | Impact: High
  - User Demand: 35% want offline access

**Estimated Impact:** +15% user retention, +20% engagement

---

### Phase 3: Advanced PDF Tools (Q2 2026)
**Goal:** Increase feature usage from 1.2 to 2.5 tools per visit

#### 3.1 PDF Editing Suite (4 weeks)
- [x] **PDF Metadata Editor** ✅ Shipped — Edit title, author, keywords
  - Priority: Medium | Effort: Low | Impact: Medium
  - User Demand: 12% need this
- [x] **Add Text to PDF** ✅ Shipped — Insert text boxes
  - Priority: High | Effort: High | Impact: High
  - User Demand: 31% request this
- [x] **Add Images to PDF** ✅ Shipped — Insert images anywhere
  - Priority: High | Effort: Medium | Impact: High
  - User Demand: 27% request this
- [ ] **PDF Highlighter** - Highlight text
  - Priority: Low | Effort: Medium | Impact: Low
  - User Demand: 8% need this

#### 3.2 Measurement & Comparison (3 weeks)
- [ ] **Page Counter** - Word/character count per page
  - Priority: Low | Effort: Low | Impact: Low
  - User Demand: 6% need this
- [ ] **PDF Comparison** - Visual diff between PDFs
  - Priority: Low | Effort: High | Impact: Medium
  - User Demand: 5% (mainly business users)

**Estimated Impact:** +18% feature discovery, +12% power user retention

---

### Phase 4: Conversion Tools (Q3 2026) — ✅ Largely Shipped
**Goal:** Capture 6% user demand for document conversion

✅ **Update:** The conversion suite shipped **client-side** — the original
"requires backend infrastructure" assumption did not hold. Phase 4.1
(serverless functions, S3, etc.) was **not** needed and is deprioritized.

#### 4.1 Server-Side API Setup (2 weeks)
- [ ] **Serverless Functions** - Vercel/AWS Lambda
- [ ] **File Storage** - Temporary S3 buckets (auto-delete)
- [ ] **Rate Limiting** - Prevent abuse
- [ ] **Usage Tracking** - Monitor costs

#### 4.2 Document Conversion (6 weeks)
- [x] **PDF to Word** (.docx output) ✅ Shipped
  - Priority: Very High | Effort: High | Impact: Very High
  - User Demand: 42% top requested feature
  - **Commercial Value:** Top monetization opportunity
- [x] **PDF to Excel** (.xlsx output) ✅ Shipped
  - Priority: High | Effort: High | Impact: High
  - User Demand: 18% (business users)
- [x] **PDF to PowerPoint** (.pptx output) ✅ Shipped
  - Priority: Medium | Effort: High | Impact: Medium
  - User Demand: 8% (educators)
- [x] **Word/Excel to PDF** (reverse) ✅ Shipped (Word to PDF, Excel to PDF)
  - Priority: High | Effort: Medium | Impact: High
  - User Demand: 24% need this

**Estimated Impact:** +35% new users, potential premium tier

---

### Phase 5: AI & OCR Features (Q4 2026)
**Goal:** Differentiate from competitors with AI

⚠️ **Note:** Requires AI/ML infrastructure & API costs

#### 5.1 OCR & Text Recognition (8 weeks)
- [x] **OCR Engine Integration** ✅ Shipped (client-side) — OCR PDF tool
  - Priority: High | Effort: Very High | Impact: Very High
  - User Demand: 22% need text extraction
  - **Use Case:** Scanned documents, images with text
- [ ] **Searchable PDF** - Make scanned PDFs searchable
  - Priority: High | Effort: High | Impact: High
  - User Demand: 19% need this
- [ ] **Text Translation** - Translate PDF text
  - Priority: Medium | Effort: High | Impact: Medium
  - User Demand: 12% need this

#### 5.2 AI-Powered Features (10 weeks)
- [ ] **AI Summarization** - Summarize PDF content
  - Priority: High | Effort: Very High | Impact: High
  - User Demand: 28% interested (growing trend)
- [ ] **Smart Compression** - AI-based optimization
  - Priority: Low | Effort: High | Impact: Low
  - User Demand: 8% care about quality
- [ ] **Auto-Redaction** - Detect & redact sensitive info (AI-based)
  - Priority: Medium | Effort: Very High | Impact: Medium
  - User Demand: 14% (lawyers, HR)
  - Note: **manual** Redact PDF already shipped (verified text removal); this
    item is the AI auto-detection layer on top of it

**Estimated Impact:** +40% enterprise users, premium pricing potential

---

### Phase 6: Collaboration & Cloud (2027)
**Goal:** Enable team workflows

#### 6.1 Cloud Integration (6 weeks)
- [ ] **Google Drive** - Save/load directly
  - Priority: Very High | Effort: Medium | Impact: Very High
  - User Demand: 48% use Google Drive
- [ ] **Dropbox** - Save/load directly
  - Priority: High | Effort: Medium | Impact: Medium
  - User Demand: 22% use Dropbox
- [ ] **OneDrive** - Save/load directly
  - Priority: Medium | Effort: Medium | Impact: Low
  - User Demand: 15% use OneDrive

#### 6.2 Sharing & Collaboration (8 weeks)
- [ ] **Share Links** - Temporary file sharing (24h)
  - Priority: High | Effort: High | Impact: High
  - User Demand: 32% want to share results
- [ ] **Comments & Annotations** - Collaborative review
  - Priority: Medium | Effort: Very High | Impact: High
  - User Demand: 18% (business teams)
- [ ] **Real-time Collaboration** - Multi-user editing
  - Priority: Low | Effort: Very High | Impact: Medium
  - User Demand: 8% (niche use case)

**Estimated Impact:** +25% business users, team plan potential

---

### Phase 7: Platform Expansion (2027)
**Goal:** Reach users wherever they are

#### 7.1 Browser Extension (8 weeks)
- [ ] **Chrome Extension** - Context menu integration
  - Priority: High | Effort: Medium | Impact: Very High
  - User Demand: 38% want quick access
  - **Distribution:** Chrome Web Store
- [ ] **Firefox/Edge** - Multi-browser support
  - Priority: Medium | Effort: Low | Impact: Medium
  - User Demand: 15% combined

#### 7.2 Mobile Apps (16 weeks)
- [ ] **Progressive Web App (PWA)** - Install on mobile
  - Priority: Very High | Effort: Low | Impact: Very High
  - User Demand: 45% mobile users
- [ ] **React Native App** - iOS & Android
  - Priority: Medium | Effort: Very High | Impact: High
  - User Demand: 28% prefer native apps

#### 7.3 Desktop App (12 weeks)
- [ ] **Electron App** - Windows/Mac/Linux
  - Priority: Low | Effort: High | Impact: Medium
  - User Demand: 12% want offline app

**Estimated Impact:** +60% reach, +30% mobile conversions

---

## 💰 Monetization Opportunities

### Freemium Model (Recommended)
**Free Tier:**
- All 12 current tools
- 5 files per day limit
- Max 10 MB file size

**Premium ($9.99/month or $79/year):**
- Unlimited files
- No file size limit
- Batch processing
- PDF to Word/Excel
- OCR & AI features
- Priority processing
- No ads

**Business ($29/month per user):**
- All Premium features
- Cloud storage integration
- Team collaboration
- Admin dashboard
- API access
- Custom branding

**Enterprise (Custom pricing):**
- On-premise deployment
- SSO integration
- Dedicated support
- SLA guarantees
- Custom integrations

### Expected Revenue (Conservative)
- **Users:** 10,000 MAU by Q4 2026
- **Conversion Rate:** 3% to Premium
- **MRR:** 300 × $9.99 = $2,997/month
- **ARR:** ~$36,000 first year

---

## 📈 Success Metrics

### Current Baseline
- **MAU:** ~100 (just launched)
- **Tools/Visit:** 1.2 average
- **Retention (7-day):** 34%
- **Mobile Traffic:** 45%
- **Avg Session:** 4.2 minutes

### 2026 Targets
| Metric | Q1 | Q2 | Q3 | Q4 |
|--------|----|----|----|----|
| MAU | 500 | 2K | 5K | 10K |
| Tools/Visit | 1.5 | 2.0 | 2.5 | 3.0 |
| Retention | 40% | 45% | 50% | 55% |
| Premium Conv. | - | - | 2% | 3% |
| NPS Score | 50 | 60 | 70 | 75 |

---

## 🚀 Quick Wins (from Jan planning — status as of Jul 2026)

Priority fixes based on user testing:

1. ✅ **Settings Page** - Let users customize defaults *(shipped)*
2. ⬜ **Recent Activity** - Show on homepage *(not shipped)*
3. ✅ **Batch Upload** - Process multiple files *(shipped, PR #17)*
4. ✅ **PWA Support** - Enable installation *(shipped)*
5. ⬜ **Keyboard Shortcuts** - Add power user features *(not shipped)*

**Remaining quick wins:** Recent Activity, Keyboard Shortcuts

---

## 📚 Research Sources

- **Adobe Document Cloud:** Usage analytics (2025 report)
- **Smallpdf:** 2M+ daily users, feature popularity
- **iLovePDF:** Open-source repo insights
- **Google Trends:** PDF tool search volume
- **Reddit r/productivity:** User pain points (500+ threads analyzed)
- **Product Hunt:** Top PDF tool reviews & feedback
- **HackerNews:** 12 PDF tool discussions (2024-2025)

---

## 🎯 Decision Framework

Use this matrix to prioritize features:

| Category | User Demand | Effort | Impact | Priority |
|----------|-------------|--------|--------|----------|
| **Critical** | >30% | Low-Med | High | Do Now |
| **High** | 15-30% | Any | Med-High | Plan Q1-Q2 |
| **Medium** | 5-15% | Low | Any | Backlog |
| **Low** | <5% | Any | Any | Consider |

---

**Next Review:** October 1, 2026  
**Owner:** Product Team  
**Feedback:** [GitHub Discussions](https://github.com/ez-biz/easy-pdf/discussions)
