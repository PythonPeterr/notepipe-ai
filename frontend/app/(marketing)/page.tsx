"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Brain,
  CheckCircle,
  ChevronDown,
  Link2,
  Menu,
  Mic,
  Settings2,
  Sparkles,
  X,
  ClipboardList,
  ToggleRight,
  History,
  CalendarCheck,
  Play,
  Check,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Animation variants                                                  */
/* ------------------------------------------------------------------ */
const ease = [0.25, 0.4, 0.25, 1] as const;

const blurUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease },
  },
};

const sectionViewport = { once: true, margin: "-60px" as const };

const staggerContainer = (stagger = 0.08) => ({
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: stagger },
  },
});

const staggerChild = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease },
  },
};

/* ------------------------------------------------------------------ */
/*  Logo Mark                                                           */
/* ------------------------------------------------------------------ */
function LogoMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "h-7 w-7", md: "h-8 w-8", lg: "h-10 w-10" };
  const texts = { sm: "text-[10px]", md: "text-xs", lg: "text-sm" };
  return (
    <div className={`${dims[size]} rounded-lg bg-black flex items-center justify-center`}>
      <span className={`${texts[size]} font-bold text-white leading-none`}>
        |&gt;
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dot Grid Background                                                 */
/* ------------------------------------------------------------------ */
function DotGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.4]"
      style={{
        backgroundImage:
          "radial-gradient(circle, #c5c5c5 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Gradient Orbs (ambient background)                                  */
/* ------------------------------------------------------------------ */
function GradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-[300px] -right-[200px] w-[700px] h-[700px] rounded-full opacity-[0.07]"
        style={{
          background:
            "radial-gradient(circle, #E05A4E 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-[200px] -left-[200px] w-[600px] h-[600px] rounded-full opacity-[0.05]"
        style={{
          background:
            "radial-gradient(circle, #E05A4E 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section Divider — animated pipe connector                           */
/* ------------------------------------------------------------------ */
function PipeDivider() {
  return (
    <div className="flex justify-center py-6">
      <div className="flex flex-col items-center gap-1">
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-neutral-300 to-neutral-300" />
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(224,90,78,0)",
              "0 0 8px 2px rgba(224,90,78,0.3)",
              "0 0 0 0 rgba(224,90,78,0)",
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="h-2.5 w-2.5 rounded-full bg-[#E05A4E]"
        />
        <div className="w-px h-8 bg-gradient-to-b from-neutral-300 via-neutral-300 to-transparent" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  1. Navbar                                                           */
/* ------------------------------------------------------------------ */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease }}
      className="fixed top-0 inset-x-0 z-50 bg-[#EFEFEF]/70 backdrop-blur-xl border-b border-neutral-200/40"
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <LogoMark />
          <span className="text-[15px] font-semibold text-[#171717] tracking-tight">
            Notepipe
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-7 text-[13px] font-medium text-[#999]">
          <a href="#features" className="hover:text-[#171717] transition-colors duration-200">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-[#171717] transition-colors duration-200">
            How it works
          </a>
          <a href="#pricing" className="hover:text-[#171717] transition-colors duration-200">
            Pricing
          </a>
          <a href="#faq" className="hover:text-[#171717] transition-colors duration-200">
            FAQ
          </a>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center h-8 px-3.5 text-[13px] font-medium text-[#6B6B6B] hover:text-[#171717] transition-colors"
          >
            Log in
          </Link>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center h-8 px-4 text-[13px] font-medium text-white bg-[#171717] rounded-lg hover:bg-black transition-colors"
            >
              Get early access
            </Link>
          </motion.div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg border border-neutral-200/60 bg-white/60 backdrop-blur-sm"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-neutral-200/40 bg-[#EFEFEF]/90 backdrop-blur-xl px-6 pb-5 pt-3 space-y-3 overflow-hidden"
          >
            {["Features", "How it works", "Pricing", "FAQ"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => setMobileOpen(false)}
                className="block text-[13px] font-medium text-[#6B6B6B] hover:text-[#171717] py-1"
              >
                {item}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <Link href="/auth/login" className="inline-flex items-center justify-center h-9 px-4 text-[13px] font-medium text-[#171717] bg-white border border-neutral-200 rounded-lg flex-1">
                Log in
              </Link>
              <Link href="/auth/login" className="inline-flex items-center justify-center h-9 px-4 text-[13px] font-medium text-white bg-[#171717] rounded-lg flex-1">
                Get early access
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ------------------------------------------------------------------ */
/*  2. Hero                                                             */
/* ------------------------------------------------------------------ */
function HeroFlowDiagram() {
  const items = [
    { label: "Fireflies", logo: "/logos/fireflies.svg", delay: 1.0 },
    { label: "Notepipe", logo: null, delay: 1.6 },
    { label: "Your CRM", logo: null, delay: 2.2 },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mt-12">
      {items.map((item, i) => (
        <div key={item.label} className="contents">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.5, delay: item.delay, ease }}
            className="flex flex-col items-center gap-2"
          >
            {item.label === "Notepipe" ? (
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(224,90,78,0)",
                    "0 0 20px 4px rgba(224,90,78,0.15)",
                    "0 0 0 0 rgba(224,90,78,0)",
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 3 }}
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-[#171717] flex items-center justify-center"
              >
                <span className="text-lg sm:text-xl font-bold text-white">|&gt;</span>
              </motion.div>
            ) : item.label === "Your CRM" ? (
              <div className="flex -space-x-2">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white border border-neutral-200/80 shadow-sm flex items-center justify-center p-2.5 z-30">
                  <Image src="/logos/hubspot.svg" alt="HubSpot" width={36} height={36} />
                </div>
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white border border-neutral-200/80 shadow-sm flex items-center justify-center p-2.5 z-20">
                  <Image src="/logos/pipedrive.svg" alt="Pipedrive" width={36} height={36} />
                </div>
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white border border-neutral-200/80 shadow-sm flex items-center justify-center p-2.5 z-10">
                  <Image src="/logos/attio.svg" alt="Attio" width={36} height={36} />
                </div>
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white border border-neutral-200/80 shadow-sm flex items-center justify-center p-2.5">
                  <Image src="/logos/zoho.svg" alt="Zoho" width={36} height={36} />
                </div>
              </div>
            ) : (
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white border border-neutral-200/80 shadow-sm flex items-center justify-center p-2.5">
                <Image src={item.logo!} alt={item.label} width={36} height={36} />
              </div>
            )}
            <span className={`text-[10px] sm:text-xs font-medium ${item.label === "Notepipe" ? "text-[#171717] font-semibold" : "text-[#999]"}`}>
              {item.label}
            </span>
          </motion.div>

          {/* Arrow connector */}
          {i < items.length - 1 && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.3, delay: item.delay + 0.4 }}
              className="origin-left self-start mt-5 sm:mt-6"
            >
              <svg width="40" height="12" viewBox="0 0 40 12" fill="none" className="hidden sm:block">
                <line x1="0" y1="6" x2="32" y2="6" stroke="#d4d4d4" strokeWidth="1.5" strokeDasharray="4 3" />
                <path d="M30 2 L38 6 L30 10" stroke="#d4d4d4" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg width="24" height="12" viewBox="0 0 24 12" fill="none" className="sm:hidden">
                <line x1="0" y1="6" x2="16" y2="6" stroke="#d4d4d4" strokeWidth="1.5" strokeDasharray="3 2" />
                <path d="M14 2 L22 6 L14 10" stroke="#d4d4d4" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}

function Hero() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.97]);

  return (
    <motion.section
      ref={heroRef}
      style={{ opacity: heroOpacity, scale: heroScale }}
      className="relative pt-28 pb-12 md:pt-40 md:pb-20 px-6 overflow-hidden"
    >
      <DotGrid />
      <GradientOrbs />

      <div className="relative mx-auto max-w-5xl text-center">
        {/* Beta pill */}
        <motion.div
          initial={{ opacity: 0, y: -8, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm border border-neutral-200/60 text-[11px] font-medium text-[#999] mb-8"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#E05A4E] animate-pulse" />
          Now in beta &middot; Free for early adopters
        </motion.div>

        {/* Heading */}
        <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-black tracking-[-0.04em] leading-[1.1]">
          <motion.span
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease, delay: 0.2 }}
            className="text-[#171717] block"
          >
            Notes flow
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease, delay: 0.35 }}
            className="text-[#171717] block"
          >
            into your CRM
          </motion.span>
        </h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease, delay: 0.5 }}
          className="mt-5 text-[15px] sm:text-[17px] text-[#6B6B6B] max-w-lg mx-auto leading-relaxed tracking-[-0.01em]"
        >
          Meeting ends. AI extracts. CRM updates.{" "}
          <span className="text-[#171717] font-medium">You do nothing.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease, delay: 0.65 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/auth/login"
              className="group inline-flex items-center gap-2 justify-center h-11 px-6 text-[13px] font-medium text-white bg-[#171717] rounded-lg hover:bg-black transition-all duration-200 shadow-lg shadow-neutral-900/10"
            >
              Get early access
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <a
              href="#how-it-works"
              className="group inline-flex items-center gap-2 justify-center h-11 px-6 text-[13px] font-medium text-[#6B6B6B] bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:text-[#171717] transition-all duration-200"
            >
              <Play className="h-3 w-3" />
              See how it works
            </a>
          </motion.div>
        </motion.div>

        {/* Flow diagram */}
        <HeroFlowDiagram />

        {/* Product preview */}
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease, delay: 2.8 }}
          className="mt-14 mx-auto max-w-4xl"
        >
          <div className="relative group">
            {/* Glow behind */}
            <div className="absolute -inset-1 bg-gradient-to-b from-neutral-200/50 via-transparent to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative bg-white rounded-2xl border border-neutral-200 shadow-2xl shadow-neutral-400/15 overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-neutral-200 bg-[#FAFAFA]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
                <div className="ml-3 flex-1 h-5 bg-neutral-100 rounded-md flex items-center justify-center">
                  <span className="text-[10px] text-neutral-500 font-medium">
                    app.notepipe.ai
                  </span>
                </div>
              </div>

              {/* Dashboard */}
              <div className="p-4 md:p-5 bg-[#F7F7F7]">
                <div className="grid grid-cols-4 gap-2.5 mb-3.5">
                  {[
                    { label: "Total Runs", value: "247", change: "+12%" },
                    { label: "Success Rate", value: "98.4%", change: "+0.3%" },
                    { label: "Contacts", value: "1,024", change: "+48" },
                    { label: "Meetings", value: "312", change: "+23" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl border border-neutral-200 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
                          {stat.label}
                        </span>
                        <span className="text-[9px] font-semibold text-emerald-600">
                          {stat.change}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-[#171717] mt-0.5">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                  <div className="px-3.5 py-2 border-b border-neutral-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#171717]">Recent Runs</span>
                    <span className="text-[10px] text-neutral-500 font-medium">View all</span>
                  </div>
                  {[
                    { meeting: "Discovery Call — Acme Corp", crm: "HubSpot", time: "2m ago" },
                    { meeting: "Demo — TechStart Inc", crm: "Pipedrive", time: "1h ago" },
                    { meeting: "Follow-up — Global Solutions", crm: "HubSpot", time: "3h ago" },
                  ].map((run) => (
                    <div key={run.meeting} className="flex items-center justify-between px-3.5 py-2.5 border-b border-neutral-100 last:border-0">
                      <span className="text-[12px] font-medium text-[#171717] truncate max-w-[200px]">
                        {run.meeting}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-semibold">
                          {run.crm}
                        </span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          success
                        </span>
                        <span className="text-[9px] text-neutral-500 font-medium">{run.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5, duration: 1 }}
          className="mt-10 flex flex-col items-center gap-1.5"
        >
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-4 w-4 text-neutral-300" />
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  3. Social Proof                                                     */
/* ------------------------------------------------------------------ */
function SocialProof() {
  const companies = ["Acme Corp", "TechStart", "Velocity", "CloudBase", "SignalHQ", "DataFlow", "BrightSales", "ClosePeak"];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={sectionViewport}
      variants={blurUp}
      className="py-10 overflow-hidden"
    >
      <p className="text-center text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 mb-6 px-6">
        Trusted by sales teams at
      </p>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#EFEFEF] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#EFEFEF] to-transparent z-10 pointer-events-none" />
        <div className="flex gap-12 animate-marquee">
          {[...companies, ...companies].map((company, i) => (
            <span
              key={`${company}-${i}`}
              className="text-base sm:text-lg font-semibold text-neutral-300 select-none tracking-tight whitespace-nowrap shrink-0"
            >
              {company}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  4. How It Works                                                     */
/* ------------------------------------------------------------------ */
function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Link2,
      title: "Connect",
      subtitle: "Fireflies + your CRM",
      description: "Link your Fireflies.ai account and connect HubSpot or Pipedrive. Simple setup, takes 30 seconds.",
    },
    {
      number: "02",
      icon: Settings2,
      title: "Configure",
      subtitle: "Your extraction template",
      description: "Choose what to extract: contacts, companies, deal stages, follow-ups. Pick a template or write your own prompt.",
    },
    {
      number: "03",
      icon: CheckCircle,
      title: "Automate",
      subtitle: "Meeting ends, CRM updates",
      description: "When a call finishes, Notepipe extracts structured data and writes it to your CRM. Completely hands-off.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 px-6 scroll-mt-20">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          variants={blurUp}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#E05A4E] mb-4">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-[3.25rem] font-black tracking-[-0.03em] leading-[1.05]">
            <span className="text-[#171717]">Three steps.</span>{" "}
            <span className="bg-gradient-to-r from-neutral-400 to-neutral-300 bg-clip-text text-transparent">Zero effort.</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          variants={staggerContainer(0.12)}
          className="grid md:grid-cols-3 gap-4"
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              variants={staggerChild}
              className="group relative"
            >
              <div className="relative bg-white rounded-2xl border border-neutral-200 p-7 h-full hover:shadow-xl hover:shadow-neutral-200/40 transition-all duration-500">
                {/* Step number */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] font-bold text-neutral-300 tracking-wider">
                    STEP {step.number}
                  </span>
                  <div className="h-10 w-10 rounded-xl bg-[#FAFAFA] border border-neutral-100 flex items-center justify-center group-hover:bg-[#171717] group-hover:border-[#171717] transition-all duration-300">
                    <step.icon className="h-4 w-4 text-neutral-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#171717] tracking-tight">{step.title}</h3>
                <p className="text-[13px] font-medium text-[#E05A4E] mt-0.5 mb-3">{step.subtitle}</p>
                <p className="text-[13px] text-[#6B6B6B] leading-relaxed">{step.description}</p>
              </div>

              {/* Connector arrow */}
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-2 -translate-y-1/2 z-10">
                  <ChevronDown className="h-4 w-4 text-neutral-300 -rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  5. Features                                                         */
/* ------------------------------------------------------------------ */
function Features() {
  const features = [
    {
      icon: Brain,
      title: "Configurable extraction",
      description: "Define exactly what to pull from every call — contacts, companies, deal stages, budget, timeline.",
    },
    {
      icon: Link2,
      title: "4 CRM integrations",
      description: "HubSpot, Pipedrive, Attio, and Zoho CRM. Connect in one click and start automating.",
    },
    {
      icon: ClipboardList,
      title: "Prompt templates",
      description: "Pre-built for B2B sales, discovery, recruitment, and custom. Tweak or build your own.",
    },
    {
      icon: ToggleRight,
      title: "CRM action toggles",
      description: "Choose what gets created — contacts, companies, notes, deal stages, follow-ups.",
    },
    {
      icon: CalendarCheck,
      title: "Follow-up extraction",
      description: "Capture every next step, action item, and follow-up date mentioned in the call.",
    },
    {
      icon: History,
      title: "Run history",
      description: "Full log of every automation with extracted data, CRM results, and one-click re-run.",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 px-6 scroll-mt-20">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          variants={blurUp}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#E05A4E] mb-4">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-[3.25rem] font-black tracking-[-0.03em] leading-[1.05]">
            <span className="text-[#171717]">Everything</span>{" "}
            <span className="bg-gradient-to-r from-neutral-400 to-neutral-300 bg-clip-text text-transparent">you need</span>
          </h2>
          <p className="mt-4 text-[15px] text-[#6B6B6B] max-w-md mx-auto">
            From transcript to CRM in seconds. No manual work, no data left behind.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          variants={staggerContainer(0.06)}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={staggerChild}
              className="group relative"
            >
              {/* Hover glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-b from-[#E05A4E]/0 to-[#E05A4E]/0 rounded-2xl group-hover:from-[#E05A4E]/5 group-hover:to-transparent transition-all duration-500 blur-sm" />

              <div className="relative bg-white rounded-2xl border border-neutral-200 p-6 h-full hover:shadow-lg hover:shadow-neutral-200/40 transition-all duration-500">
                <div className="h-9 w-9 rounded-xl bg-[#FAFAFA] border border-neutral-100 flex items-center justify-center mb-4 group-hover:bg-[#171717] group-hover:border-[#171717] transition-all duration-300">
                  <feature.icon className="h-4 w-4 text-neutral-400 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-[14px] font-bold text-[#171717] mb-1.5 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
                  {feature.description}
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
/*  6. Demo Visual                                                      */
/* ------------------------------------------------------------------ */
function DemoVisual() {
  const transcriptLines = [
    { speaker: "Sarah", text: "We're looking at about 200 seats for the initial rollout." },
    { speaker: "John", text: "Great. And the timeline — are you looking at Q2?" },
    { speaker: "Sarah", text: "Yes, ideally April. Budget is approved for $45k annual." },
    { speaker: "John", text: "Perfect. Let me send over the enterprise proposal..." },
    { speaker: "Sarah", text: "Sounds good. Can we schedule a follow-up next Thursday?" },
  ];

  return (
    <section className="py-20 md:py-28 px-6">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          variants={blurUp}
          className="text-center mb-12"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#E05A4E] mb-4">
            See it in action
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-[3.25rem] font-black tracking-[-0.03em] leading-[1.05]">
            <span className="text-[#171717]">Transcript in,</span>{" "}
            <span className="bg-gradient-to-r from-neutral-400 to-neutral-300 bg-clip-text text-transparent">CRM data out</span>
          </h2>
          <p className="mt-4 text-[15px] text-[#6B6B6B] max-w-md mx-auto">
            This is what lands in your CRM after every meeting.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={sectionViewport}
          transition={{ duration: 0.8, ease }}
          className="relative group"
        >
          <div className="absolute -inset-2 bg-gradient-to-b from-neutral-200/30 via-transparent to-transparent rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="relative bg-white rounded-2xl border border-neutral-200 shadow-xl shadow-neutral-300/20 overflow-hidden">
            {/* Chrome */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-neutral-200 bg-[#FAFAFA]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
              <div className="ml-3 flex-1 h-5 bg-neutral-100 rounded-md flex items-center justify-center">
                <span className="text-[10px] text-neutral-500 font-medium">
                  Notepipe — Run #247
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2">
              {/* Transcript */}
              <div className="p-5 md:p-7 border-b md:border-b-0 md:border-r border-neutral-200">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-5 w-5 rounded-md bg-neutral-100 flex items-center justify-center">
                    <Mic className="h-3 w-3 text-neutral-400" />
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Transcript
                  </span>
                </div>
                <div className="space-y-3">
                  {transcriptLines.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: i < 3 ? 1 : 0.35 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                      className="flex gap-2"
                    >
                      <span className="text-[11px] font-semibold text-[#171717] shrink-0 w-10">
                        {line.speaker}
                      </span>
                      <span className="text-[12px] text-[#999] leading-relaxed">
                        {line.text}
                      </span>
                    </motion.div>
                  ))}
                  <p className="text-[11px] text-neutral-300 italic mt-4">
                    + 47 minutes of transcript...
                  </p>
                </div>
              </div>

              {/* Extracted */}
              <div className="p-5 md:p-7">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-5 w-5 rounded-md bg-[#E05A4E]/10 flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-[#E05A4E]" />
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Extracted
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="rounded-xl bg-[#FAFAFA] border border-neutral-200 p-3">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Contact</span>
                    <p className="text-[13px] font-semibold text-[#171717] mt-1">Sarah Chen</p>
                    <p className="text-[11px] text-[#999]">VP of Sales &middot; sarah@acmecorp.com</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl bg-[#FAFAFA] border border-neutral-200 p-3">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Company</span>
                      <p className="text-[13px] font-semibold text-[#171717] mt-1">Acme Corp</p>
                      <p className="text-[11px] text-[#999]">SaaS</p>
                    </div>
                    <div className="rounded-xl bg-[#FAFAFA] border border-neutral-200 p-3">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Deal</span>
                      <p className="text-[13px] font-semibold text-[#171717] mt-1">Proposal</p>
                      <p className="text-[11px] text-[#999]">$45,000/yr</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#FAFAFA] border border-neutral-200 p-3">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Follow-ups</span>
                    <div className="mt-2 space-y-1.5">
                      {[
                        "Send enterprise proposal — Tomorrow",
                        "Schedule follow-up call — Next Thu",
                        "Loop in solutions engineer — Next Thu",
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-[11px] text-[#171717]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status bar */}
            <div className="border-t border-neutral-200 bg-[#FAFAFA] px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-medium text-emerald-600">Synced to HubSpot</span>
              </div>
              <span className="text-[10px] text-neutral-400">3.2s</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  7. Pricing                                                          */
/* ------------------------------------------------------------------ */
function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "29",
      description: "For small sales teams getting started.",
      inverted: false,
      features: [
        "Up to 100 meetings/month",
        "1 CRM connection",
        "3 prompt templates",
        "7-day run history",
        "Email support",
      ],
    },
    {
      name: "Pro",
      price: "49",
      badge: "Most popular",
      description: "For growing teams that need full control.",
      inverted: true,
      features: [
        "Unlimited meetings",
        "Multiple CRM connections",
        "Unlimited templates",
        "Full run history",
        "Priority support",
        "Custom extraction fields",
        "Team management",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 px-6 scroll-mt-20">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          variants={blurUp}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#E05A4E] mb-4">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-[3.25rem] font-black tracking-[-0.03em] leading-[1.05]">
            <span className="text-[#171717]">Simple,</span>{" "}
            <span className="bg-gradient-to-r from-neutral-400 to-neutral-300 bg-clip-text text-transparent">transparent</span>
          </h2>
          <p className="mt-4 text-[15px] text-[#6B6B6B] max-w-sm mx-auto">
            14-day free trial. No credit card required.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          variants={staggerContainer(0.12)}
          className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={staggerChild}
              className="group relative"
            >
              {plan.inverted && (
                <div className="absolute -inset-0.5 bg-gradient-to-b from-[#E05A4E]/20 to-transparent rounded-2xl blur-lg opacity-60" />
              )}

              <div className={`relative rounded-2xl border p-7 transition-all duration-500 ${
                plan.inverted
                  ? "bg-[#171717] border-neutral-800 hover:shadow-2xl hover:shadow-neutral-900/30"
                  : "bg-white border-neutral-200 hover:shadow-xl hover:shadow-neutral-200/30"
              }`}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className={`text-[15px] font-bold ${plan.inverted ? "text-white" : "text-[#171717]"}`}>
                    {plan.name}
                  </h3>
                  {plan.badge && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#E05A4E] bg-[#E05A4E]/10 px-2 py-0.5 rounded-full">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-0.5 mb-1">
                  <span className={`text-[11px] font-medium ${plan.inverted ? "text-neutral-500" : "text-neutral-400"} self-start mt-1.5`}>
                    &euro;
                  </span>
                  <span className={`text-[3.5rem] font-black tracking-[-0.04em] leading-none ${plan.inverted ? "text-white" : "text-[#171717]"}`}>
                    {plan.price}
                  </span>
                </div>
                <p className={`text-[12px] mb-6 ${plan.inverted ? "text-neutral-500" : "text-neutral-400"}`}>
                  per user / month
                </p>

                <ul className="space-y-2.5 mb-7">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className={`h-3.5 w-3.5 shrink-0 ${plan.inverted ? "text-[#E05A4E]" : "text-neutral-300"}`} />
                      <span className={`text-[13px] ${plan.inverted ? "text-neutral-300" : "text-[#999]"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/auth/login"
                    className={`block w-full text-center h-10 leading-[40px] text-[13px] font-medium rounded-lg transition-all duration-200 ${
                      plan.inverted
                        ? "bg-white text-[#171717] hover:bg-neutral-100"
                        : "bg-[#171717] text-white hover:bg-black shadow-sm"
                    }`}
                  >
                    Start free trial
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  8. FAQ                                                              */
/* ------------------------------------------------------------------ */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-neutral-200/60 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 text-left group"
      >
        <span className="text-[13px] sm:text-[14px] font-semibold text-[#171717] pr-4 group-hover:text-[#E05A4E] transition-colors duration-200">
          {question}
        </span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <div className="h-5 w-5 rounded-md bg-neutral-100 flex items-center justify-center group-hover:bg-[#E05A4E]/10 transition-colors">
            <span className="text-xs text-neutral-400 group-hover:text-[#E05A4E] leading-none">+</span>
          </div>
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-[13px] text-[#6B6B6B] leading-relaxed pr-10">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Faq() {
  const faqs = [
    {
      question: "Does this replace Fireflies?",
      answer: "No. Notepipe works on top of Fireflies. You keep using Fireflies to record and transcribe your meetings. Notepipe processes those transcripts and pushes structured data to your CRM automatically.",
    },
    {
      question: "Which CRMs are supported?",
      answer: "We support HubSpot, Pipedrive, Attio, and Zoho CRM. All connect in seconds via OAuth. More integrations are on our roadmap.",
    },
    {
      question: "How is this different from Fireflies' native CRM integration?",
      answer: "The native integration dumps a basic transcript. Notepipe uses AI to extract structured data — contacts, companies, deal stages, follow-ups — and writes them to the correct CRM fields. You control exactly what gets extracted via prompt templates.",
    },
    {
      question: "Is my transcript data stored?",
      answer: "No. Transcripts are processed in memory and discarded immediately. We never persist raw transcript data. Only structured extraction results are stored for your run history.",
    },
    {
      question: "Can I customize what gets extracted?",
      answer: "Absolutely. Prompt templates give you full control. Use our pre-built templates for common workflows or write your own. Toggle exactly which CRM actions run after extraction.",
    },
  ];

  return (
    <section id="faq" className="py-20 md:py-28 px-6 scroll-mt-20">
      <div className="mx-auto max-w-xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          variants={blurUp}
          className="text-center mb-10"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#E05A4E] mb-4">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em]">
            <span className="text-[#171717]">Questions?</span>{" "}
            <span className="bg-gradient-to-r from-neutral-400 to-neutral-300 bg-clip-text text-transparent">Answers.</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={sectionViewport}
          variants={blurUp}
          className="bg-white rounded-2xl border border-neutral-200 px-6"
        >
          {faqs.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  9. Final CTA                                                        */
/* ------------------------------------------------------------------ */
function FinalCta() {
  return (
    <section className="py-20 md:py-28 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        viewport={sectionViewport}
        transition={{ duration: 0.8, ease }}
        className="relative mx-auto max-w-4xl overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-[#171717] rounded-2xl" />
        <div
          className="absolute top-0 right-0 w-[400px] h-[400px] opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #E05A4E 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-[300px] h-[300px] opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #E05A4E 0%, transparent 70%)" }}
        />

        <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-[3.25rem] font-black text-white tracking-[-0.03em] leading-[1.05]">
            Stop doing CRM
            <br />
            <span className="bg-gradient-to-r from-neutral-500 to-neutral-600 bg-clip-text text-transparent">
              data entry.
            </span>
          </h2>
          <p className="mt-4 text-[15px] text-neutral-500 max-w-md mx-auto">
            Join sales teams saving hours every week. Free trial, no card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/auth/login"
                className="group inline-flex items-center gap-2 justify-center h-11 px-6 text-[13px] font-medium text-[#171717] bg-white rounded-lg hover:bg-neutral-100 transition-all duration-200"
              >
                Get early access
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <a
                href="mailto:hello@notepipe.ai"
                className="inline-flex items-center justify-center h-11 px-6 text-[13px] font-medium text-neutral-500 border border-neutral-700 rounded-lg hover:text-neutral-300 hover:border-neutral-500 transition-all duration-200"
              >
                Talk to us
              </a>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                              */
/* ------------------------------------------------------------------ */
function Footer() {
  return (
    <footer className="border-t border-neutral-200/40 py-8 px-6">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <LogoMark size="sm" />
          <span className="text-[13px] font-semibold text-[#171717]">Notepipe</span>
        </div>
        <div className="flex items-center gap-5 text-[11px] text-neutral-400">
          <a href="#" className="hover:text-[#171717] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[#171717] transition-colors">Terms</a>
          <span>&copy; {new Date().getFullYear()} Notepipe</span>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */
export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-[#EFEFEF] relative">
      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        ::selection {
          background-color: rgba(224, 90, 78, 0.15);
          color: #171717;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>

      <div className="relative z-[2]">
        <Navbar />
        <Hero />
        <SocialProof />
        <PipeDivider />
        <HowItWorks />
        <PipeDivider />
        <Features />
        <PipeDivider />
        <DemoVisual />
        <PipeDivider />
        <Pricing />
        <Faq />
        <FinalCta />
        <Footer />
      </div>
    </div>
  );
}
