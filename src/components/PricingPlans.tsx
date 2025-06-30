import React from 'react';
import { Check, X, Star, Zap, Building, Users } from 'lucide-react';

export const PricingPlans: React.FC = () => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      icon: Star,
      description: 'Perfect for getting started',
      seats: '1 user',
      features: [
        { name: 'Summarize YouTube Videos', value: 'Up to 5/day', included: true },
        { name: 'Full Transcript Extraction', value: true, included: true },
        { name: 'Key Learnings & Memorable Quotes (AI)', value: 'Basic', included: true },
        { name: 'Download Summary as .TXT', value: true, included: true },
        { name: 'Search Inside Transcript', value: false, included: false },
        { name: 'Auto-highlight Key Moments', value: false, included: false },
        { name: 'Export as PDF & DOCX', value: false, included: false },
        { name: 'Translation (Summary & Transcript)', value: false, included: false },
        { name: 'Support for Non-English Videos', value: false, included: false },
        { name: 'User Authentication', value: 'Guest Access', included: true },
        { name: 'Saved Summary History', value: false, included: false },
        { name: 'Usage Credit System', value: '50 credits/month', included: true },
        { name: 'Dashboard to Manage Summaries', value: false, included: false },
        { name: 'API Access', value: false, included: false },
        { name: 'Priority Support', value: false, included: false },
      ],
      buttonText: 'Get Started Free',
      buttonClass: 'bg-gray-600 text-white hover:bg-gray-700',
      popular: false
    },
    {
      name: 'Pro',
      price: '$20',
      period: 'per month',
      yearlyPrice: '$204',
      yearlyPeriod: 'per year',
      savings: 'Save 15%',
      icon: Zap,
      description: 'For power users and professionals',
      seats: '1 user',
      features: [
        { name: 'Summarize YouTube Videos', value: 'Unlimited*', included: true },
        { name: 'Full Transcript Extraction', value: true, included: true },
        { name: 'Key Learnings & Memorable Quotes (AI)', value: 'Enhanced AI Insights', included: true },
        { name: 'Search Inside Transcript', value: true, included: true },
        { name: 'Auto-highlight Key Moments', value: true, included: true },
        { name: 'Download Summary as .TXT', value: true, included: true },
        { name: 'Export as PDF & DOCX', value: true, included: true },
        { name: 'Translation (Summary & Transcript)', value: 'Multi-language', included: true },
        { name: 'Support for Non-English Videos', value: true, included: true },
        { name: 'User Authentication', value: 'Required', included: true },
        { name: 'Saved Summary History', value: 'Personal Library', included: true },
        { name: 'Usage Credit System', value: 'Unlimited*', included: true },
        { name: 'Dashboard to Manage Summaries', value: true, included: true },
        { name: 'API Access', value: 'Add-on', included: true },
        { name: 'Priority Support', value: 'Email & Chat', included: true },
      ],
      buttonText: 'Upgrade to Pro',
      buttonClass: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700',
      popular: true
    },
    {
      name: 'Team',
      price: '$40',
      period: 'per month',
      yearlyPrice: '$408',
      yearlyPeriod: 'per year',
      savings: 'Save 15%',
      icon: Building,
      description: 'For teams and organizations',
      seats: '5 seats included',
      features: [
        { name: 'Summarize YouTube Videos', value: 'Unlimited*', included: true },
        { name: 'Full Transcript Extraction', value: true, included: true },
        { name: 'Key Learnings & Memorable Quotes (AI)', value: 'Enhanced AI Insights', included: true },
        { name: 'Search Inside Transcript', value: true, included: true },
        { name: 'Auto-highlight Key Moments', value: true, included: true },
        { name: 'Download Summary as .TXT', value: true, included: true },
        { name: 'Export as PDF & DOCX', value: true, included: true },
        { name: 'Translation (Summary & Transcript)', value: 'Multi-language', included: true },
        { name: 'Support for Non-English Videos', value: true, included: true },
        { name: 'User Authentication', value: 'Multi-user Login', included: true },
        { name: 'Saved Summary History', value: 'Shared Folders', included: true },
        { name: 'Usage Credit System', value: '1000+ Shared Credits', included: true },
        { name: 'Dashboard to Manage Summaries', value: 'Collaborative Workspace', included: true },
        { name: 'API Access', value: 'Included', included: true },
        { name: 'Priority Support', value: 'Dedicated Success Manager', included: true },
        { name: 'Team Collaboration Tools', value: 'Shared Notes & Comments', included: true },
        { name: 'Admin Panel (Usage & Access Control)', value: 'Team Management Panel', included: true },
      ],
      buttonText: 'Start Team Trial',
      buttonClass: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700',
      popular: false
    }
  ];

  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Unlock the full power of AI-driven video analysis with our flexible pricing plans
        </p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
            Yearly
          </span>
          {billingCycle === 'yearly' && (
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
              Save 15%
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {plans.map((plan, index) => {
          const Icon = plan.icon;
          const currentPrice = billingCycle === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.price;
          const currentPeriod = billingCycle === 'yearly' && plan.yearlyPeriod ? plan.yearlyPeriod : plan.period;
          
          return (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
                plan.popular 
                  ? 'border-blue-500 transform scale-105' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`p-3 rounded-xl ${
                    plan.popular ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      plan.popular ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-gray-600">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-bold text-gray-900">{currentPrice}</span>
                    <span className="text-gray-600">/{currentPeriod}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{plan.seats}</span>
                  </div>
                  {billingCycle === 'yearly' && plan.savings && (
                    <div className="mt-2">
                      <span className="text-green-600 text-sm font-semibold">{plan.savings}</span>
                    </div>
                  )}
                </div>

                <button className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 mb-8 ${plan.buttonClass}`}>
                  {plan.buttonText}
                </button>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Everything included:</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                            {feature.name}
                          </span>
                          {typeof feature.value === 'string' && feature.value !== 'true' && feature.value !== 'false' && (
                            <div className={`text-xs mt-1 ${feature.included ? 'text-gray-500' : 'text-gray-400'}`}>
                              {feature.value}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fair Use Policy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-blue-900 mb-2">Fair Use Policy</h3>
        <p className="text-blue-800 text-sm">
          *Unlimited plans include fair use policy to prevent abuse. Enterprise limits available for heavy users. 
          Contact us if you need higher limits for your organization.
        </p>
      </div>

      {/* Enterprise Section */}
      <div className="text-center bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Need Something Custom?</h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          We offer enterprise plans with custom pricing, dedicated infrastructure, 
          advanced security features, and white-label solutions.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
            Contact Sales
          </button>
          <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
            Schedule Demo
          </button>
        </div>
      </div>

      {/* API Pricing Section */}
      <div className="mt-16 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">API Pricing</h3>
          <p className="text-gray-600">
            Integrate Transcripto's powerful video analysis into your applications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Pay-as-you-go</h4>
            <div className="text-3xl font-bold text-gray-900 mb-2">$0.10</div>
            <div className="text-gray-600 mb-4">per API call</div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>No monthly commitment</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Perfect for testing</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Full API access</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-500">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Pro Add-on</h4>
            <div className="text-3xl font-bold text-gray-900 mb-2">$10</div>
            <div className="text-gray-600 mb-4">per month (1000 calls)</div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Included with Pro plan</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Priority API support</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Higher rate limits</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Team Included</h4>
            <div className="text-3xl font-bold text-gray-900 mb-2">$0.05</div>
            <div className="text-gray-600 mb-4">per call (10,000+ calls)</div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>50% discount on volume</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Dedicated support</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Custom rate limits</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};