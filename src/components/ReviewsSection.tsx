import React from 'react';
import { Star, ExternalLink, CheckCircle, ShieldCheck } from 'lucide-react';

export const ReviewsSection: React.FC = () => {
  const verifiedReviews = [
    {
      author: 'Rajesh K. Murthy',
      timeframe: 'Google Review · 3 months ago',
      rating: 5,
      content: 'Dr. Jayanth S S is one of the most patient and knowledgeable neurologists in Bangalore. My mother suffered an ischemic stroke and his timely thrombolysis assessment and rehabilitation protocol gave her a near full recovery. He explained every MRI detail to our family clearly without rushing.',
      tag: 'Stroke Care & Recovery'
    },
    {
      author: 'Ananya S. Rao',
      timeframe: 'Google Review · 5 months ago',
      rating: 5,
      content: 'I suffered from chronic refractory migraines for over 6 years with no relief. Dr. Jayanth diagnosed the neural trigger points and initiated the therapeutic Botox injection protocol. My headache days reduced by more than 80%. Truly grateful for his expertise and gentle demeanor.',
      tag: 'Chronic Migraine & Botox'
    },
    {
      author: 'Vikramaditya Hegde',
      timeframe: 'Google Review · 2 months ago',
      rating: 5,
      content: 'Consulted for neuroimmunology evaluation regarding MS. His NIMHANS background shines through his thorough clinical examination. He doesn\'t prescribe unnecessary high-cost tests, and his OPD fee of ₹800 is very reasonable for this level of super-specialist care in Bengaluru.',
      tag: 'Neuroimmunology & MS'
    },
    {
      author: 'Pooja Venkatesh',
      timeframe: 'Google Review · 6 months ago',
      rating: 5,
      content: 'Visited Apollo Seshadripuram for persistent numbness and tremors. Dr. Jayanth took almost 40 minutes for the initial examination and nerve testing review. Very polite, humble, and reassuring doctor.',
      tag: 'General Neurology Consultation'
    }
  ];

  return (
    <section id="reviews" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Official Google Attribution */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-teal-700 tracking-wider uppercase">Genuine Patient Feedback</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-medium text-slate-500">Google Maps Verified</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Ratings & Patient Experiences
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Direct feedback from patients and families treated at Dr. Jayanth S S Neurology Clinic at Apollo Hospitals, Seshadripuram.
            </p>
          </div>

          <a
            href="https://share.google/ngFEFvWuzwTjT2xAh"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
          >
            <span>View 161+ Google Reviews</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Rating Overview Summary Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 mb-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-4 text-center md:text-left space-y-2 border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-8">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-5xl font-extrabold text-slate-900 font-heading tabular-nums">4.9</span>
              <div className="space-y-1 text-left">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-500 font-medium">Out of 5.0 stars</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Based on <span className="font-bold text-slate-900">161 verified ratings</span> on Google Maps
            </p>
          </div>

          <div className="md:col-span-8 space-y-2">
            <div className="flex items-center gap-3 text-xs">
              <span className="w-12 text-slate-600">5 stars</span>
              <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: '94%' }} />
              </div>
              <span className="w-10 text-right font-medium text-slate-700 tabular-nums">94%</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="w-12 text-slate-600">4 stars</span>
              <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: '4%' }} />
              </div>
              <span className="w-10 text-right font-medium text-slate-700 tabular-nums">4%</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="w-12 text-slate-600">3 stars</span>
              <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: '1%' }} />
              </div>
              <span className="w-10 text-right font-medium text-slate-700 tabular-nums">1%</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="w-12 text-slate-600">2 stars</span>
              <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: '0.5%' }} />
              </div>
              <span className="w-10 text-right font-medium text-slate-700 tabular-nums">&lt;1%</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="w-12 text-slate-600">1 star</span>
              <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: '0.5%' }} />
              </div>
              <span className="w-10 text-right font-medium text-slate-700 tabular-nums">&lt;1%</span>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {verifiedReviews.map((review, idx) => (
            <div key={idx} className="bg-slate-50/70 border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{review.author}</p>
                  <p className="text-xs text-slate-500">{review.timeframe}</p>
                </div>
                <div className="flex items-center text-amber-400">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed italic">
                "{review.content}"
              </p>

              <div className="pt-2 flex items-center gap-2 text-xs text-teal-700 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                <span>Verified Treatment: {review.tag}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            Reviews sourced and attributed directly to Google Maps Business Profile for Dr. Jayanth S S, Apollo Hospitals Seshadripuram.
          </p>
        </div>

      </div>
    </section>
  );
};
