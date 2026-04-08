# Persona Knowledge Base Setup & Usage

Guide for setting up the "Personas" CRM sheet and maintaining dynamic personas built from social listener signals.

## What is the Persona Knowledge Base?

A living, data-driven repository of synthetic personas constructed from real social signals. Unlike static buyer personas, these evolve as the social listener finds new signals about your audience's motivations, fears, challenges, and behaviors.

**Purpose:**
- Shape marketing copy and cold email angles
- Segment your outreach strategy
- Validate product positioning
- Align sales and marketing on who they're targeting
- Test messaging hypotheses

---

## Prerequisites

1. **Product-marketing-context** setup complete (includes social listening configuration)
2. **Social-listener** running and collecting signals (Reddit + Twitter)
3. **CRM with Personas sheet** created (Google Sheets recommended)

---

## Step 1: Create the "Personas" Sheet

In your CRM (Google Sheets or HubSpot):

Create a new sheet called **"Personas"** with these columns:

| Column | Type | Purpose |
|--------|------|---------|
| Persona Name | Text | "Laura the Lean Marketer", "Marcus the VP", etc. |
| Photo | Image URL | Generated or stock image |
| Job Title | Text | Their role |
| Company | Text | Type of company (Series A SaaS, Enterprise, etc.) |
| Company Size | Select | SMB / Mid-market / Enterprise |
| Industry | Text | Their vertical |
| Seniority | Select | IC / Manager / Director / C-Level |
| Years in Role | Number | Years of experience |
| Education | Text | Background |
| Base Location | Text | Geography |
| **Motivations** | Text | What drives decisions |
| **Biggest Challenge** | Text | #1 pain point |
| **Current Pain Points** | List | Top 3-5 challenges |
| **Fears** | Text | Concerns about new solutions |
| **Wins** | Text | Recent successes |
| **Frustrations** | Text | Day-to-day irritants |
| **Typical Day** | Text | How they spend time |
| **Tech Stack** | Text | Tools they use |
| **Budget Authority** | Select | Recommends / Influences / Decides / Approves |
| **Buying Triggers** | Text | What prompts evaluation |
| **Objections** | Text | Common hesitations |
| **Where They Learn** | Text | Reddit, Twitter, Slack, conferences, etc. |
| **Signal Count** | Number | # of listener signals supporting this persona |
| **Data Quality** | Select | Low (1-5) / Medium (6-20) / High (20+) |
| **Last Updated** | Date | When persona was last refreshed |

---

## Step 2: Collect Initial Signals

Before you can build personas, the social listener needs to run for 5-7 days to gather ~50-100 signals.

**During this time:**
1. Configure the social listener with your search terms and communities
2. Collect signals in the "Social Signals" sheet
3. Let OpenClaw tag which signals relate to personas (using "Persona Tag" column)

---

## Step 3: Identify Persona Patterns

After ~50 signals, look for clusters:

**Example clustering:**

**"Laura the Lean Marketer" cluster:**
- Budget-conscious marketing managers
- High lead volume, limited tools budget
- Frustrated with expensive SaaS
- Learning from Reddit, Twitter, Slack communities
- Signals: ~12

**"Marcus the VP Sales" cluster:**
- Sales leaders at mid-market
- Managing growing teams
- Concerned about process + efficiency
- Learning from LinkedIn, conferences
- Signals: ~8

**"Jordan the DIY Founder" cluster:**
- Solo founders or pre-PMF startups
- Building everything themselves
- Highly technical, cost-sensitive
- Learning from HN, indie hacker communities
- Signals: ~5

---

## Step 4: Generate Full Synthetic Personas

Once you have 10-20 signals per persona, ask OpenClaw to generate full personas:

**Prompt template:**

```
I've collected social signals from my market. Here's what I'm seeing:

[Paste 15-20 signals for "Laura" cluster]

Generate a detailed synthetic persona for this group with:
- Realistic name and photo description (realistic for field/demographic)
- Job title, company type, seniority
- Biggest challenge (grounded in signal language)
- Top 3 motivations (why they're evaluating solutions)
- Top 3 fears (concerns about switching or new tools)
- Typical day breakdown
- Tech stack they currently use
- Where they learn (communities, content sources)
- Buying triggers (what prompts them to look for solutions)
- Common objections to new tools
- 2-3 direct quotes from signals that define them
```

**OpenClaw will return:**
Complete persona profile ready to paste into your Personas sheet.

---

## Step 5: Add to Personas Sheet

Paste the generated persona into a new row:

| Persona Name | Job Title | Company | Biggest Challenge | Motivations | Fears |
|---|---|---|---|---|---|
| Laura the Lean Marketer | Demand Gen Manager | Series B MarTech | Lead quality at scale | Prove ROI with budget constraints | Tool complexity, vendor lock-in |

