import React, { useState } from 'react';
import { Check, X, Star, Zap, Building, Users, ChevronDown, ChevronUp } from 'lucide-react';

export const PricingPlans: React.FC = () => {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      icon: Star,
      description: 'Perfect for getting started with video analysis',
      seats: '1 user',
      features: [
        { name: 'Video Summaries', value: '5 per day', included: true },
        { name: 'Full Transcripts', value: true, included: true },
        { name: 'Key Quotes & Insights', value: 'Basic', included: true },
        { name: 'TXT Export', value: true, included: true },
        { name: 'Transcript Search', value: false, included: false },
        { name: 'Auto Highlights', value: false, included: false },
        { name: 'PDF & DOCX Export', value: false, included: false },
        { name: 'Multi-language Translation', value: false, included: false },
        { name: 'Saved History', value: false, included: false },
        { name: 'API Access', value: false, included: false },
      ],
      buttonText: 'Get Started Free',
      buttonClass: 'bg-gray-600 text-white hover:bg-gray-700',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19',
      period: 'per month',
      yearlyPrice: '$193',
      yearlyPeriod: 'per year',
      savings: 'Save 15%',
      icon: Zap,
      description: 'For professionals who need advanced features',
      seats: '1 user',
      features: [
        { name: 'Video Summaries', value: 'Unlimited', included: true },
        { name: 'Full Transcripts', value: true, included: true },
        { name: 'Enhanced AI Insights', value: '3 Memorable Quotes', included: true },
        { name: 'All Export Formats', value: 'TXT, PDF, DOCX', included: true },
        { name: 'Transcript Search', value: true, included: true },
        { name: 'Auto Highlights', value: true, included: true },
        { name: 'Multi-language Translation', value: '12+ Languages', included: true },
        { name: 'Unlimited History', value: true, included: true },
        { name: 'API Access', value: 'Add-on Available', included: true },
        { name: 'Priority Support', value: true, included: true },
      ],
      buttonText: 'Upgrade to Pro',
      buttonClass: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700',
      popular: true
    },
    {
      id: 'team',
      name: 'Team',
      price: '$39',
      period: 'per month',
      yearlyPrice: '$397',
      yearlyPeriod: 'per year',
      savings: 'Save 15%',
      icon: Building,
      description: 'For teams and organizations',
      seats: '5 seats included',
      features: [
        { name: 'Everything in Pro', value: 'All Pro Features', included: true },
        { name: 'Team Collaboration', value: 'Shared Workspaces', included: true },
        { name: 'API Access', value: 'Included', included: true },
        { name: 'Admin Dashboard', value: 'Usage & Access Control', included: true },
        { name: 'Shared Notes & Comments', value: true, included: true },
        { name: 'Team Analytics', value: true, included: true },
        { name: 'Priority Support', value: 'Dedicated Manager', included: true },
        { name: 'Custom Integrations', value: true, included: true },
        { name: 'Advanced Security', value: 'SSO & Compliance', included: true },
        { name: 'Volume Discounts', value: 'Additional Seats', included: true },
      ],
      buttonText: 'Start Team Trial',
      buttonClass: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700',
      popular: false
    }
  ];

  const toggleExpanded = (planId: string) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Choose the perfect plan for your video analysis needs
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const currentPrice = billingCycle === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.price;
          const currentPeriod = billingCycle === 'yearly' && plan.yearlyPeriod ? plan.yearlyPeriod : plan.period;
          const isExpanded = expandedPlan === plan.id;
          
          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
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

              <div className="p-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className={`inline-flex p-3 rounded-xl mb-4 ${
                    plan.popular ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      plan.popular ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  
                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center space-x-2">
                      <span className="text-4xl font-bold text-gray-900">{currentPrice}</span>
                      <span className="text-gray-600">/{currentPeriod}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{plan.seats}</span>
                    </div>
                    {billingCycle === 'yearly' && plan.savings && (
                      <div className="mt-2">
                        <span className="text-green-600 text-sm font-semibold">{plan.savings}</span>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 mb-6 ${plan.buttonClass}`}>
                    {plan.buttonText}
                  </button>
                </div>

                {/* Key Features Preview */}
                <div className="space-y-3 mb-4">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                          {feature.name}
                        </span>
                        {typeof feature.value === 'string' && feature.value !== 'true' && feature.value !== 'false' && (
                          <div className={`text-xs ${feature.included ? 'text-gray-500' : 'text-gray-400'}`}>
                            {feature.value}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expand/Collapse Button */}
                <button
                  onClick={() => toggleExpanded(plan.id)}
                  className="w-full flex items-center justify-center space-x-2 py-2 text-blue-600 hover:text-blue-700 transition-colors border-t border-gray-100 pt-4"
                >
                  <span className="text-sm font-medium">
                    {isExpanded ? 'Show Less' : 'See All Features'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Expanded Features */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {plan.features.slice(4).map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                            {feature.name}
                          </span>
                          {typeof feature.value === 'string' && feature.value !== 'true' && feature.value !== 'false' && (
                            <div className={`text-xs ${feature.included ? 'text-gray-500' : 'text-gray-400'}`}>
                              {feature.value}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise Section */}
      <div className="text-center bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Need Something Custom?</h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Enterprise plans with custom pricing, dedicated infrastructure, and white-label solutions.
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
    </div>
  );
};