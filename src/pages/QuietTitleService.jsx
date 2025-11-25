import React from 'react';
import { Link } from 'react-router-dom';

export default function QuietTitleService() {
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
            Quiet Title in 90 Days... NOT 18 Months
          </h1>
          <h2 className="text-3xl font-bold text-indigo-600">Expedited Quiet Title Service:</h2>
          <p className="text-xl text-gray-600 mb-4">
            Fast-Track Your Tax Deed to Marketable Title (Where State Law Permits)
          </p>
        </div>

        {/* Problem/Agitation */}
        <div className="bg-red-50 border-l-4 border-red-500 p-8 mb-12">
          <h3 className="text-2xl font-bold mb-4 text-red-900">The BRUTAL Reality of Quiet Title Actions:</h3>
          <ul className="space-y-3 text-lg text-gray-800">
            <li>✗ Waiting 12-18 months (or longer) for traditional quiet title to complete</li>
            <li>✗ Paying $5,000-$15,000+ in attorney fees for standard process</li>
            <li>✗ Losing equity to property deterioration during the waiting period</li>
            <li>✗ Missing market opportunities while your property sits in legal limbo</li>
            <li>✗ Carrying costs eating into your profits month after month</li>
            <li>✗ Can't sell, can't refinance, can't do ANYTHING until title is clear</li>
          </ul>
          <p className="mt-6 text-lg font-semibold">
            Every month of delay costs you THOUSANDS in lost opportunity and carrying costs.
          </p>
        </div>

        {/* Solution */}
        <div className="bg-green-50 p-8 rounded-lg mb-12">
          <h3 className="text-2xl font-bold mb-4 text-green-900">What If You Could Get Marketable Title in 90 Days?</h3>
          <p className="text-lg text-gray-700 mb-4">
            In states that permit expedited procedures, we leverage:
          </p>
          <ul className="space-y-2 text-lg text-gray-700">
            <li>• Streamlined statutory procedures designed for tax deed properties</li>
            <li>• Strategic use of warranty deed alternatives (where legally permissible)</li>
            <li>• Aggressive notice timelines to eliminate delays</li>
            <li>• Pre-emptive title curative work before filing</li>
            <li>• Relationships with title companies that understand expedited processes</li>
          </ul>
        </div>

        {/* State Compliance Notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-12">
          <p className="text-sm font-semibold text-yellow-900 mb-2">⚠️ LEGAL COMPLIANCE NOTICE:
          </p>
          <p className="text-sm text-gray-700">
            Expedited quiet title procedures and warranty deed alternatives are only available
            in certain jurisdictions where state statutes explicitly permit such actions.
            Our team verifies state-specific requirements before proceeding. Traditional quiet title
            remains the standard process in most states. This service is NOT available in all 50 states.
          </p>
        </div>

        {/* What's Included */}
        <div className="bg-white shadow-xl rounded-lg p-8 mb-12">
          <h3 className="text-2xl font-bold mb-6">What's Included:</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-4">✓</span>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">State Law Review</h4>
                <p className="text-gray-600">Verification that your property qualifies for expedited procedures</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-4">✓</span>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Complete Title Work</h4>
                <p className="text-gray-600">Full title search, lien resolution, and curative actions</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-4">✓</span>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Legal Document Preparation</h4>
                <p className="text-gray-600">All pleadings, notices, and filings handled by licensed attorneys</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-4">✓</span>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Notice & Service</h4>
                <p className="text-gray-600">Proper notice to all interested parties per state requirements</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-4">✓</span>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Court Representation</h4>
                <p className="text-gray-600">Attorney representation at all hearings (if required)</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-600 text-2xl mr-4">✓</span>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">Title Insurance Coordination</h4>
                <p className="text-gray-600">Work directly with underwriters to get you insurable title</p>
              </div>
            </div>
          </div>
        </div>

        {/* Guarantee */}
        <div className="bg-indigo-600 text-white rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4">Our Performance Guarantee:</h2>
          <p className="text-xl mb-4">
            If we can't get you to insurable title faster than traditional methods
            (where expedited procedures are legally available), we refund 50% of your fee.
          </p>
          <p className="text-lg opacity-90">
            We only take cases where we can add real value. If expedited procedures
            aren't available in your state, we'll tell you upfront - no charge.
          </p>
        </div>

        {/* Pricing */}
        <div className="bg-white shadow-xl rounded-lg p-8 mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Investment:</h2>
          <div className="text-5xl font-bold text-indigo-600 mb-2">$1,997</div>
          <p className="text-xl text-gray-600 mb-4">Per Property (Plus Court/Filing Fees)</p>
          <p className="text-lg text-gray-500 italic">
            Compare that to $8,000-$15,000 for traditional quiet title
          </p>
          <p className="text-sm text-gray-500 mt-4">
            (Court filing fees, publication costs, and service of process fees are additional
            and vary by jurisdiction. Typical range: $800-$2,500)
          </p>
          <button className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-12 rounded-lg text-xl">
            Get Your State Eligibility Check → Free
          </button>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">
            Stop waiting. Start profiting.
          </p>
          <p className="text-sm text-gray-500">
            Not sure if this applies to your state? Check out our <Link to="/analysis-service" className="text-indigo-600 underline">Property Analysis Service</Link> or
            <Link to="/training" className="text-indigo-600 underline"> Done-For-You Training</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
