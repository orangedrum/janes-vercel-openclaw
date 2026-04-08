---
name: email-validation-setup
description: When the user wants to set up email validation for their lead lists before sending. Use when they ask for "validation setup," "email checker," "validate my list," "Mailmeteor alternative," "email verification," "deliverability check," or "before sending email." This guide explains free/cheap alternatives since Mailmeteor is Google Sheets-only and confirms SPF/DKIM/DMARC setup.
metadata:
  version: 1.0.0
---

# Email Validation Setup Guide

Since Mailmeteor is a Google Sheets add-on (not an API), this guide covers the validation workflow using free and low-cost alternatives.

## Before You Send

**Critical:** You've already set up SPF/DKIM/DMARC. ✅ That's 70% of deliverability right there.

The remaining 30% is list quality: ensure emails are valid before sending.

### Why this matters

Each bounce hurts your sender reputation score. ISPs track:
- **Hard bounces** (invalid address): -5 reputation points each
- **Soft bounces** (server temp error): -1 point
- **Complaint rate** (user marked spam): -10 points

Send to 100 addresses with 10 invalid emails, and your reputation drops. Next batch lands in spam.

---

## Validation Workflow

### Step 1: Use the Built-in Heuristic Validator

The `email-validation` skill applies three layers:

1. **Syntactic check:**
   - Valid format (RFC 5322)
   - No obvious typos (double dots, missing @)

2. **Domain verification:**
   - DNS lookup for domain
   - Check for MX records
   - Verify domain is not on a blocklist

3. **Heuristic scoring:**
   - Pattern matching (professional domains vs free email vs typo domains)
   - Company/role confidence

**This is free and included.** Before buying any tool, try this first.

### Step 2: If You Want Real-Time SMTP Checks

Use one of these free/cheap API tools:

| Tool | Price | Accuracy | Speed | Setup |
|------|-------|----------|-------|-------|
| **Hunter** | $0 @ 50/mo | 85-90% | 100ms | Easy: API key |
| **RocketReach** | $0 @ 100/mo | 80-85% | 200ms | Easy: batch API |
| **ZeroBounce** | $0 @ 100/mo | 90-95% | 300ms | Easy: batch API |
| **Bouncer** | $0 @ 100/mo | 85-90% | 150ms | Easy: API key |
| **Mailgun** | $35/mo | 95%+ | 100ms | Moderate: requires domain |
| **SendGrid** | Free (basic) | 80-85% | 200ms | Moderate: batch CSV upload |

**Recommendation for your flow:**
- **Start:** Use the built-in heuristic validator (free)
- **Scale:** Add Hunter/RocketReach free tier (50-100 checks/month at zero cost)
- **Optimize:** If bounce rate > 3%, upgrade to ZeroBounce or Mailgun for deeper SMTP checks

### Step 3: Mailmeteor as a Manual Validation Layer (Optional)

Mailmeteor doesn't have an API, but you CAN use it as a human-in-the-loop step:

1. Export your 100-lead CSV
2. Import into a Google Sheet
3. Add Mailmeteor add-on (free tier)
4. Mailmeteor shows confidence score for each email
5. Remove low-confidence ones
6. Re-export and use for sending

**Cost:** Free ($0)
**Effort:** 5-10 minutes per 100 leads
**Benefit:** Manual validation + you see the tool's scoring logic

This is good for:
- First batches (learn what patterns work)
- High-value lists (hand-pick top prospects)
- Testing Mailmeteor before deciding if it's worth the premium

---

## Mailmeteor Google Sheets Troubleshooting

If Mailmeteor add-on isn't working in your Google Sheet:

### Common Issues & Fixes

**Issue: "Add-on not available" or "Cannot install"**
- **Fix:** Make sure you're using a personal Google account (not work/school)
- **Fix:** Clear browser cache, try incognito mode
- **Fix:** Use Chrome browser (Mailmeteor works best there)

**Issue: Add-on installs but "Verify" button doesn't work**
- **Fix:** Check if your sheet has headers in row 1
- **Fix:** Make sure email column is named "Email" or "email" (case-sensitive)
- **Fix:** Try creating a new sheet and copying data over

**Issue: "Quota exceeded" or "Rate limited"**
- **Fix:** Mailmeteor free tier = 100 verifications/day
- **Fix:** Wait 24 hours or upgrade to paid ($9/mo for 10k verifications)
- **Fix:** Split your list into smaller batches

**Issue: Shows "Unknown" for all emails**
- **Fix:** Check if emails have proper format (user@domain.com)
- **Fix:** Remove any extra spaces or special characters
- **Fix:** Try a test with known good emails first

**Issue: Add-on loads but no results appear**
- **Fix:** Make sure you have edit permissions on the sheet
- **Fix:** Try refreshing the page after installing
- **Fix:** Check if your Google account has 2FA enabled (sometimes blocks add-ons)

### Step-by-Step Mailmeteor Setup

