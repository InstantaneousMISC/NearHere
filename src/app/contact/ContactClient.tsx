"use client"

import { useState } from "react"
import { Mail, MapPin, Clock, MessageSquare, Send, CheckCircle2 } from "lucide-react"

export default function ContactClient() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("advertise")
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name && email && message) {
      setSubmitted(true)
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="border-b border-rule py-16 bg-muted/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 border border-press/30 text-press mb-4">
            Connect
          </span>
          <h1 className="headline-xl text-5xl md:text-6xl">
            Get in touch.
          </h1>
          <p className="mt-6 text-lg text-press/80 max-w-xl mx-auto leading-relaxed">
            Have questions about upcoming drops, category availability, or want to invite us to mail your neighborhood? Drop us a line.
          </p>
        </div>
      </section>

      {/* Contact Content Grid */}
      <section className="border-b border-rule py-20 bg-paper">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12">
          
          {/* Info Side Column */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <h2 className="headline-xl text-3xl">Ways to Connect</h2>
              <p className="text-press/70 text-sm mt-3 leading-relaxed">
                Whether you are a merchant ready to claim your exclusive category or a local resident wanting to nominate a business, we read and reply to every message.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="text-nh-red mt-1">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-base uppercase tracking-wider text-press">Email Us</h4>
                  <p className="font-mono text-xs text-warm mt-0.5">Response within 24 Hours</p>
                  <a href="mailto:hello@nearhere.co" className="text-sm font-bold hover:text-nh-red transition-colors block mt-1">
                    hello@nearhere.co
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-nh-red mt-1">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-base uppercase tracking-wider text-press">Our Focus Area</h4>
                  <p className="font-mono text-xs text-warm mt-0.5">Serving Converse & Surrounding Towns</p>
                  <p className="text-sm font-bold block mt-1">
                    Converse, Texas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-nh-red mt-1">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-base uppercase tracking-wider text-press">Operating Hours</h4>
                  <p className="font-mono text-xs text-warm mt-0.5">Central Standard Time</p>
                  <p className="text-sm font-bold block mt-1">
                    Monday - Friday: 9:00 AM - 5:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <div className="border border-press bg-paper p-8 md:p-10">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="text-nh-red flex justify-center mb-4">
                    <CheckCircle2 className="h-14 w-14" />
                  </div>
                  <h3 className="headline-xl text-2xl">Message Sent!</h3>
                  <p className="text-sm text-press/75 mt-3 max-w-sm mx-auto leading-relaxed">
                    Thank you for reaching out, {name}. We have received your message regarding subject &apos;{subject === "advertise" ? "Postcard Advertising" : subject === "support" ? "Support/Redemptions" : "General Inquiry"}&apos; and will review it shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setName("")
                      setEmail("")
                      setMessage("")
                    }}
                    className="mt-8 border border-press text-press px-6 py-2.5 font-headline font-bold uppercase tracking-wider text-xs hover:bg-press hover:text-paper transition-all cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="font-headline font-bold text-2xl uppercase tracking-tight mb-6 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-nh-red" /> Send a Message
                  </h3>
                  
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-warm mb-1.5">
                      Your Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Maria Rivera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-press/40 bg-paper px-3 py-2 text-sm focus:outline-none focus:border-nh-red rounded-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-warm mb-1.5">
                      Email Address
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="e.g. maria@riveraplumbing.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-press/40 bg-paper px-3 py-2 text-sm focus:outline-none focus:border-nh-red rounded-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-warm mb-1.5">
                      Inquiry Topic
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full border border-press/40 bg-paper px-3 py-2 text-sm focus:outline-none focus:border-nh-red rounded-none font-headline font-bold uppercase tracking-wider"
                    >
                      <option value="advertise">Local Postcard Advertising</option>
                      <option value="suggest">Suggest a Business/Area</option>
                      <option value="press">Press & Media Inquiries</option>
                      <option value="support">Help & Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-warm mb-1.5">
                      Your Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Write your details here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full border border-press/40 bg-paper px-3 py-2 text-sm focus:outline-none focus:border-nh-red rounded-none"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full bg-press text-paper py-3 font-headline font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-nh-red transition-colors cursor-pointer"
                    >
                      <Send className="h-4 w-4" /> Send Message
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
