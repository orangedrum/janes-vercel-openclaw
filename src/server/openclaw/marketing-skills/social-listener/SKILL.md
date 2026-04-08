---
name: social-listener
description: When the user wants to monitor Reddit and Twitter for mentions of their product, industry, competitors, or ICP. Use when they ask for "social listening," "monitor mentions," "track industry chatter," "Reddit/Twitter intelligence," or "what's people saying about [topic]." This skill searches public conversations and extracts actionable signals about market sentiment, buyer intent, and emerging problems.
metadata:
  version: 1.0.0
---

# Social Listener

You monitor public conversations on Reddit and Twitter/X for mentions relevant to the user's market, competition, and ICP. Results feed into a "Social Signals" sheet in their CRM and continuously build out a "Personas" knowledge base.

## Before Starting

Check if `.agents/product-marketing-context.md` exists. Use it to define:
- **ICP keywords** (title, company size, pain points)
- **Competitor names** (to hear what people say about alternatives)
- **Industry keywords** (your vertical, emerging problems)
- **Keyword combinations** (e.g., "marketing automation", "AI email", "list building")
- **Demographics to monitor** (age, seniority, company stage, location — from social-listening section of product context)

**Ask the user for:**
1. Twitter/X API key (free: 450 results/15 min; optional)
2. Frequency (daily, twice daily, or on-demand)
3. Retention (how many days of signals to keep)
4. **Persona monitoring** (what demographics and signals feed the persona knowledge base?)

---

## Listening Strategy

### Reddit Search

**Communities to monitor:**
- r/marketing, r/saas, r/startups (general)
- r/[your-industry] (e.g., r/ecommerce, r/b2bsaas)
- r/[pain-point] (e.g., r/emailmarketing, r/leadgeneration)
- Competitor subreddits (e.g., r/hubspot)

**Search queries:**
- `[your-niche] question 24h` (what problems people ask)
- `[competitor-name] alternative` (why people leave)
- `[ICP-title] frustrated` (pain-driven language)
- `[pain-point] solution` (looking for help)

**Extract from each post/comment:**
- Title/text
- Author
- Subreddit + post link (clickable)
- Timestamp
- Upvotes (signal of relevance)

### Twitter/X Search

**Search strategies:**
- `[ICP-title] + [pain-keyword]` (job-to-be-done language)
- `"[competitor]" + "problem" OR "frustrated"` (sentiment shift)
- `"[industry]" + "new tool"` (emerging needs)
- `"[your-niche]" + question mark` (intent)
- Hashtags: `#[industry]`, `#marketingautomation`, etc.

**Extract from each tweet:**
- Author handle
- Tweet text
- Tweet link (clickable)
- Likes/retweets (engagement signal)
- Timestamp

### LinkedIn Search

**Search strategies:**
- Posts from ICP titles discussing pain points or tool usage
- Comments on industry articles mentioning challenges
- Posts from thought leaders in your vertical
- Company announcements (hiring, funding) affecting your ICP

**Extract from each post/comment:**
- Author name and profile
- Post text
- LinkedIn URL (clickable)
- Engagement (comments, shares, reactions)
- Timestamp

**Access:** Requires LinkedIn account access (can scrape public profiles and posts)

### Facebook & Instagram (Groups/Communities)

**Communities to monitor:**
- Industry-specific Facebook groups (marketing, sales, etc.)
- Brand community pages relevant to ICP
- News/content pages in your vertical
- Influencer/thought leader accounts on Instagram

**Search strategies:**
- Facebook: Join relevant groups, monitor discussions about pain points or tool recommendations
- Instagram: Follow industry accounts, monitor hashtags, scrape captions and comments

**Extract from each post/comment:**
- Author name
- Post text
- URL/link (clickable)
- Engagement (likes, comments, shares)
- Timestamp

**Access:** Requires account access; can monitor public posts and groups

---

## Processing Flow

### Step 1: Execute Continuous Scraping

OpenClaw runs scraping continuously in the background (on cron schedule):

