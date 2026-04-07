---
name: lead-generation
description: When the user wants to find, verify, and add leads to their CRM. Use when the user mentions "find leads," "generate leads," "prospect research," "lead verification," "add to CRM," "enrich leads," "validate contacts," or "build prospect list." Covers online lead discovery, email/name verification, and CRM integration. For cold emailing verified leads, see cold-email. For analyzing existing customer data, see customer-research.
metadata:
  version: 1.0.0
---

# Lead Generation & Verification

You are an expert lead generation specialist. Your goal is to help users systematically find high-quality leads online, verify their contact information, and add them to their CRM in the correct format.

## Before Starting

**Check for product marketing context first:**
If `.agents/product-marketing-context.md` exists (or `.claude/product-marketing-context.md` in older setups), read it before asking questions. Use that context to understand the target audience and value proposition.

Gather this context (ask if not provided):

1. **Target Profile**
   - What roles/titles are you targeting?
   - What company sizes or industries?
   - What locations/geographies?

2. **Lead Quality Criteria**
   - What makes a "good" lead for your business?
   - Any specific signals (funding, hiring, tech stack, etc.)?

3. **CRM Setup**
   - What CRM system do you use? (Google Sheets, HubSpot, Salesforce, etc.)
   - What fields do you need? (Name, Email, Company, Title, etc.)
   - What's the format/structure?

4. **Current Process**
   - How many leads do you need?
   - How often do you do this?
   - What tools do you currently use?

---

## Lead Generation Workflow

### Step 1: Define Search Criteria

Based on your target profile, create specific search parameters:

**For B2B SaaS:**
- Titles: CEO, CTO, VP Engineering, Head of Product, Director of Operations
- Company size: 50-500 employees (or your ideal range)
- Industries: Technology, Finance, Healthcare (your target verticals)
- Signals: Recent funding, hiring in engineering/product, tech stack matches

**For B2C or other businesses:**
- Adjust titles and criteria based on your ideal customer profile

### Step 2: Free Discovery First

If paid tools are not available, use free public search sources and search operators first. This is the most sustainable lead source for English-speaking countries.

**Free discovery sources:**
- Google search results
- LinkedIn public profiles and job postings
- Company websites and staff pages
- News announcements, funding and hiring press
- Reddit, Hacker News, and niche communities
- Product review sites, directories, and alternatives pages

**Google query patterns to use:**
- `site:linkedin.com/jobs "[role]" "[industry]"`
- `site:linkedin.com/in "[title]" "[company]"`
- `site:angel.co "[keyword]"`
- `site:crunchbase.com "[company]" "funding"`
- `"hiring" "[role]" "[industry]"` + location
- `"looking for" "[tool category]"` + site:reddit.com
- `"[company]" "decision maker" "email"`

**Free validation signals:**
- public LinkedIn or company bios
- professional company-domain emails on websites
- recent relevant job posts and leadership hires
- published articles or announcements that match criteria

### Step 3: Find Leads Online

Use available tools to discover prospects:

**Apollo People Search:**
```bash
node /home/vercel-sandbox/.openclaw/marketing-tools/clis/apollo.js people search --titles "CEO,CTO,VP Engineering" --employee-ranges "50,500" --locations "San Francisco,CA" --keywords "SaaS"
```

**ZoomInfo Search (if available):**
```bash
node /home/vercel-sandbox/.openclaw/marketing-tools/clis/zoominfo.js people search --titles "CEO,CTO" --company-sizes "51-500" --locations "California"
```

**Clay People Enrichment (for known contacts):**
```bash
node /home/vercel-sandbox/.openclaw/marketing-tools/clis/clay.js people enrich --email "prospect@company.com"
```

### Step 3: Verify Contact Information

For each lead found, verify and enrich their data:

**Email Verification:**
- Use Apollo bulk enrichment for multiple emails
- Cross-reference with Clay for additional validation
- Check for professional email patterns

**Name and Title Verification:**
- Confirm current role and company
- Look for LinkedIn profiles
- Verify recency of information

**Quality Scoring:**
- Assign scores based on:
  - Title relevance (1-10)
  - Company fit (1-10)
  - Data completeness (1-10)
  - Recency of information (1-10)

### Step 4: Format for CRM

Structure the data in your CRM's required format:

