---
name: lead-batch-create
description: When the user wants to gather and prepare a new batch of 100 verified leads for outreach. Use when they ask for "create batch," "gather 100 leads," "build lead list," "new email list," "start batch," "generate prospects," or "prepare for outreach." This skill automates lead discovery, enrichment, and CRM export template generation.
metadata:
  version: 1.0.0
---

# Lead Batch Creation

You help generate a list of 100 qualified leads with all CRM structure ready to send via the user's email system.

## Chief Strategist Note

This skill should follow the same unified strategy as the product-marketing-context guide:
- target the best-fit accounts, not the largest list
- build around a single offer and clear customer problem
- personalize with real market signals and concise hooks
- keep quality over quantity for the first round

## Before Starting

Check if `.agents/product-marketing-context.md` exists. If not, run the product-marketing-context skill first — all lead research depends on knowing your ICP, targeting criteria, and value proposition.

Once context exists:

1. **Ask for current batch parameters:**
   - What's the previous batch Template_ID? (e.g., BATCH-001-RUN-1)
   - If this is a retest or follow-up to existing feedback, ask for that feedback
   - If this is a TEST of the lead-batch-testing workflow, confirm

2. **Confirm lead discovery method:**
   - Free-first discovery (web search, LinkedIn public signals)?
   - Or paid tools if available (Clay, RocketReach, etc.)?
   - If targeting sales roles, confirm the focus is primarily **BDRs** and secondarily **SDRs**.

3. **Enforce explicit source rules for email scraping:**
   - Use Apollo free plan where possible, but only as a supplement.
   - When premium sources are unavailable, fall back to Google search and public web sources.
   - Review at least 15 pages per city for each market area.
   - Only collect individual, professional emails: no generic aliases.
   - Discard `info@`, `sales@`, `hello@`, `contact@`, `support@`, and similar.
   - Cross-check every email against existing CRM records to prevent duplicates.
   - Do not use the words `design` or `creative` in any outreach hook.

## Lead Batch Generation Workflow

### Step 1: Define Search & Qualification Criteria

From product-marketing-context and any market signals you've shared:

- **Title targets:** e.g., VP Engineering, Director of Product, Head of Growth
- **Company size:** e.g., 50-500 employees, Series A-B funded
- **Industry filters:** e.g., SaaS, MarTech, B2B software
- **Geographic:** e.g., US-based, remote-ok, specific regions
- **Additional signals:** e.g., recently hired for [role], recently raised funding, competitor users

**Create a search query:**
```
[title] at companies [size] in [industry] [geo] [signals]
Example: "VP Engineering" or "Engineering Manager" at funded SaaS companies 50-200 people in US
```

### Step 2: Discover & Enrich Leads

**Free-first discovery:**
1. LinkedIn advanced search (company pages, employee lists)
2. Company job postings (CareerPages, LinkedIn jobs, Wellfound)
3. Recent news (funding, hiring, promotions) from Crunchbase, TechCrunch, company websites
4. Job board signals (interesting problems posted = pain point signal)
5. Community participation (Slack communities, Reddit, forums)

**For each prospect found:**
- Note company name and city
- Extract website URL
- Find email (free: Hunter, RocketReach free tier, Apollo free tier, or guess+verify)
- Identify target name and title
- Note one market signal or recent event (company context, role change, etc.)

**Validate email address:**
- Run through email-validation skill
- Check for typos, common false patterns
- Flag low-confidence addresses for manual review before sending

### Step 3: Build the CRM Export Template

For all 100 leads, prepare a spreadsheet/CSV/JSON with these columns (in order):

```
Company Name | City | website URL | email address | Target Name | quality | AI personalization | Status | Assigned Account | Last Contact Date | Partner Program | Touch # | OOF retry date | Template_ID | Batch_Start_Date | Warm Responses | Meeting Requests | Redirects | Unsubscribes | Bounce Rate %
```

