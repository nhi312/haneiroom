/* HaneiRoom landing page settings.

   - cta: every element marked data-cta in index.html (the "Explore HaneiRoom"
     buttons). Points at the demo form until the real app or waitlist URL arrives.
     Set newTab: true for a link that leaves the page.
   - demoForm: where the "Book a demo" form sends the email. Set action to a form
     endpoint that accepts a POST with an "email" field (here, Formspree: sign-ups
     are stored in its dashboard and emailed to the form's owner). Until it is set, the form checks the address and says it isn't
     connected yet instead of pretending to send. */
window.HANEI_CONFIG = {
  cta: {
    href: "#demo",
    newTab: false
  },
  demoForm: {
    action: "https://formspree.io/f/xljjrqjb"
  }
};