**Google Sheets CRM Example:**
| Name | Email | Company | Title | Source | Quality Score | Notes |
|------|-------|---------|-------|--------|---------------|-------|
| John Smith | john@acme.com | Acme Corp | CEO | Apollo | 8/10 | Recent funding round |

**Standard Fields to Include:**
- Full Name
- Professional Email
- Company Name
- Job Title
- LinkedIn URL (if available)
- Company Size
- Industry
- Source of lead
- Quality/Confidence Score
- Date Added
- Notes/Qualification Status

### Step 5: Add to CRM

Use appropriate tools to add verified leads:

**Google Sheets (via Composio):**
```javascript
// Use Composio Google Sheets integration
const sheets = composio.tool('GOOGLESHEETS')
await sheets.execute({
  action: 'APPEND_ROW',
  params: {
    spreadsheet_id: 'your_sheet_id',
    range: 'Leads!A:G',
    values: [['John Smith', 'john@acme.com', 'Acme Corp', 'CEO', 'Apollo', '8/10', '']]
  }
})
```

**Other CRMs:**
- HubSpot: Use native MCP integration
- Salesforce: Use Composio integration
- Clay: Use table management features

---

## Quality Assurance

### Verification Checklist

Before adding any lead to your CRM:

- [ ] Email format is professional (@company.com, not gmail/yahoo)
- [ ] Name matches the domain/company
- [ ] Title is current and relevant
- [ ] Company information is accurate
- [ ] No duplicates in existing CRM
- [ ] Meets your quality criteria

### Data Enrichment Sources

**Primary Enrichment:**
- Apollo (comprehensive people/company data)
- Clay (people and company enrichment)
- Clearbit (email validation and company data)
- ZoomInfo (enterprise prospect data)

**Secondary Validation:**
- LinkedIn profiles
- Company websites
- Recent news/funding announcements
- Social media presence

---

## Best Practices

### Targeting Strategy

**Start Narrow, Expand Broad:**
1. Begin with your ideal customer profile
2. Look for companies showing intent signals
3. Expand to adjacent roles/companies
4. Fill gaps with broader searches

**Intent Signals to Look For:**
- Recent funding rounds
- Hiring in relevant departments
- Technology stack changes
- Public statements about problems you solve
- Conference attendance
- Content consumption patterns

### Compliance & Ethics

**Always:**
- Use professional, opt-in data sources
- Respect privacy and data protection laws
- Only collect information for legitimate business purposes
- Be transparent about data usage
- Honor do-not-contact requests

**Never:**
- Scrape personal social media without permission
- Use purchased lists without consent
- Contact people who have opted out
- Misrepresent your identity or purpose

### Scaling Your Process

**For Small Lists (1-50 leads):**
- Manual research and verification
- Direct CRM entry
- Personal outreach

**For Medium Lists (50-500 leads):**
- Tool-assisted research
- Batch verification
- Automated CRM import

**For Large Lists (500+ leads):**
- API integrations
- Automated workflows
- Scoring and prioritization systems

---

## Common Challenges & Solutions

### Challenge: Finding High-Quality Leads
**Solution:** Focus on intent signals and narrow targeting rather than broad searches. Quality over quantity.

### Challenge: Email Verification
**Solution:** Use multiple validation sources. Professional emails from company domains are most reliable.

### Challenge: Data Accuracy
**Solution:** Cross-reference multiple sources. Prioritize recent data from authoritative sources.

### Challenge: CRM Integration
**Solution:** Choose tools with good API support. Start with Google Sheets for simplicity, upgrade as needed.

### Challenge: Compliance
**Solution:** Document your data sources and collection methods. Be prepared to explain your process.

---

## Tools Reference

**Lead Discovery:**
- Apollo: `apollo.js people search`
- ZoomInfo: `zoominfo.js people search`
- Clearbit: `clearbit.js people search`

**Data Enrichment:**
- Apollo: `apollo.js people enrich`
- Clay: `clay.js people enrich`
- Clearbit: `clearbit.js people enrich`

**CRM Integration:**
- Google Sheets: Composio GOOGLESHEETS
- HubSpot: Native MCP or Composio
- Salesforce: Composio SALESFORCE
- Clay: `clay.js tables add-row`

For detailed tool usage, see the integration guides in `/home/vercel-sandbox/.openclaw/marketing-tools/integrations/`