# Website analytics

- GA4 property: **Sidequest Plugins**, `553118745`, in the existing Hugo account.
- Web stream: `15740728253`. Measurement ID: `G-4X9B1G9ESM`.
- Reporting: Amsterdam time, USD.
- [Open Analytics](https://analytics.google.com/analytics/web/#/a395550438p553118745/reports/intelligenthome).

`Analytics.astro` is included by both site layouts. It loads GA only on the
production hostname after consent, remembers the choice for 180 days, and offers
withdrawal through Cookie settings. Advertising consent remains denied. Local and
staging visits do not load the Google tag. Run `node scripts/check-analytics.mjs`
to check consent, attribution, and checkout event handling.

LemonSqueezy's Design > General > Tracking uses the same measurement ID. Its
existing integration supplies checkout and purchase events; do not add a second
purchase handler. Cross-domain measurement includes `sidequestplugins.com` and
`sidequestplugins.lemonsqueezy.com`.

In GA4, use **Traffic acquisition**, choose **Session source / medium**, and
compare purchases and revenue. Use **User acquisition** to compare the sources
that first brought visitors to the site. Reports start with newly collected data.

Tag external marketing links consistently, for example:

`https://sidequestplugins.com/find-and-replace-fonts?utm_source=youtube&utm_medium=organic_video&utm_campaign=font_tutorial`

Use different campaign names for each launch or tutorial. Never put personal data
in campaign parameters, and do not add UTM tags to links between your own pages.

AE Sheets purchases happen on aescripts.com. GA measures outbound clicks there,
but completed sales require an integration provided by aescripts. Consent choices
and ad blockers also mean GA totals will differ from the store's sales totals.

## Setup verification, September 8, 2026

Deployed to the landing-page Worker, version `3481f421-d73d-4e26-81ff-d1bd0fcc9418`.
Build, consent checks, browser acceptance/rejection, preference persistence,
and live CSP checks passed. Google added its cross-domain linker to the checkout
link after consent. The checkout rendered; no paid test purchase was made.
GA's realtime report still showed no events at handoff, so event receipt and
purchase attribution remain unverified. Google warns that new-property data
collection can take up to 48 hours. The test visit uses source `setup_check` and
campaign `analytics_setup`.

The checkout also logged a LemonSqueezy-owned Sentry initialization error
(`Cannot read properties of undefined (reading 'props')` in its hosted app
bundle). Its checkout form still rendered. No third-party code was changed.