---

## Step 6: Map to Outreach Strategy

Now that you have personas, use them to segment your lead generation and cold email:

**For Laura personas:**
- Subject line: "Cleaning 500 leads/week without breaking budget"
- Opening hook: "Noticed marketers in growth mode are buried in list validation"
- CTA: "Want to see how teams skip manual email checks?"

**For Marcus personas:**
- Subject line: "Sales ops that don't slow down your team"
- Opening hook: "VP Sales at mid-markets are hitting scaling pain"
- CTA: "30-min audit of your current workflow?"

**For Jordan personas:**
- Subject line: "DIY founders say this saved 10 hours/week"
- Opening hook: "Bootstrapping but don't want manual processes"
- CTA: "Try it free for 14 days?"

---

## Weekly Persona Prompt

Every 7 days, the social listener will ask:

```
Persona Performance Check:

Current Personas: Laura (12 signals), Marcus (8 signals), Jordan (5 signals)

New signals this week: 15
- 8 match Laura
- 4 match Marcus
- 3 new pattern: "Sarah the solo marketer in agencies"

Questions for you:
1. Are these personas still accurate?
2. Which persona should we prioritize targeting first?
3. What surprised you this week?
4. Should we split/combine any personas?
5. What new motivation or fear did we discover?
```

**Your job:** Answer these questions, and OpenClaw will log the feedback to refine personas further.

---

## Monthly Persona Refresh

Every 30 days:

1. **Count signals per persona** — Which have 20+? (High confidence) Which have <5? (Low confidence)
2. **Review motivation updates** — What's changed in what drives them?
3. **Review fear updates** — Any new objections?
4. **Spot new patterns** — Any emerging personas?
5. **Regenerate full personas** — Ask OpenClaw to rebuild them with new signals

**Update the Personas sheet:**
- Refresh "Biggest Challenge"
- Update "Motivations" and "Fears"
- Increase "Signal Count"
- Update "Last Updated" date

---

## Using Personas for Marketing

### Cold Email Copy

**Old (generic):**
```
Subject: Check out our solution!

Hi [name],
We help companies validate emails. Interested?
```

**New (Laura persona):**
```
Subject: Cleaning 500 leads/week on a $2k/mo budget

Hi [name],
Saw your post about manual list validation. We help grow teams skip the
spreadsheet phase—works with your existing HubSpot, no new platform needed.

Quick question: how much time per week is your team spending on email cleanup?
```

### Segmented Lead Batches

**Batch 1: Target Laura personas**
- Titles: Demand Gen Manager, Marketing Manager
- Company size: 50-200
- Keywords in research: "email quality", "lead validation", budget mentions

**Batch 2: Target Marcus personas**
- Titles: VP Sales, Sales Director
- Company size: 200-1000
- Keywords: "sales ops", "process", "scaling team"

### Content Ideas

**For Laura:** "How to validate 100+ leads without a $500/mo tool"
**For Marcus:** "5 ways VP Sales reduce sales ops work by 50%"
**For Jordan:** "Bootstrapped? Save 10 hours/week with this one trick"

---

## Tips

- **Start with 2-3 personas**, then expand. More personas = harder to track.
- **Refresh monthly.** Personas should evolve as you learn more.
- **Use exact signal language.** When personas reference real quotes from signals, they feel more real.
- **Test against real outreach.** Which persona resonates? Adjust based on response rates.
- **Share with team.** Make personas visible to sales, product, and customer success.
- **Keep photos realistic.** If targeting tech managers in Europe, find generated headshots that match that demographic.

---

## Troubleshooting

**Problem: Not enough signals to build personas**
→ Answer: Let the listener run for 2-3 weeks. 50+ signals is the minimum threshold.

**Problem: All signals feel generic, no clear personas**
→ Answer: Listener search terms may be too broad. Ask user to refine keywords to more specific pain points or roles.

**Problem: One persona has 50+ signals, others have <5**
→ Answer: You've found a dominant persona. Either focus outreach there or broaden listener search to find other audiences.

**Problem: Persona feels unrealistic or over-generated**
→ Answer: Review the signals that built it. If most are from one toxic Reddit post, that's a red flag. Personas need (20+) signals to be credible.

---

## Next Steps After Personas

Once personas feel solid (20+ signals each, data quality = "High"):

1. **Build lead batches targeting each persona** (use lead-batch-create skill)
2. **Write persona-specific cold emails** (use cold-email skill)
3. **Track response rate by persona** — measure which resonates
4. **Refine messaging for top performers** (use lead-batch-testing skill)
5. **Update sales collateral** with persona-specific pain points
