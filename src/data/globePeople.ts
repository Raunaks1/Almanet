import type { GlobeTestimonial } from "@/components/ui/testimonial-globe";

// 10 distinct countries ordered east to west by longitude for smooth continuous rotation:
// 1. Australia (AU) - Sydney (151.21)
// 2. Japan (JP) - Tokyo (139.69)
// 3. Singapore (SG) - Singapore (103.83)
// 4. India (IN) - Mumbai (72.88) [Raunak, Student]
// 5. United Arab Emirates (AE) - Dubai (55.27)
// 6. Germany (DE) - Berlin (13.40)
// 7. Switzerland (CH) - Zurich (8.54)
// 8. United Kingdom (GB) - London (-0.13)
// 9. Canada (CA) - Toronto (-79.38)
// 10. United States (US) - San Francisco (-122.42)

const portrait = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=240&h=240&q=80`;

const raunakPhoto = `${import.meta.env.BASE_URL}profile.png`;

export const globePeople: GlobeTestimonial[] = [
  {
    id: "dev-sydney",
    name: "Dev",
    role: "Alumni",
    city: "Sydney",
    country: "AU",
    lat: -33.87,
    lng: 151.21,
    quote: "Hosting a weekend alumni meetup by the harbor — drop by if you're in Sydney!",
    image: portrait("photo-1500648767791-00dcc994a43e"),
  },
  {
    id: "kenji-tokyo",
    name: "Kenji",
    role: "Alumni",
    city: "Tokyo",
    country: "JP",
    lat: 35.68,
    lng: 139.69,
    quote: "Leading AI robotics research at Tokyo Tech — always open to connect with curious juniors.",
    image: portrait("photo-1507003211169-0a1dd7228f2d"),
  },
  {
    id: "kiran-singapore",
    name: "Kiran",
    role: "Student",
    city: "Singapore",
    country: "SG",
    lat: 1.28,
    lng: 103.83,
    quote: "Looking for a summer internship referral in fintech — happy to share my portfolio.",
    image: portrait("photo-1506794778202-cad84cf45f1d"),
  },
  {
    id: "raunak-mumbai",
    name: "Raunak",
    role: "Student",
    city: "Mumbai",
    country: "IN",
    lat: 19.08,
    lng: 72.88,
    quote: "Connecting directly with alumni for referrals and mock interviews completely transformed my prep.",
    image: raunakPhoto,
  },
  {
    id: "zaid-dubai",
    name: "Zaid",
    role: "Alumni",
    city: "Dubai",
    country: "AE",
    lat: 25.20,
    lng: 55.27,
    quote: "Scaling cloud infrastructure across MENA — reach out if you're exploring tech roles in the Emirates.",
    image: portrait("photo-1501196354995-cbb51c65aaea"),
  },
  {
    id: "lukas-berlin",
    name: "Lukas",
    role: "Student",
    city: "Berlin",
    country: "DE",
    lat: 52.52,
    lng: 13.40,
    quote: "Exchange semester in Germany! Connected with three European alumni within my first week.",
    image: portrait("photo-1519085360753-af0119f7cbe7"),
  },
  {
    id: "elena-zurich",
    name: "Elena",
    role: "Alumni",
    city: "Zurich",
    country: "CH",
    lat: 47.37,
    lng: 8.54,
    quote: "Graduated from ETH Zurich. Always available for mock system design rounds with college batchmates.",
    image: portrait("photo-1573496359142-b8d87734a5a2"),
  },
  {
    id: "meera-london",
    name: "Meera",
    role: "Alumni",
    city: "London",
    country: "GB",
    lat: 51.51,
    lng: -0.13,
    quote: "Open to mentoring students breaking into data roles — book a slot in Messages.",
    image: portrait("photo-1438761681033-6461ffad8d80"),
  },
  {
    id: "priya-toronto",
    name: "Priya",
    role: "Alumni",
    city: "Toronto",
    country: "CA",
    lat: 43.65,
    lng: -79.38,
    quote: "Relocated to Canada last year; happy to share guidance on tech visas and market transitions.",
    image: portrait("photo-1544005313-94ddf0286df2"),
  },
  {
    id: "maya-san-francisco",
    name: "Maya",
    role: "Student",
    city: "San Francisco",
    country: "US",
    lat: 37.77,
    lng: -122.42,
    quote: "Found my startup co-founder right here on Almanet! Couldn't be more grateful.",
    image: portrait("photo-1524504388940-b1c1722653e1"),
  },
];
