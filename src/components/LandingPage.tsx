import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import {
  Sparkles, BarChart3, FileText, Shield, Database, Users,
  ArrowRight, CheckCircle, ChevronRight, Star, Zap,
  BookOpen, Award, TrendingUp, Mail, Phone, Building2,
  Linkedin, Twitter, MessageSquare, ClipboardCheck, Globe
} from 'lucide-react';

// Animated counter hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return { count, ref };
}

const features = [
  { icon: Sparkles, title: 'AI Narrative Generation', desc: 'Generate professional SSR narratives with Google Gemini AI for every criterion.' },
  { icon: BarChart3, title: 'Real-time Scoring Dashboard', desc: 'Live CGPA prediction with 7-criteria breakdown and gap analysis.' },
  { icon: ClipboardCheck, title: '7-Criteria Data Management', desc: 'Comprehensive forms for all NAAC criteria with validation and bulk import.' },
  { icon: FileText, title: 'PDF/Word/Excel Export', desc: 'One-click professional reports in multiple formats with evidence links.' },
  { icon: Shield, title: 'Role-Based Access Control', desc: '5-level RBAC from Super Admin to Reviewer with granular permissions.' },
  { icon: Database, title: 'Evidence Document Management', desc: 'Centralized DVV evidence vault with criterion tagging and expiry tracking.' },
];

const modules = [
  { title: 'NAAC SSR Automation', desc: 'Complete 7-criteria data management with AI-powered narratives', status: 'Live', color: 'from-blue-600 to-indigo-600' },
  { title: 'NIRF Ranking Module', desc: '5-parameter NIRF score computation with trend analysis', status: 'New', color: 'from-violet-600 to-purple-600' },
  { title: 'AQAR Generation', desc: 'Auto-populated annual quality reports from SSR data', status: 'New', color: 'from-emerald-600 to-teal-600' },
  { title: 'NBA SAR Module', desc: 'CO-PO mapping, attainment engine, and SAR report generation', status: 'New', color: 'from-orange-500 to-red-500' },
];

const testimonials = [
  { quote: "UACAS reduced our SSR preparation time from 6 months to 6 weeks. The AI narratives are remarkably accurate.", name: "Dr. Rajesh Kumar", role: "IQAC Coordinator", institution: "National Institute of Technology" },
  { quote: "The real-time scoring dashboard gave us visibility into exactly where we stood. We went from B++ to A grade.", name: "Prof. Meera Sharma", role: "Vice Chancellor", institution: "State University of Engineering" },
  { quote: "Evidence management was our biggest pain point. UACAS solved it completely with the centralized vault.", name: "Dr. Anil Patel", role: "Registrar", institution: "Institute of Management Studies" },
];

