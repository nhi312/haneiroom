/* HaneiRoom landing page settings.
   Each entry sets the link (and optionally the label) of every element marked
   with the matching data attribute in index.html. Set newTab: true for links
   that leave the page (app store, sign-up, email).

   - cta (data-cta): the main "Explore HaneiRoom" button. Waitlist URL to come.
   - contact (data-contact): the hero's "Connect With Us" button. Contact link to come.
   - appStore (data-appstore): Chapter 2's "Try It On The App Store" button. App Store URL to come.
   Until the real links arrive, each one points at a section on this page. */
window.HANEI_CONFIG = {
  cta: {
    label: "Explore HaneiRoom",
    href: "#meet-hanei",
    newTab: false
  },
  contact: {
    href: "#finish",
    newTab: false
  },
  appStore: {
    href: "#meet-hanei",
    newTab: false
  }
};
