/**
 * ============================================================================
 * MANDIBOOK — SITE CONFIGURATION
 * ============================================================================
 *
 * Centralized config for the Multipurpose Mandi Management
 * & Farmer Support Application.
 */

export const siteConfig = {
  name: "MandiBook",
  tagline: "Book Your Mandi Slot, Sell Smarter",
  description:
    "India's digital mandi platform — book slots, check crop prices, and manage your mandi operations seamlessly.",

  url: "https://mandibook.in",
  twitter: "@mandibook",

  nav: {
    cta: {
      text: "Book a Slot",
      href: "/farmer-login",
    },
    signIn: {
      text: "Sign In",
      href: "/farmer-login",
    },
  },

  portals: {
    farmer: { label: "Farmer Portal", href: "/farmer-login" },
    manager: { label: "Manager Portal", href: "/manager-login" },
    admin: { label: "Admin Portal", href: "/admin-login" },
  },
};

export const heroConfig = {
  badge: "Digital Mandi Platform",
  headline: {
    line1: "Book Your",
    line2: "Mandi Slot,",
    accent: "Sell Smarter",
  },
  subheadline:
    "Skip the queue. Book your mandi slot in advance, check live crop prices, and get instant QR confirmation — all from your phone.",
  cta: {
    text: "Book a Slot Now",
    href: "/farmer-login",
  },
};

export const blurHeadlineConfig = {
  text: "MandiBook empowers farmers across India to book mandi slots digitally, check real-time crop prices, and receive instant QR confirmations — reducing wait times, ensuring fair trade, and bringing transparency to every transaction at the mandi.",
};

export const testimonialsConfig = {
  title: "Trusted by farmers & mandis across India",
  autoplayInterval: 10000,
};

export const howItWorksConfig = {
  title: "How MandiBook Works",
  description:
    "Three simple steps to book your mandi slot and sell your produce without waiting in long queues.",
  cta: {
    text: "Get Started",
    href: "/farmer-login",
  },
};

export const faqConfig = {
  title: "Frequently Asked Questions",
  description: "Everything you need to know about using MandiBook.",
  cta: {
    primary: {
      text: "Book a Slot",
      href: "/farmer-login",
    },
    secondary: {
      text: "Contact Support",
      href: "#contact",
    },
  },
};

export const footerConfig = {
  cta: {
    headline: "Start selling smarter at your nearest mandi today",
    placeholder: "Enter your mobile number",
    button: "Get Started",
  },
  copyright: `© ${new Date().getFullYear()} MandiBook. All rights reserved.`,
};

/**
 * ============================================================================
 * FEATURE FLAGS
 * ============================================================================
 */

export const features = {
  smoothScroll: true,
  testimonialAutoplay: true,
  parallaxHero: true,
  blurInHeadline: true,
  i18n: true,
  offlineBanner: true,
};

/**
 * ============================================================================
 * THEME CONFIGURATION
 * ============================================================================
 *
 * Colors are defined in globals.css using CSS custom properties.
 * Palette: Forest Green + Warm Amber + Sage (earthy agriculture theme).
 */

export const themeConfig = {
  defaultTheme: "light" as "light" | "dark" | "system",
  enableSystemTheme: true,
};
