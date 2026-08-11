# thebluecorner.ca — DNS

Six records, about ten minutes. The website and its sign-up form are built and tested; they go live
the moment these are saved. Your Google Workspace email is untouched.

## Where

Cloudflare → **thebluecorner.ca** → **DNS** → **Records** → **Add record**. Leave TTL on **Auto**.

> **Set both `A` records to "DNS only" — the grey cloud, not the orange one.**
>
> Proxied records stop our server from collecting its security certificate. If the site shows a
> certificate warning or keeps redirecting, this is why, and clicking the cloud grey fixes it.

## The records

| # | Type | Name | Value | |
|---|------|------|-------|---|
| 1 | `A` | `@` | `52.60.233.71` | DNS only |
| 2 | `A` | `www` | `52.60.233.71` | DNS only |
| 3 | `TXT` | `resend._domainkey` | the key below | |
| 4 | `TXT` | `send` | `v=spf1 include:amazonses.com ~all` | |
| 5 | `MX` | `send` | `feedback-smtp.us-east-1.amazonses.com` | priority `10` |
| 6 | `TXT` | `_dmarc` | `v=DMARC1; p=none;` | |

Records 1–2 point the domain at the site. Records 3–5 let us send email as the domain so it arrives
rather than landing in spam. Record 6 reports anyone forging mail from it.

Type names exactly as written — `send`, not `send.thebluecorner.ca`. Cloudflare adds the domain.

### Record 3

**Copy this from the `record-3-dkim.txt` file sent with this page, not from here.** It is one long
line and any PDF or email will wrap it on screen; copying the wrapped version puts an invisible line
break in the middle, which looks fine in Cloudflare and silently fails to verify.

```
p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCbG9x8FUgcgmjFZN8uXn/9ebS6RHPEU8KlZsl6RkbTY4pgHFtjxF8gEdxYFqmSvi2lm0SsKvAy042icgpQGr6m6frMgVO6Rkm2fVkZz016iEtH3n04X1w8Yhh+4YrjV1KOIU3jQbOP5uTjCSV/ffoLPVMQdLk7sy7SWfergaEnZwIDAQAB
```

## Leave alone

The five `MX` records on `@`, the `v=spf1 include:_spf.google.com` record and the
`google-site-verification` record — those are your email. In particular **don't edit the existing SPF
or add a second one**; a domain may only have one and two breaks both. Ours sits on `send`, so there
is nothing to merge.

**When you're done, tell us and we'll confirm both halves.** `https://thebluecorner.ca` should show
the site with a padlock within a minute or two of saving.
