"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  CheckCircle,
  ChevronRight,
  FileText,
  Link2,
  Menu,
  Mic,
  Workflow,
  Settings2,
  Sparkles,
  Users,
  X,
  Zap,
  Building2,
  CalendarCheck,
  ClipboardList,
  Shield,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Reusable animation variants                                        */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

const sectionViewport = { once: true, margin: "-100px" as const };

const staggerContainer = (stagger = 0.1) => ({
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: stagger },
  },
});

const staggerChild = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="fixed top-0 inset-x-0 z-50 bg-[#EFEFEF]/80 backdrop-blur-md border-b border-neutral-200/60"
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center">
            <Workflow className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-[#171717] tracking-tight">
            Notepipe
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B6B6B]">
          <a href="#features" className="hover:text-[#171717] transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-[#171717] transition-colors">
            How it works
          </a>
          <a href="#pricing" className="hover:text-[#171717] transition-colors">
            Pricing
          </a>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium text-[#171717] bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
          >
            Log in
          </Link>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium text-white bg-black rounded-md hover:bg-neutral-800 transition-colors"
            >
              Get Started
            </Link>
          </motion.div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden h-9 w-9 flex items-center justify-center rounded-md border border-neutral-200 bg-white"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-4 w-4 text-[#171717]" />
          ) : (
            <Menu className="h-4 w-4 text-[#171717]" />
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200/60 bg-[#EFEFEF] px-6 pb-6 pt-4 space-y-4">
          <a
            href="#features"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-medium text-[#6B6B6B] hover:text-[#171717]"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-medium text-[#6B6B6B] hover:text-[#171717]"
          >
            How it works
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-medium text-[#6B6B6B] hover:text-[#171717]"
          >
            Pricing
          </a>
          <div className="flex gap-3 pt-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium text-[#171717] bg-white border border-neutral-200 rounded-md flex-1"
            >
              Log in
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium text-white bg-black rounded-md flex-1"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </motion.nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <section className="pt-32 pb-20 md:pt-44 md:pb-28 px-6">
      <div className="mx-auto max-w-4xl text-center">
        {/* Beta pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 text-xs font-medium text-[#6B6B6B] mb-8 shadow-sm"
        >
          <span className="h-2 w-2 rounded-full bg-[#E05A4E] animate-pulse" />
          Now in beta
        </motion.div>

        {/* Two-tone heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08]">
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="text-[#171717] block"
          >
            Meeting notes flow
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
            className="text-[#6B6B6B] block"
          >
            into your CRM
          </motion.span>
        </h1>

        {/* Subtitle with inline pill badges */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.45 }}
          className="mt-6 text-base sm:text-lg text-[#6B6B6B] max-w-2xl mx-auto leading-relaxed"
        >
          Automatically extract{" "}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-[#171717] align-middle">
            <Users className="h-3 w-3" />
            Contacts
          </span>
          ,{" "}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-[#171717] align-middle">
            <Building2 className="h-3 w-3" />
            Companies
          </span>
          , and{" "}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-[#171717] align-middle">
            <CalendarCheck className="h-3 w-3" />
            Follow-ups
          </span>{" "}
          from every sales call.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.6 }}
          className="flex items-center justify-center gap-3 mt-10"
        >
          <motion.a
            whileTap={{ scale: 0.98 }}
            href="#pricing"
            className="inline-flex items-center justify-center h-11 px-6 text-sm font-medium text-[#171717] bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
          >
            Talk to Sales
          </motion.a>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 justify-center h-11 px-6 text-sm font-medium text-white bg-black rounded-md hover:bg-neutral-800 transition-colors"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Bold Statement                                                     */
/* ------------------------------------------------------------------ */
function BoldStatement() {
  const pills = [
    "Contact name",
    "Email address",
    "Company",
    "Deal stage",
    "Budget discussed",
    "Next steps",
    "Pain points",
    "Decision makers",
    "Timeline",
    "Competitors mentioned",
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={sectionViewport}
      variants={fadeUp}
      className="py-20 md:py-28 px-6"
    >
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#171717] leading-snug tracking-tight">
          Sales teams spend hours on CRM data entry after every meeting.{" "}
          <span className="text-[#6B6B6B]">Notepipe makes it automatic.</span>
        </p>
      </div>

      {/* Scrolling pill marquee */}
      <div className="mt-14 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#EFEFEF] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#EFEFEF] to-transparent z-10 pointer-events-none" />
        <div className="flex gap-3 animate-marquee">
          {[...pills, ...pills].map((pill, i) => (
            <span
              key={i}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-neutral-200 text-sm font-medium text-[#171717] whitespace-nowrap shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#E05A4E]" />
              {pill}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard Preview                                                  */
/* ------------------------------------------------------------------ */
function DashboardPreview() {
  const mockStats = [
    { label: "Total Runs", value: "247", icon: Zap },
    { label: "Success Rate", value: "98%", icon: CheckCircle },
    { label: "Contacts Created", value: "1,024", icon: Users },
    { label: "Meetings Processed", value: "312", icon: Mic },
  ];

  const mockRuns = [
    {
      meeting: "Discovery Call - Acme Corp",
      crm: "HubSpot",
      status: "success",
      date: "Feb 21, 10:30",
    },
    {
      meeting: "Demo - TechStart Inc",
      crm: "Pipedrive",
      status: "success",
      date: "Feb 21, 09:15",
    },
    {
      meeting: "Follow-up - Global Solutions",
      crm: "HubSpot",
      status: "processing",
      date: "Feb 20, 16:45",
    },
    {
      meeting: "Intro Call - DataFlow Ltd",
      crm: "HubSpot",
      status: "success",
      date: "Feb 20, 14:00",
    },
  ];

  return (
    <section className="pb-20 md:pb-28 px-6">
      <div className="mx-auto max-w-5xl">
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={sectionViewport}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center text-xs font-medium uppercase tracking-widest text-[#6B6B6B] mb-6"
        >
          Your automation dashboard
        </motion.p>

        {/* Dashboard card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={sectionViewport}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="bg-white rounded-2xl border border-neutral-200 shadow-lg shadow-neutral-200/50 overflow-hidden"
        >
          {/* Fake window chrome */}
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-neutral-100">
            <motion.span
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, ease: "easeOut", delay: 0.5 }}
              className="h-3 w-3 rounded-full bg-[#FF5F56]"
            />
            <motion.span
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, ease: "easeOut", delay: 0.6 }}
              className="h-3 w-3 rounded-full bg-[#FFBD2E]"
            />
            <motion.span
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, ease: "easeOut", delay: 0.7 }}
              className="h-3 w-3 rounded-full bg-[#27C93F]"
            />
            <span className="ml-4 text-xs text-neutral-400 font-medium">
              app.notepipe.ai
            </span>
          </div>

          <div className="p-5 md:p-6 space-y-5">
            {/* Stats row */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer(0.1)}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              {mockStats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={staggerChild}
                  className="bg-[#FAFAFA] rounded-xl border border-neutral-100 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
                      {stat.label}
                    </span>
                    <stat.icon className="h-3.5 w-3.5 text-neutral-300" />
                  </div>
                  <p className="text-2xl font-bold text-[#171717]">{stat.value}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Recent runs table */}
            <div className="rounded-xl border border-neutral-100 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-neutral-100 bg-[#FAFAFA]">
                <span className="text-xs font-semibold text-neutral-700">
                  Recent Runs
                </span>
              </div>
              <div className="divide-y divide-neutral-100">
                {mockRuns.map((run, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-[#171717] text-xs sm:text-sm truncate max-w-[200px] sm:max-w-none">
                      {run.meeting}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-md border border-neutral-200 font-medium">
                        {run.crm}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          run.status === "success"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {run.status}
                      </span>
                      <span className="text-[10px] text-neutral-400 hidden sm:inline">
                        {run.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features Grid                                                      */
/* ------------------------------------------------------------------ */
function FeaturesGrid() {
  const features = [
    {
      icon: Brain,
      title: "Smart Extraction",
      description:
        "Claude AI reads your meeting transcripts and pulls structured CRM data — contacts, companies, deal details, and follow-up actions.",
    },
    {
      icon: Settings2,
      title: "Template Control",
      description:
        "Configure exactly what gets extracted with customizable prompt templates. Fine-tune for your sales process and CRM fields.",
    },
    {
      icon: Link2,
      title: "Instant CRM Sync",
      description:
        "Contacts, companies, and notes flow directly to HubSpot or Pipedrive. No manual copy-paste, no missed data.",
    },
    {
      icon: Shield,
      title: "Full Audit Trail",
      description:
        "Every run is logged with the extracted data, CRM write results, and timestamps. Complete visibility into every automation.",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 px-6 scroll-mt-20">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          variants={fadeUp}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#171717] tracking-tight">
            Everything you need
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#6B6B6B] max-w-xl mx-auto">
            From transcript to CRM in seconds. No manual work, no context
            switching, no data left behind.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          variants={staggerContainer(0.1)}
          className="grid md:grid-cols-2 gap-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={staggerChild}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
              className="group bg-white rounded-xl border border-neutral-200 p-7 hover:shadow-lg hover:shadow-neutral-200/50 transition-all duration-300"
            >
              <div className="h-11 w-11 rounded-xl bg-[#FAFAFA] border border-neutral-100 flex items-center justify-center mb-5 group-hover:bg-black group-hover:border-black transition-colors duration-300">
                <feature.icon className="h-5 w-5 text-[#6B6B6B] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-lg font-bold text-[#171717] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How It Works                                                       */
/* ------------------------------------------------------------------ */
function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Link2,
      title: "Connect",
      description:
        "Link Fireflies.ai and your CRM in 2 clicks. We support HubSpot and Pipedrive with OAuth — no API keys to manage.",
    },
    {
      number: "02",
      icon: Mic,
      title: "Meet",
      description:
        "Have your meetings as usual. Fireflies records and transcribes everything. When the meeting ends, a webhook fires automatically.",
    },
    {
      number: "03",
      icon: Zap,
      title: "Automate",
      description:
        "Notepipe extracts structured data with Claude AI and syncs it to your CRM. Contacts, companies, and follow-ups — all handled.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 px-6 scroll-mt-20">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          variants={fadeUp}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#171717] tracking-tight">
            Three steps. Zero effort.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#6B6B6B] max-w-xl mx-auto">
            Set it up once, then forget about CRM data entry forever.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          variants={staggerContainer(0.15)}
          className="grid md:grid-cols-3 gap-5"
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              variants={staggerChild}
              className="relative"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-14 -right-2.5 w-5">
                  <ChevronRight className="h-5 w-5 text-neutral-300" />
                </div>
              )}
              <div className="bg-white rounded-xl border border-neutral-200 p-7 h-full">
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-3xl font-black text-neutral-200 leading-none">
                    {step.number}
                  </span>
                  <div className="h-11 w-11 rounded-xl bg-black flex items-center justify-center">
                    <step.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#171717] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Integration Logos                                                   */
/* ------------------------------------------------------------------ */
function Integrations() {
  const integrations = [
    { name: "Fireflies.ai", icon: Mic },
    { name: "HubSpot", icon: FileText },
    { name: "Pipedrive", icon: ClipboardList },
    { name: "Claude AI", icon: Brain },
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={sectionViewport}
      variants={fadeUp}
      className="py-16 md:py-20 px-6"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-[#6B6B6B] mb-8">
          Integrates with the tools you already use
        </p>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer(0.08)}
          className="flex items-center justify-center gap-8 md:gap-14 flex-wrap"
        >
          {integrations.map((integration) => (
            <motion.div
              key={integration.name}
              variants={staggerChild}
              className="flex items-center gap-2.5 text-[#171717]"
            >
              <div className="h-10 w-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center">
                <integration.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">{integration.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA Section                                                        */
/* ------------------------------------------------------------------ */
function CtaSection() {
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={sectionViewport}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="bg-white rounded-2xl border border-neutral-200 px-8 py-16 md:px-14 md:py-20 shadow-lg shadow-neutral-200/50"
        >
          <h2 className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight leading-tight">
            Ready to automate your
            <br />
            post-meeting workflow?
          </h2>
          <p className="mt-4 text-base text-[#6B6B6B] max-w-md mx-auto">
            Stop spending hours on CRM data entry. Let Notepipe handle it while
            you focus on closing deals.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <motion.a
              whileTap={{ scale: 0.98 }}
              href="#pricing"
              className="inline-flex items-center justify-center h-11 px-6 text-sm font-medium text-[#171717] bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
            >
              Talk to Sales
            </motion.a>
            <motion.div whileTap={{ scale: 0.98 }}>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 justify-center h-11 px-6 text-sm font-medium text-white bg-black rounded-md hover:bg-neutral-800 transition-colors"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={sectionViewport}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="border-t border-neutral-200/60 py-10 px-6"
    >
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-black flex items-center justify-center">
            <Workflow className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-[#171717]">Notepipe</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-[#6B6B6B]">
          <a href="#" className="hover:text-[#171717] transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-[#171717] transition-colors">
            Terms
          </a>
          <span>&copy; {new Date().getFullYear()} Notepipe. All rights reserved.</span>
        </div>
      </div>
    </motion.footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-[#EFEFEF]">
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      <Navbar />
      <Hero />
      <BoldStatement />
      <DashboardPreview />
      <FeaturesGrid />
      <HowItWorks />
      <Integrations />
      <CtaSection />
      <Footer />
    </div>
  );
}