**Frequency:**
- Every 6 hours: Reddit subreddits + Twitter keywords
- Every 12 hours: LinkedIn posts + Facebook groups
- Every 24 hours: Instagram hashtag monitoring

**Per run:**
1. Query each platform for new mentions (past 6-24h depending on platform)
2. Filter: only posts with 5+ engagement (Reddit upvotes, Twitter likes, LinkedIn comments, etc.)
3. Exclude: promotional content, bot posts, spam
4. Extract all required fields including **clickable source link**
5. Add to "Social Signals" sheet in CRM

### Step 2: Signal Structure with Source Links

**Every signal added to the sheet includes:**

```
| Platform | Author | Text | Link | Timestamp | Engagement | Status | Relevance | Category | Persona Tag | Notes |
|----------|--------|------|------|-----------|-----------|--------|-----------|----------|------------|-------|
| Reddit | username | post text | https://reddit.com/r/marketing/comments/... | 2026-04-07T14:30Z | 42 upvotes | new | high | pain-point | Laura | "" |
| Twitter | @handle | tweet text | https://twitter.com/handle/status/... | 2026-04-07T14:25Z | 180 likes | new | medium | competitor-mention | Marcus | "" |
| LinkedIn | John Smith | post text | https://linkedin.com/feed/update/... | 2026-04-07T13:00Z | 23 comments | new | high | intent-signal | Laura | "" |
| Facebook | Group: SaaS Marketers | post text | https://facebook.com/groups/.../permalink/... | 2026-04-07T10:15Z | 15 comments | new | medium | pain-point | New | "" |
| Instagram | @industry_leader | caption text | https://instagram.com/p/... | 2026-04-07T09:00Z | 342 likes | new | low | industry-news | "" | "" |
```

**All links are clickable and verified** so the user can quickly jump to the source for deeper analysis.

### Step 3: Categorize

Tag each signal:
- **pain-point**: Post describes a problem (target market in pain)
- **competitor-mention**: References to alternative solutions
- **intent-signal**: Language indicating buying consideration ("looking for...", "does anyone know...")
- **industry-news**: Market movement, funding, new product launches
- **your-product**: Direct mention of your solution (if already launched)

### Step 4: Scoring

Assign relevance (auto) based on:
- Engagement (high engagement = relevant)
- Recency (newer = higher priority)
- Keyword match (exact match > partial)
- ICP match (post from verified ICP profile > generic)

---

## CRM Integration

### New Sheet: "Social Signals"

Add to your CRM a sheet with these columns:

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| Date Heard | date | auto | timestamp from source |
| Platform | select | | Reddit, Twitter, LinkedIn (future) |
| Author | text | | username or handle |
| Text | text | | Exact quote or description |
| Link | URL | | Clickable link to source |
| Category | select | | pain-point, competitor-mention, intent-signal, industry-news, your-product |
| Relevance | select | | high, medium, low (auto-scored) |
| Engagement | number | | upvotes/likes/retweets (signal of reach) |
| Status | select | **new** | new, responded, not-useful, follow-up, action-taken |
| Persona Tag | select | | Use when this signal clearly belongs to one of your personas |
| Notes | text | | Your reaction or next steps |
| Lead Generated | link | | Link to lead row if this signal triggered a prospect research |

### New Sheet: "Personas" (Knowledge Base)

Build out synthetic, data-driven personas from listener findings. Update this sheet as the listener learns more about your audience.

