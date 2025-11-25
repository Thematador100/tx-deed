import React from 'react';
import { Link } from 'react-router-dom';

export default function DoneForYouTraining() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            STOP Wasting Months Learning...
            <br />
            <span className="text-indigo-600">We Close Your FIRST Tax Deed Deal For You</span>
          </h1>
          <p className="text-2xl text-gray-600 italic">
            Outcome-Based Training: You Don't Pay Until Your First Deal Is DONE
          </p>
        </div>

        {/* Problem Agitation */}
        <div className="bg-red-50 border-l-4 border-red-600 p-6 mb-8">
          <h2 className="text-2xl font-bold text-red-900 mb-4">The BRUTAL Truth About Tax Deed Investing...</h2>
          <ul className="space-y-3 text-lg text-red-800">
            <li>✗ You waste 6-12 months "learning" from YouTube videos and courses</li>
            <li>✗ You FREEZE when it's time to bid at your first auction</li>
            <li>✗ You miss hidden liens and lose $50,000+ on a "deal"</li>
            <li>✗ Your family thinks you're crazy for months with ZERO results</li>
          </ul>
        </div>

        {/* Solution */}
        <div className="bg-green-50 border-l-4 border-green-600 p-6 mb-8">
          <h2 className="text-2xl font-bold text-green-900 mb-4">What If Someone Held Your Hand Through Your FIRST Deal?</h2>
          <p className="text-lg text-green-800 mb-4">
            Imagine: In just 30-60 days, you close your first tax deed deal with our team doing the heavy lifting.
            We don't just teach you theory – we WORK THE DEAL WITH YOU from start to finish.
          </p>
        </div>

        {/* What's Included */}
        <div className="bg-white shadow-xl rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What You Get:</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-4">✓</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Deal Selection</h3>
                <p className="text-gray-600">We analyze properties and pick YOUR first target deal</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-4">✓</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Title Research</h3>
                <p className="text-gray-600">We verify clean title and identify ALL hidden risks</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-4">✓</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Bid Strategy</h3>
                <p className="text-gray-600">We calculate your MAX bid and walk you through auction day</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-4">✓</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Closing Support</h3>
                <p className="text-gray-600">We handle paperwork, quiet title, and get you to the deed</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-4">✓</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Exit Strategy</h3>
                <p className="text-gray-600">Flip, rent, or hold – we show you how to monetize</p>
              </div>
            </div>
          </div>
        </div>

        {/* Guarantee */}
        <div className="bg-indigo-600 text-white rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4">Our Iron-Clad Guarantee:</h2>
          <p className="text-xl mb-4">
            If we can't find you a profitable deal and get you to closing within 90 days,
            you pay NOTHING.
          </p>
          <p className="text-lg opacity-90">
            This isn't theory. This isn't a course. This is RESULTS.
          </p>
        </div>

        {/* Pricing */}
        <div className="bg-white shadow-xl rounded-lg p-8 mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Investment:</h2>
          <div className="text-5xl font-bold text-indigo-600 mb-2">$1,997</div>
          <p className="text-xl text-gray-600 mb-4">Due at closing of YOUR deal</p>
          <p className="text-lg text-gray-500 italic">
            (Or 25% of net profit if deal exceeds $30,000 equity)
          </p>
          <button className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition">
            Apply Now → Limited to 5 Clients/Month
          </button>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">
            Stop learning. Start EARNING.
          </p>
          <p className="text-sm text-gray-500">
            Not ready? Check out our <Link to="/analysis-service" className="text-indigo-600 underline">Property Analysis Service</Link> or <Link to="/quiet-title-service" className="text-indigo-600 underline">Quiet Title Service</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
