import React from 'react';
import { Link } from 'react-router-dom';

export default function PropertyAnalysisService() {
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
            STOP Wasting 40+ Hours Per Week...
          </h1>
          <h2 className="text-3xl font-bold text-indigo-600">Property Analysis:</h2>
          <p className="text-xl text-gray-600 mb-4">
            Let Us Do The Heavy Lifting - Get PRE-VETTED Deals Ready To Bid On
          </p>
        </div>

        {/* Problem/Agitation */}
        <div className="bg-red-50 border-l-4 border-red-500 p-8 mb-12">
          <h3 className="text-2xl font-bold mb-4 text-red-900">The Time-Sucking REALITY of Tax Deed Research:</h3>
          <ul className="space-y-3 text-lg text-gray-800">
            <li>✗ Spending 10-15 hours per week combing through county auction lists</li>
            <li>✗ Wasting time on properties with title defects you discover too late</li>
            <li>✗ Missing the best deals because you couldn't research fast enough</li>
            <li>✗ Bidding blind at auctions without complete information</li>
            <li>✗ Losing money on properties with hidden liens or structural issues</li>
          </ul>
          <p className="mt-6 text-lg font-semibold">
            You got INTO this business to make money... NOT to become a full-time researcher.
          </p>
        </div>

        {/* Solution */}
        <div className="bg-green-50 p-8 rounded-lg mb-12">
          <h3 className="text-2xl font-bold mb-4 text-green-900">What If Someone Did All The Research FOR You?</h3>
          <p className="text-lg text-gray-700 mb-4">
            That's exactly what our Property Analysis Service does.
          </p>
          <p className="text-lg text-gray-700">
            We take the upcoming auction lists, run them through our 47-point evaluation system,
            and deliver YOU a short-list of the BEST opportunities - complete with:
          </p>
        </div>

        {/* What's Included */}
        <div className="bg-white shadow-xl rounded-lg p-8 mb-12">
          <h3 className="text-2xl font-bold mb-6">What's Included in Every Analysis:</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-4">✓</span>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Title Research</h4>
                <p className="text-gray-600">Full title chain review, lien search, encumbrance verification</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-4">✓</span>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Market Analysis</h4>
                <p className="text-gray-600">Comparable sales, ARV estimates, rental income potential</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-4">✓</span>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Property Condition Assessment</h4>
                <p className="text-gray-600">Exterior inspection, tax records review, permit history</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-4">✓</span>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Bid Strategy</h4>
                <p className="text-gray-600">Maximum bid recommendations based on profit margins and risk</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-4">✓</span>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Exit Strategy Options</h4>
                <p className="text-gray-600">Flip, rent, or hold - we show you all viable paths to profit</p>
              </div>
            </div>
          </div>
        </div>

        {/* Guarantee */}
        <div className="bg-indigo-600 text-white rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4">Our Iron-Clad Guarantee:</h2>
          <p className="text-xl mb-4">
            If you don't save at least 20 hours of research time per auction cycle,
            we'll refund your money. PERIOD.
          </p>
          <p className="text-lg opacity-90">
            You're either saving massive amounts of time and getting better deals,
            or you pay NOTHING.
          </p>
        </div>

        {/* Pricing */}
        <div className="bg-white shadow-xl rounded-lg p-8 mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Investment:</h2>
          <div className="text-5xl font-bold text-indigo-600 mb-2">$1,997</div>
          <p className="text-xl text-gray-600 mb-4">Per Auction Cycle</p>
          <p className="text-lg text-gray-500 italic">
            Typical ROI: First deal pays for the service 5X-10X over
          </p>
          <button className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-12 rounded-lg text-xl">
            Get Started → Limited to 10 Clients/Cycle
          </button>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">
            Stop wasting time. Start making money.
          </p>
          <p className="text-sm text-gray-500">
            Questions? Check out our <Link to="/quiet-title-service" className="text-indigo-600 underline">Quiet Title Service</Link> or
            <Link to="/training" className="text-indigo-600 underline"> Done-For-You Training</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