| Column | Type | Notes |
|--------|------|-------|
| Persona Name | text | E.g., "Laura the Lean Marketer" |
| Photo | image URL | Generated or stock image matching that persona |
| Job Title | text | E.g., "Marketing Manager" |
| Company | text | E.g., "Mid-market SaaS" |
| Company Size | select | SMB, Mid-market, Enterprise |
| Industry | text | E.g., "B2B SaaS" |
| Seniority | select | Individual Contributor, Manager, Director, C-Level |
| Years in Role | number | Average based on listener signals |
| Education | text | E.g., "Bachelor's in Business/Marketing" |
| Base Location | text | Where these personas tend to be |
| **Motivations** | text | What drives them (updated from signals) |
| **Biggest Challenge** | text | #1 pain point (from listener data) |
| **Current Pain Points** | text | Top 3 challenges they face |
| **Fears** | text | What worries them about decisions |
| **Wins** | text | Recent successes or achievements |
| **Frustrations** | text | What frustrates them in their work |
| **Typical Day** | text | How they spend their time |
| **Tech Stack** | text | Tools they use (from signals) |
| **Budget Authority** | select | Recommends, Influences, Decides, Approves |
| **Buying Triggers** | text | What prompts them to evaluate solutions |
| **Objections** | text | Common hesitations about new tools |
| **Where They Learn** | text | Content sources, communities, platforms |
| **Signal Count** | number | How many listener signals contribute to this persona (credibility) |
| **Last Updated** | date | When this persona was refreshed |
| **Data Quality** | select | Low (1-5 signals), Medium (6-20 signals), High (20+ signals) |

---

## Persona Extraction & Generation Workflow

### Step 1: Extract from Signals

As the listener finds new signals, extract persona attributes:

**From a Reddit post like:**
```
"As a marketing manager at a growing SaaS, I'm overwhelmed by manual list
validation. We get 50+ leads/week and spend hours checking emails. Tools are
too expensive for our budget. What do people use?"
```

**Extract these attributes:**
- **Job Title:** Marketing Manager
- **Company Size:** Growing (assume 50-200 people)
- **Industry:** SaaS
- **Challenge:** Manual list validation
- **Volume:** 50+ leads/week
- **Pain:** Time-consuming + costly tools
- **Buying Trigger:** Volume is increasing
- **Budget Concern:** Tools are too expensive
- **Where They Learn:** Reddit (community help-seeking)

### Step 2: Build the Persona Knowledge Base

Group similar signals into personas. Example: After 20-30 signals, you might identify:

**Persona A: "Laura the Lean Marketer"**
- Role: Head of Marketing at Series A SaaS
- Challenge: High lead volume + limited budget
- Motivation: Grow efficiently without overspending
- Fear: Tools will be too complex or expensive
- Where she learns: Reddit, Twitter, community Slack groups

**Persona B: "Marcus the Enterprise Buyer"**
- Role: VP Sales at mid-market
- Challenge: Team scaling + process standardization
- Motivation: Predictable pipeline + team efficiency
- Fear: Vendor lock-in + disruption to sales processes
- Where he learns: LinkedIn, industry conferences, sales publications

### Step 3: Generate Full Synthetic Personas

Once you have 10-20 signals per persona bucket, generate a complete synthetic persona:

**Input to OpenClaw:**
```
Here are signals for personas in my market:
[paste 10-20 listener signals]

Generate 2 full synthetic personas with:
- Made-up but realistic name and photo description
- Job title and company type
- Motivations, challenges, fears, wins (grounded in signals)
- Typical day and tech stack
- Where they learn and buying triggers
- Common objections
```

**Output example:**
```
PERSONA 1: "Sarah Chen"
- Photo: Professional headshot, Asian woman, 30s, casual blazer
- Job Title: Demand Generation Manager
- Company: Series B MarTech SaaS, 120 people
- Seniority: Manager
- Background: 6 years in marketing, came from inbound marketing agency

**Biggest Challenge:**
"My team is handling inbound + outbound. We're drowning in spreadsheets.
Our email list is a mess—half the addresses are invalid. I need a fast,
cheap way to clean data and run campaigns without losing quality."

**Motivations:**
- Move beyond manual processes
- Prove demand gen ROI to VP
- Keep tooling costs under $500/mo
- Avoid another complex platform integration

**Fears:**
- New tool breaks our workflow
- Another SaaS subscription we don't need
- Getting stuck with poor support post-sale

**Wins:**
- Closed $1.2M in pipeline last quarter
- Got buy-in for demand gen budget expansion
- Started SMS channel (early success)

**Typical Day:**
- 9am: Team standup on campaign performance
- 10am: Cleaning up leads from morning's form submissions
- 11am-12pm: Troubleshooting email deliverability issue
- 1pm: Lunch + Slack in marketing communities
- 2pm-5pm: Building next week's nurture campaign

**Tech Stack:**
- HubSpot (CRM, but using only basic features)
- LinkedIn Sales Navigator (manual prospecting)
- Google Sheets (lead management, honestly)
- Zapier (connecting tools together)
- Lemlist (for outbound sequences)
- Gmail (volume sender, concerned about reputation)

**Where She Learns:**
- r/MarketingAutomation and r/demandgen on Reddit (2-3x per week)
- Follow 5-10 demand gen thought leaders on Twitter
- Attends quarterly virtual marketing ops meetups
- Follows 3 marketing automation Slack communities

**Buying Triggers:**
- When a project or campaign requires clean data
- When a peer/coworker mentions a tool that solved a specific problem
- When she sees a relevant Slack conversation or Reddit post

**Objections to New Tools:**
- "How long will it take to integrate?"
- "Will this add complexity to our stack?"
- "Can we try it for free first?"
- "What if we outgrow it in 6 months?"
```

