import React from 'react';
import { Check, Star, Zap, Building } from 'lucide-react';

export const PricingPlans: React.FC = () => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      icon: Star,
      description: 'Perfect for getting started',
      features: [
        '5 videos per month',
        'Basic summaries',
        'Standard transcript',
        'Text export only',
        'Community support'
      ],
      limitations: [
        'No API access',
        'No advanced highlighting',
        'No translations'
      ],
      buttonText: 'Current Plan',
      buttonClass: 'bg-gray-200 text-gray-800 cursor-not-allowed',
      popular: false
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'per month',
      icon: Zap,
      description: 'For power users and professionals',
      features: [
        'Unlimited videos',
        'Advanced AI summaries',
        'Smart highlighting',
        'Multi-language support',
        'All export formats (PDF, DOCX)',
        'Translation to 12+ languages',
        'Priority support',
        'API access (1000 calls/month)'
      ],
      limitations: [],
      buttonText: 'Upgrade to Pro',
      buttonClass: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700',
      popular: true
    },
    {
      name: 'Teams',
      price: '$49',
      period: 'per month',
      icon: Building,
      description: 'For teams and organizations',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'Shared workspaces',
        'Advanced analytics',
        'Custom integrations',
        'SSO support',
        'Dedicated support',
        'API access (10,000 calls/month)',
        'Webhook support',
        'Custom branding'
      ],
      limitations: [],
      buttonText: 'Contact Sales',
      buttonClass: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700',
      popular: false
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Unlock the full power of AI-driven video analysis with our flexible pricing plans
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => {
          const Icon = plan.icon;
          return (
            <div
              key={index}
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

              <div className="p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-lg ${
                    plan.popular ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      plan.popular ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>

                <button className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 mb-6 ${plan.buttonClass}`}>
                  {plan.buttonText}
                </button>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Features included:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-2">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.limitations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Limitations:</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, limitIndex) => (
                          <li key={limitIndex} className="flex items-start space-x-2">
                            <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                              <div className="w-3 h-3 bg-gray-400 rounded-full mx-auto mt-1"></div>
                            </div>
                            <span className="text-gray-500 text-sm">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600 mb-4">
          Need a custom solution? We offer enterprise plans with custom pricing.
        </p>
        <button className="text-blue-600 hover:text-blue-700 font-semibold">
          Contact us for enterprise pricing →
        </button>
      </div>

      {/* API Pricing Section */}
      <div className="mt-16 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">API Pricing</h3>
          <p className="text-gray-600">
            Integrate Transcripto's powerful video analysis into your applications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Volume Pricing</h4>
            <div className="text-3xl font-bold text-gray-900 mb-2">$0.05</div>
            <div className="text-gray-600 mb-4">per API call (10,000+ calls)</div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>50% discount on volume</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Priority support</span>
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