const pricingPlans = [
  { name: 'Basic', price: '₹49,999', period: '/year', features: ['NAAC SSR Module', 'Up to 5 users', 'PDF/Word export', 'Email support'], highlighted: false },
  { name: 'Professional', price: '₹99,999', period: '/year', features: ['Everything in Basic', 'NIRF + AQAR modules', 'Up to 25 users', 'AI narratives', 'Priority support'], highlighted: true },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['All modules', 'Unlimited users', 'NBA SAR module', 'On-premise deployment', 'Dedicated support', 'Custom integrations'], highlighted: false },
];

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  const [demoForm, setDemoForm] = useState({ name: '', institution: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const stat1 = useCounter(7);
  const stat2 = useCounter(300);
  const stat3 = useCounter(100);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoForm),
      });
      if (res.ok) {
        setSubmitted(true);
        setDemoForm({ name: '', institution: '', email: '', phone: '', message: '' });
      } else {
        alert('Failed to submit. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-600/20">U</div>
            <span className="text-xl font-bold tracking-tight text-slate-900">UACAS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button onClick={() => scrollTo('features')} className="hover:text-slate-900 transition-colors">Features</button>
            <button onClick={() => scrollTo('modules')} className="hover:text-slate-900 transition-colors">Modules</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-slate-900 transition-colors">Pricing</button>
            <button onClick={() => scrollTo('contact')} className="hover:text-slate-900 transition-colors">Contact</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">
              Sign In
            </button>
            <button onClick={() => scrollTo('contact')} className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/10 transition-all">
              Book a Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-violet-400/10 to-blue-400/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full mb-6">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">AI-Powered Accreditation Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
              Automate your{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                NAAC Accreditation
              </span>
              {' '}with confidence
            </h1>
            <p className="text-xl text-slate-500 mt-6 leading-relaxed max-w-2xl">
              Automate your SSR. Predict your grade. Submit with confidence. The most comprehensive accreditation management platform for Indian universities.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <button
                onClick={() => scrollTo('contact')}
                className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all flex items-center gap-2 text-base"
              >
                Book a Demo <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollTo('features')}
                className="px-8 py-4 bg-white border-2 border-slate-200 font-bold rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2 text-base text-slate-700"
              >
                View Features <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
          >
            <div ref={stat1.ref} className="p-6 bg-white/70 backdrop-blur rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-4xl font-bold text-slate-900">{stat1.count}</p>
              <p className="text-sm font-medium text-slate-500 mt-1">Criteria Automated</p>
            </div>
            <div ref={stat2.ref} className="p-6 bg-white/70 backdrop-blur rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-4xl font-bold text-slate-900">{stat2.count}+</p>
              <p className="text-sm font-medium text-slate-500 mt-1">Data Points</p>
            </div>
            <div className="p-6 bg-white/70 backdrop-blur rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AI</p>
              <p className="text-sm font-medium text-slate-500 mt-1">Powered Reports</p>
            </div>
            <div ref={stat3.ref} className="p-6 bg-white/70 backdrop-blur rounded-2xl border border-slate-100 shadow-sm text-center">
              <p className="text-4xl font-bold text-slate-900">{stat3.count}%</p>
              <p className="text-sm font-medium text-slate-500 mt-1">NAAC Compliant</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-bold uppercase tracking-widest text-blue-600">Platform Features</span>
            <h2 className="text-4xl font-bold text-slate-900 mt-3">Everything you need for accreditation success</h2>
            <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto">From data entry to final report generation — a single platform that handles it all.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group p-7 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform mb-5">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-bold uppercase tracking-widest text-blue-600">How It Works</span>
            <h2 className="text-4xl font-bold text-slate-900 mt-3">Three simple steps to accreditation readiness</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Enter Institutional Data', desc: 'Use forms or bulk Excel import to enter data across all 7 NAAC criteria. Auto-validation ensures completeness.', icon: Database },
              { step: '02', title: 'AI Computes & Generates', desc: 'Our scoring engine computes your CGPA in real-time. Gemini AI generates professional SSR narratives.', icon: Sparkles },
              { step: '03', title: 'Download Complete SSR', desc: 'Export your complete Self Study Report in PDF, Word, or Excel format with evidence links and radar charts.', icon: FileText },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="relative p-8 bg-white rounded-3xl border border-slate-100 shadow-sm"
              >
                <div className="absolute -top-4 left-8 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full text-white text-xs font-bold">
                  Step {item.step}
                </div>
                <div className="mt-3">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 mb-5">
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-bold uppercase tracking-widest text-blue-600">Platform Modules</span>
            <h2 className="text-4xl font-bold text-slate-900 mt-3">Comprehensive accreditation coverage</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((mod, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group p-7 bg-white rounded-2xl border border-slate-100 hover:shadow-xl transition-all duration-300 flex items-start gap-5"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${mod.color} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <ClipboardCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-900">{mod.title}</h3>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${mod.status === 'Live' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {mod.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{mod.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-bold uppercase tracking-widest text-blue-600">Testimonials</span>
            <h2 className="text-4xl font-bold text-slate-900 mt-3">Trusted by leading institutions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-7 bg-white rounded-2xl border border-slate-100 shadow-sm"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}, {t.institution}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-bold uppercase tracking-widest text-blue-600">Pricing</span>
            <h2 className="text-4xl font-bold text-slate-900 mt-3">Simple, transparent pricing</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingPlans.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`p-7 rounded-2xl border-2 transition-all ${plan.highlighted ? 'border-blue-600 shadow-xl shadow-blue-100 bg-blue-50/30 relative' : 'border-slate-100 bg-white'}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <div className="mt-3 mb-6">
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-sm text-slate-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => scrollTo('contact')}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${plan.highlighted ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / Demo Request */}
      <section id="contact" className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-blue-400">Get Started</span>
              <h2 className="text-4xl font-bold text-white mt-3">Ready to transform your accreditation process?</h2>
              <p className="text-lg text-slate-400 mt-4 leading-relaxed">
                Book a personalized demo with our team. We'll show you how UACAS can streamline your NAAC preparation and predict your grade.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-slate-300">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span>contact@uacas.com</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <span>+91 80 1234 5678</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <span>Bangalore, India</span>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Request Submitted!</h3>
                  <p className="text-slate-400 mt-2">Our team will contact you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleDemoSubmit} className="space-y-4">
                  <h3 className="text-lg font-bold text-white mb-4">Request a Demo</h3>
                  <input
                    type="text"
                    value={demoForm.name}
                    onChange={e => setDemoForm({ ...demoForm, name: e.target.value })}
                    placeholder="Your Name *"
                    required
                    className="w-full p-4 bg-white/10 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={demoForm.institution}
                    onChange={e => setDemoForm({ ...demoForm, institution: e.target.value })}
                    placeholder="Institution Name *"
                    required
                    className="w-full p-4 bg-white/10 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="email"
                    value={demoForm.email}
                    onChange={e => setDemoForm({ ...demoForm, email: e.target.value })}
                    placeholder="Email Address *"
                    required
                    className="w-full p-4 bg-white/10 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    value={demoForm.phone}
                    onChange={e => setDemoForm({ ...demoForm, phone: e.target.value })}
                    placeholder="Phone Number"
                    className="w-full p-4 bg-white/10 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <textarea
                    value={demoForm.message}
                    onChange={e => setDemoForm({ ...demoForm, message: e.target.value })}
                    placeholder="Tell us about your accreditation needs..."
                    rows={3}
                    className="w-full p-4 bg-white/10 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Submitting...' : 'Request Demo'}
                    {!submitting && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">U</div>
              <span className="text-lg font-bold text-white">UACAS</span>
              <span className="text-sm text-slate-500 ml-2">University Accreditation & Compliance Automation System</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/20 transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/20 transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/20 transition-all">
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} UACAS. All rights reserved. Built for high-stakes university accreditation readiness.
          </div>
        </div>
      </footer>
    </div>
  );
}