### Step 4: Use Personas for Marketing

**How to use these synthetic personas:**

1. **Copy refinement** — Write subject lines and hooks targeting what each persona fears/wants
2. **Segment outreach** — Send different messages to Sarah vs. Marcus personas
3. **Cold email angles** — "Saw people in demand gen are struggling with X, thought of your team"
4. **Product positioning** — Highlight the features each persona cares about
5. **Content ideas** — Create blog posts, emails, and examples that directly address persona challenges

---

## Continuous Persona Refinement

### Weekly Prompt: "How Are Our Personas Performing?"

**Every 7 days, the system delivers a prompt with clickable signal links:**

```
Persona Performance & Signal Analysis — Week of April 7

New Signals Collected: 45 total
- Reddit: 18 signals (r/marketing, r/emailmarketing, r/saas)
- Twitter: 12 signals (keywords: #demandgen, #emailmarketing, #MarketingOps)
- LinkedIn: 9 signals (VP Sales, Marketing Manager posts)
- Facebook: 4 signals (SaaS marketers group)
- Instagram: 2 signals (industry influencers)

Current Personas & Signal Count:
1. Laura the Lean Marketer — 8 → 18 signals (HIGH CONFIDENCE ✅)
2. Marcus the Enterprise Buyer — 5 → 12 signals (MEDIUM CONFIDENCE)
3. Jordan the DIY Founder — 2 → 7 signals (EMERGING)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

High-Relevance Signals (20+ engagement) — Click to Analyze:

LAURA'S SIGNALS:
1. Reddit post: "Drowning in unvalidated leads"
   https://reddit.com/r/marketing/comments/abc123/drowning_in_unvalidated_leads
   → 87 upvotes | Challenge: List quality

2. Twitter thread: "Email validation tools are too expensive"
   https://twitter.com/user/status/1234567890
   → 156 likes | Challenge: Budget vs features

3. LinkedIn post: "Our demand gen stack is out of control"
   https://linkedin.com/feed/update/urn:li:activity:789456123
   → 23 comments | Challenge: Tool sprawl

4. Reddit comment: "Anyone use free email validation?"
   https://reddit.com/r/emailmarketing/comments/xyz789/_/abc456
   → 14 upvotes | Intent: Actively searching

[... 6 more linked signals for Laura ...]

MARCUS'S SIGNALS:
5. LinkedIn post: "Scaling from SDR team to full enterprise sales ops"
   https://linkedin.com/feed/update/urn:li:activity:456789123
   → 45 comments | Challenge: Process scaling

6. Twitter: "Sales team can't keep up with lead volume"
   https://twitter.com/sales_vp/status/9876543210
   → 203 likes | Intent: Solutions research

7. Facebook group post: "Company just hired 5 new AEs, pipeline chaos"
   https://facebook.com/groups/saas-sales-leaders/permalink/123456789
   → 8 comments | Challenge: Team coordination

[... 4 more linked signals for Marcus ...]

JORDAN'S SIGNALS:
8. Reddit post: "Bootstrap SaaS with $0 marketing budget"
   https://reddit.com/r/startups/comments/def456/bootstrap_saas_with_0_marketing_budget
   → 62 upvotes | Challenge: Cost vs features

9. Indie Hackers discussion: "DIY lead generation without paid tools"
   https://twitter.com/indie_hackers/status/5432109876
   → 89 retweets | Strategy: DIY approach

[... 2 more linked signals for Jordan ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Questions to Answer:

1. **Reality Check:** Review 3-5 links above. Do the signals match your personas?
   [ ] Yes, personas feel accurate
   [ ] Partially accurate, needs refinement
   [ ] No, signals don't match

2. **Emerging Patterns:** Did you notice any new motivations or fears?
   Example: "Laura cares more about validation speed than cost"
   Your observation: _______________

3. **Persona Accuracy:** Which persona is most solid and which needs more signals?
   Strongest: [Laura / Marcus / Jordan]
   Weakest: [Laura / Marcus / Jordan]

4. **New Persona Detection:** Any signals you think represent a NEW persona?
   [ ] No
   [ ] Yes, describe: _______________

5. **Prioritization:** Which persona should outreach target FIRST?
   Choice: [Laura / Marcus / Jordan]
   Why: _______________

6. **Signal Feedback:** Pick one signal link and tell us:
   - Was it relevant?
   - What surprised you?
   - Should this signal get a different persona tag?

Your Feedback:
[Space for notes]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next Steps Based on Your Input:
- [ ] Update "Personas" sheet with your feedback
- [ ] Tag signals with correct persona
- [ ] Mark [signal link] for outreach angle
- [ ] Deprioritize or combine personas if needed
```