1. **Open your Google Sheet** with the lead CSV imported
2. **Go to Extensions → Add-ons → Get add-ons**
3. **Search for "Mailmeteor"** (by Mailmeteor)
4. **Install** (free tier)
5. **Grant permissions** when prompted
6. **Refresh the page**
7. **Select your email column** (must be named "Email")
8. **Click "Verify"** in the Mailmeteor sidebar
9. **Wait** for verification to complete (can take 1-2 minutes for 100 emails)
10. **Review results** - look for "Valid", "Invalid", "Risky" scores

### If Still Not Working: Alternative Free Options

**Option 1: Hunter.io Web Interface**
- Go to hunter.io → Sign up free → Upload CSV → Download results
- 50 free checks/month

**Option 2: ZeroBounce Web Interface**  
- Go to zerobounce.net → Sign up free → Upload CSV → Download results
- 100 free checks/month

**Option 3: Manual Pattern Check**
- Look for: .edu, .gov, .org domains (usually valid)
- Avoid: gmail.com, yahoo.com, hotmail.com (consumer emails)
- Flag: anything with numbers, hyphens, or unusual TLDs

---

## Integration Path

### Immediate (Today)

1. ✅ Run `email-validation` skill on your lead batch
2. ✅ Flag anything under 70% confidence as "low quality"
3. ✅ Remove flagged emails or mark them "Test"
4. ✅ Send the batch

### Next Week (After First Results)

1. Input results to `lead-batch-testing` skill
2. Check bounce rate from your email tool
3. If < 2%: keep using heuristic validation
4. If 2-5%: add free tier Hunter or RocketReach for next batch
5. If > 5%: review list targeting (wrong titles/companies, not validation issue)

### Scale (After 3-5 Batches)

1. Once you have pattern data, consider ZeroBounce or Bouncer
2. Batch validate your entire list monthly ($35-50/mo for unlimited)
3. Removes 95% of invalid addresses before they bounce

---

## Free Validation Tools Setup

### Hunter.io (50 free checks/month)

1. Go to [hunter.io/api](https://hunter.io/api)
2. Sign up free
3. Get API key
4. Use in `email-validation` skill config: `HUNTER_API_KEY=your_key`

**Request:**
```bash
curl "https://api.hunter.io/v2/email-verifier?email=test@example.com&domain=example.com&api_key=YOUR_KEY"
```

Response: `result: valid`, `score: 98`, `reason: smtp_valid`

### RocketReach API (100 free checks/month)

1. Go to [rocketreach.co/api](https://rocketreach.co/api)
2. Sign up free
3. Get API key and workspace ID
4. Batch upload CSV, get validation results back

**Cost:** $0 for free tier; $99/mo for unlimited verified data (includes email validation)

### ZeroBounce (100 free checks)

1. Go to [zerobounce.net](https://zerobounce.net)
2. Sign up free
3. Get API key
4. Upload CSV of emails
5. Get back: valid/invalid/unknown + reason

---

## How to Integrate One

### Option A: Manual Check Before Send

1. Export your 100-lead CSV (Status = "Unsent")
2. Go to Hunter.io / ZeroBounce web UI
3. Upload CSV
4. Download results
5. Update Status column:
   - Valid → keep as "Unsent"
   - Invalid → change to "Invalid"
   - Unknown → change to "Test"
6. Re-import updated CSV
7. Send only "Unsent" rows

**Time:** 10 minutes
**Cost:** Free (up to 100-200 checks/month across all tools)

### Option B: Automated Check via Script

If you want to automate validation before each send:

1. Store your Hunter/RocketReach API key as env var: `HUNTER_API_KEY`
2. Add to the `lead-batch-create` skill automation:
   ```markdown
   For each email in the batch:
   - Call Hunter API for verification
   - Store result in 'quality' column
   - Flag invalid → Status = "Invalid"
   ```

This requires OpenClaw to have that skill extension — we can add this if you want.

---

## Troubleshooting High Bounce Rates

| Bounce Rate | Likely Cause | Fix |
|------------|--------------|-----|
| 0-2% | Normal | Nothing needed |
| 2-5% | Mixed quality list | Use email validator; remove "low" quality |
| 5-10% | Bad email discovery or validation | Recheck domain discovery; verify titles |
| 10%+ | List is wrong (wrong domain, wrong title, company size mismatch) | Not a validation issue; revisit targeting |

---

## Recommended Path for You

1. **This week:** Use built-in heuristic validator, send first batch
2. **Next week:** Check bounce rate + results
3. **If bounce < 3%:** Keep using heuristics
4. **If bounce 3-5%:** Add Hunter free tier (50/mo)
5. **If bounce > 5%:** Audit list targeting (probably not validation)

That keeps you free/very low cost while you validate the copy and targeting.

---

## SPF/DKIM/DMARC Checklist (Already Done ✅)

You mentioned these are set up. Confirm each one:

- [ ] **SPF record in DNS:** `v=spf1 include:[your-email-platform] ~all`
- [ ] **DKIM records in DNS:** Public key from your email platform
- [ ] **DMARC policy in DNS:** `v=DMARC1; p=quarantine; rua=mailto:your-email@your-domain`

These handle sender domain reputation. Email validation handles list quality. Together, they cover 95% of deliverability.
