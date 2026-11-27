export interface SampleDataset {
  id: 'resume' | 'support' | 'csv';
  label: string;
  filename: string;
  description: string;
  content: string;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'resume',
    label: 'Job Resume',
    filename: 'candidate_resume_rahul.txt',
    description: 'Emails (repeated), Indian phone, PAN & Aadhaar format',
    content: `CANDIDATE PROFILE — SENIOR PLATFORM ENGINEER
====================================================
Name: Rahul Deshmukh
Primary Email: rahul.deshmukh@devmail.example
Mobile: +91 98765 43210
Alternate Contact: 91234-56789
Tax Identifier (PAN): ABCDE1234F
National ID (Aadhaar): 4512 8890 3312
Home Workstation IP: 192.168.14.88

EXPERIENCE SUMMARY
- Led zero-downtime Kubernetes migrations for fintech payment gateways.
- Built client-side log scrubbers for PCI-DSS compliance audits.

REFERENCES & DECLARATION
For background verification, reach out to rahul.deshmukh@devmail.example
or HR coordinator at hr.verify@techbridge.example (+1-415-555-0148).`,
  },
  {
    id: 'support',
    label: 'Support Ticket',
    filename: 'support_ticket_4921.txt',
    description: 'IPv4/IPv6, repeated email, Luhn card + non-Luhn Order IDs',
    content: `[TICKET #SUP-4921] Priority: P1 — Payment Gateway Timeout
------------------------------------------------------------
Customer Email: priya.menon@cloudretail.example
Customer Phone: +91 98201 55443
Escalation Callback: +1 (415) 555-0192
Client IPv4: 203.0.113.42
Edge Proxy IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334

DIAGNOSTIC LOGS
2026-11-27T09:14:22Z INFO  Order ID: 9988-7766-5544-3321 (non-Luhn order ref)
2026-11-27T09:14:23Z INFO  Tracking Ref: 8842190344517720 (non-Luhn shipment ID)
2026-11-27T09:14:25Z WARN  Card attempt failed on test Visa 4532-0151-1283-0366
2026-11-27T09:14:29Z INFO  Receipt copy queued for priya.menon@cloudretail.example

ACTION REQUIRED
Please inspect the gateway trace above before sharing with external vendor AI.`,
  },
  {
    id: 'csv',
    label: 'Sales / CRM CSV',
    filename: 'crm_q4_exports.csv',
    description: 'Structured CSV with PII columns, repeated rows & safe IDs',
    content: `record_id,customer_name,email,phone,pan_number,card_on_file,client_ip,order_total_inr
10045,Rohan Verma,rohan.verma@acmelabs.example,+91 98111 22334,BNZAA2318J,4111-1111-1111-1111,10.24.18.90,14500
10046,Meera Nair,meera.nair@northstar.example,+44 20 7946 0958,CKLPM8841D,5500-0000-0000-0004,172.16.40.12,28990
10047,Rohan Verma,rohan.verma@acmelabs.example,+91 98111 22334,BNZAA2318J,4111-1111-1111-1111,10.24.18.90,4200
10048,Arjun Kapoor,arjun.k@zenithpay.example,+1-212-555-0183,DQWPR4419K,4532-0151-1283-0366,2001:db8::8a2e:370:7334,9850`,
  },
];