### Monthly Prompt: "Persona Refresh & Regeneration"

**Every 30 days, deeper analysis with full signal review:**

```
Monthly Persona Deep Dive — April 2026

Signals Processed This Month: 180 total
- Reddit: 65 signals from 8 subreddits
- Twitter: 55 signals from keyword tracking
- LinkedIn: 40 signals from ICP job titles
- Facebook: 15 signals from 3 industry groups
- Instagram: 5 signals from 2 thought leaders

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERSONA 1: Laura the Lean Marketer
Signal Growth: 8 → 28 signals (HIGH CONFIDENCE ✅)

Biggest Challenge (Updated):
"Budget + quality at high volume"
→ New learning: Speed of validation matters as much as cost

Top Motivations Discovered:
- Prove ROI without enterprise spend ($200-500/mo budget)
- Move beyond manual spreadsheets
- Reduce validation time from hours to minutes

Top Fears Discovered:
- Tool complexity adding burden instead of solutions
- Vendor will disappear or change pricing
- Integration nightmare with current stack

Sample Signals to Review (Highest Relevance):
- https://reddit.com/r/marketing/comments/.../email_validation_free
  42 upvotes | "Is there a free email validator?"
- https://twitter.com/laura_mk/status/... 
  156 likes | "Validation tools under $100/mo?"
- https://linkedin.com/feed/update/...
  23 comments | "Best cheap email validator discussion"

Where Laura Learns (Updated):
- Reddit: r/marketing, r/emailmarketing (daily check-ins)
- Twitter: Follows 8 demand gen thought leaders
- Slack: Joined 3 marketing communities (active participant)
- Email: Subscribed to 2 marketing newsletters (weekly reader)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERSONA 2: Marcus the Enterprise Buyer
Signal Growth: 5 → 15 signals (MEDIUM CONFIDENCE)

Biggest Challenge (Updated):
"Sales team scaling + process standardization"
→ New learning: He has budget but is cautious about disruption

Top Motivations:
- Predictable pipeline at scale
- Team efficiency (AEs handling more opportunities)
- Standardized lead flows (reduce chaos)

Top Fears:
- Integration disrupting existing workflows
- Lost productivity during migration
- Tool vendor lock-in on enterprise contract

Sample Signals to Review:
- https://linkedin.com/feed/update/.../sales_ops_scaling
  45 comments | "How do you scale an SDR team?"
- https://twitter.com/vp_sales/status/...
  203 likes | "Sales automation without the chaos"

Where Marcus Learns:
- LinkedIn: Follows 12 sales & operations thought leaders
- Twitter: Engaged in #SalesOps conversations (2-3x per week)
- Industry events: Attends 1-2 sales conferences per year

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERSONA 3: Jordan the DIY Founder
Signal Growth: 2 → 9 signals (MEDIUM CONFIDENCE)

Biggest Challenge:
"Bootstrap, doing everything, savings-focused"
→ New learning: He'll do manual work if it's cheaper than tools

Top Motivations:
- Save time without excessive spending
- Join founder/maker community
- Ship fast with limited resources

Top Fears:
- Vendor disappearing or changing pricing model
- Tool complexity when he needs simplicity
- Lock-in: paying for something he can't escape

Sample Signals to Review:
- https://reddit.com/r/startups/comments/.../bootstrap_marketing
  62 upvotes | "Zero-cost lead generation tactics"
- https://twitter.com/indie_hackers/status/...
  89 retweets | "DIY cold email without paid tools"

Where Jordan Learns:
- Reddit: r/startups, r/indie, r/SideProject (several times per week)
- Hacker News: Actively reading comments (daily)
- Twitter: Follows founder/maker accounts (skims timeline)
- Communities: Indie Hackers, Founder communities

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EMERGING PATTERN: Sarah the Agency Marketer
Signal Growth: 7 signals (NEW PERSONA — monitor next month)

Observations:
- Managing multiple client campaigns with different needs
- Budget authority per-client (some tight, some generous)
- Learning: Tools must be multi-tenant or multi-account friendly

Sample Signals:
- https://facebook.com/groups/agency-marketers/permalink/...
  "Managing 5 client email lists without losing sanity"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Actions This Month:

1. **Signal Quality Review:**
   [ ] Read 3-5 highest-relevance links per persona
   [ ] Rate signal accuracy: Accurate / Partially / Inaccurate
   [ ] Provide feedback on any surprises

2. **Persona Accuracy Assessment:**
   Which persona is most actionable for your business?
   [ ] Laura (budget-conscious, high volume)
   [ ] Marcus (enterprise, process-focused)
   [ ] Jordan (bootstrap, DIY-focused)

3. **Signal Feedback:**
   Any signals that feel misaligned? Specific link: _______________

4. **New Persona:**
   Should we track Sarah (agency marketer) formally?
   [ ] Yes, add as Persona 4
   [ ] No, wait for more signals
   [ ] Yes, but combine with Laura

5. **Regenerate Full Personas?**
   [ ] Yes — regenerate all with latest signals + learnings
   [ ] No — hold steady, check again in 30 days

Your Input:
[Space for notes, links to signals, feedback]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next Steps:
- [ ] Update "Personas" sheet in CRM with your feedback
- [ ] Regenerate full personas if significant shifts
- [ ] Adjust cold-email messaging based on refined persona data
- [ ] Tag 3-5 top signals for lead-batch research
```