**Fill values:**
- Company Name: [company name]
- City: [city or region]
- website URL: [company domain]
- email address: [validated email]
- Target Name: [first and last name]
- quality: *(leave empty initially; user will assign during review)*
- AI personalization: [specific hook or angle based on market signal]
- Status: **Unsent** (always for new batch)
- Assigned Account: *(blank)*
- Last Contact Date: *(blank)*
- Partner Program: *(blank initially, user fills if known — yes or no)*
- Touch #: **1** (always for first touch)
- OOF retry date: *(blank)*
- Template_ID: **[BATCH]-001-RUN-[N]** (e.g., BATCH-001-RUN-1 for first batch, BATCH-001-RUN-2 for retest with improved copy)
- Batch_Start_Date: *(blank; user fills when they send)*
- Warm Responses: *(blank; filled after send)*
- Meeting Requests: *(blank; filled after send)*
- Redirects: *(blank; filled after send)*
- Unsubscribes: *(blank; filled after send)*
- Bounce Rate %: *(blank; filled after send)*

### Step 4: AI Personalization & Quality Scoring

**For each of the 100 leads:**

1. **AI Personalization (one-liner hook):**
   - Reference a market signal (company just hired for X role, raised funding, announced partnership, using competitor)
   - OR reference a specific problem from their industry/company size
   - Example: "Heard you hired a Growth Manager last month — scaling demand Gen?"
   - Example: "Your company uses [competitor] for X; we help teams skip the Y step entirely"

2. **Quality scoring** (user can override later):
   - **HIGH:** Decision-maker confirmed + clear market signal + easy to reach email
   - **MEDIUM:** Likely decision-maker + some signal + email confident but not verified
   - **LOW:** Proxy contact (HR, ops) or weak signal or email unverified

### Step 5: Export & Handoff

**Generate:**
1. **CSV/spreadsheet export** ready to import to user's CRM or email tool
2. **Quick summary report:**
   - Total leads: 100
   - High quality: X%
   - Medium quality: X%
   - Low quality: X%
   - Average email confidence: X/10
   - Primary industries: [list]
   - Top 3 titles: [list]
   - Template_ID: BATCH-001-RUN-1 (or appropriate number)

3. **Copy guidelines for this batch:**
   - Recommended angles based on the market signals you found
   - Top 3 subject line themes
   - Suggested opening hook (reference the most common signal found)

### Step 6: Ready to Send

**User's next steps:**
1. Review the batch (optional: adjust quality scores, personalization, or remove rows)
2. Export to your email sending tool
3. Send the batch
4. After send window (typically 5-7 days), run the `lead-batch-testing` skill
5. Provide the results (warm responses, meeting requests, redirects, unsubscribes, bounce %)
6. Get optimized copy for the next batch

---

## CRM Export Structure & Definitions

| Column | Type | Required? | Fill Value | User Can Edit? |
|--------|------|-----------|------------|----------------|
| Company Name | text | ✅ | [exact company name] | Yes |
| City | text | ✓ | [city or region] | Yes |
| website URL | text | ✅ | [company domain, https:// prefixed] | Yes |
| email address | text | ✅ | [validated email] | Yes, but revalidate |
| Target Name | text | ✅ | [first + last name] | Yes |
| quality | select | ✓ | *blank or auto-scored* | Yes |
| AI personalization | text | ✅ | [one-liner market hook] | Yes |
| Status | select | ✅ | **Unsent** | No (unless manually updating) |
| Assigned Account | text | | *(blank)* | No (leave blank) |
| Last Contact Date | date | | *(blank)* | No (leave blank) |
| Partner Program | select | | *(blank unless known)* | Yes (yes/no if known) |
| Touch # | number | ✅ | **1** | No (leave as 1) |
| OOF retry date | date | | *(blank)* | No (leave blank) |
| Template_ID | text | ✅ | [BATCH-001-RUN-1] | No (for tracking) |
| Batch_Start_Date | date | | *(blank)* | No (user fills when sending) |
| Warm Responses | number | | *(blank)* | No (user fills after send) |
| Meeting Requests | number | | *(blank)* | No (user fills after send) |
| Redirects | number | | *(blank)* | No (user fills after send) |
| Unsubscribes | number | | *(blank)* | No (user fills after send) |
| Bounce Rate % | number | | *(blank)* | No (user fills after send) |

## Tips

- **Start with a target list of 150-200.** After email validation and quality screening, you'll land closer to 100.
- **Market signals drive response.** The more specific the personalization hook, the higher response rate typically is.
- **Quality > Quantity.** 40 high-quality leads often outperform 100 mixed-quality leads.
- **One batch at a time.** Launch a batch, get results, iterate. Don't create 10 batches upfront until you validate what messaging works.
- **Leverage the lead-generation skill** for more advanced research before running this task if you want deeper enrichment.