---

## CRM Integration

### Status Workflow

**new** → User reviews
- If useful: mark **follow-up** or **action-taken**
- If not applicable: mark **not-useful** (system learns)
- If you reached out: mark **responded**
- If it feeds a persona: tag in **Persona Tag** column

---

## Usage Examples

### Example 1: Pain-Point Signal

**Reddit post in r/marketing:**
```
"We're struggling with email list quality. Half our
contacts are invalid or bouncing. Anyone using a
good validation tool?"
```

**Captured signal:**
```
Platform: Reddit
Author: user123
Category: pain-point
Relevance: high
Status: new
Notes: "This person needs list validation and email quality.
Good prospect for lead-gen + validation workflow."
```

**Your action:**
- Mark as **action-taken**
- Research user123's company
- Add to lead batch if match

### Example 2: Competitor Mention

**Twitter:**
```
"@CompetitorX pricing just became unaffordable.
Looking for an alternative that doesn't cost $500/mo"
```

**Captured signal:**
```
Platform: Twitter
Author: @handle
Category: competitor-mention
Relevance: high
Status: new
Notes: "Direct statement of competitor dissatisfaction + budget sensitivity.
This person is in active evaluation."
```

**Your action:**
- Mark as **responded** (you could proactively reach out)
- Add to lead batch (high intent)

### Example 3: Industry News

**Reddit post:**
```
"Zapier just launched native email verification.
What are people using now?"
```

**Captured signal:**
```
Platform: Reddit
Category: industry-news
Relevance: medium
Status: new
Notes: "Market trending toward email validation as built-in feature. Confirms demand."
```

**Your action:**
- Mark as **not-useful** (just industry trend)
- Update messaging based on market shift

---

## Setting Up Social Listening

### For Reddit

**No API key needed** — OpenClaw queries `reddit.com/search` and parses results.

**Ask user for:**
- Which subreddits to monitor (e.g., r/marketing, r/saas, r/startups)
- Keywords to search (from product-marketing-context)
- Frequency (daily)
- Age filter (past 24 hours)

### For Twitter/X

**Requires API key (free tier available):**
1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Create a free app (Academic, Hobbyist, or Business)
3. Get API key (Bearer token)
4. Set env var: `TWITTER_API_KEY=your_key`

**Ask user for:**
- Keywords to search (from product-marketing-context)
- Hashtags to monitor
- Frequency (can run multiple times per day with free tier)
- Retention (7 days? 30 days?)

### For LinkedIn

**Not currently included** — requires paid API ($1k+/mo). Can be added in future if budget allows.

---

## Workflow in OpenClaw

### First Run

```
User: "monitor social for email validation + list building keywords"

OpenClaw:
1. Reads product-marketing-context
2. Extracts: keywords, competitors, ICP titles
3. Builds search queries:
   - Reddit: r/marketing, r/emailmarketing, "email validation", "list quality"
   - Twitter: "#emailmarketing", "email validation problem", "@competitors"
4. Executes searches (past 24h)
5. Returns structured SQL/CSV output
6. Adds to "Social Signals" sheet in CRM
7. All Status = "new"
```

### Daily Run (Cron)

```
Cron watchdog triggers daily at 9 AM:
1. Search Reddit + Twitter for new mentions (past 24h)
2. Filter for high engagement
3. Add to CRM sheet
4. Tag Status = "new"
5. User reviews in morning
```

---

## Learning Loop

**After 50-100 signals, patterns emerge:**

- Which categories drive actual leads?
- Which platforms give better quality signals?
- Which keywords are noise vs. high-intent?

**Then:**
- Adjust search queries to filter noise
- Increase frequency for high-signal subreddits
- Reduce frequency for low-ROI platforms

**Data available to review:**
- Signal-to-lead conversion rate (signals → leads → opportunities)
- Category breakdown (which type converts best?)
- Platform comparison (Reddit vs. Twitter signal quality)

---

## Real-Time vs. Daily

OpenClaw runs on-demand + cron (daily). **Not true real-time**, but:
- **Daily at 9 AM** catches overnight signals
- **On-demand** whenever user runs it manually
- **Weekly review** gives you time to research + respond

For **true real-time** (as posts happen), would need:
- Separate service (Zapier, Make, IFTTT)
- Webhook listener outside sandbox
- Not part of this skill, but can be integrated

---

## Tips

- **Start narrow:** Monitor 2-3 subreddits + one keyword on Twitter
- **Then expand:** Add more keywords/communities based on signal quality
- **Daily review:** 5-10 minutes to scan new signals, mark status, note opportunities
- **Monthly audit:** Review signal-to-lead ratio, adjust keywords
- **Combine with leads:** When you find a high-signal person, research them + add to batch

---

## What This Enables

1. **Market intelligence** — Know what problems people are solving *right now*
2. **Competitor intel** — Hear directly why people leave alternatives
3. **Keyword ideas** — Capture actual customer language
4. **Prospect research** — Find prospects mid-evaluation
5. **Lead enrichment** — Add context (what they were discussing) to leads
6. **Copy testing** — Validate messaging angles before sending

Example: You find Reddit post "frustrated with [competitor], pricing too high". You research that user, add them to next batch, and use "pricing pain" angle in your email because you *know* they care about it.
