import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Dumbbell } from "lucide-react";
import type { PaymentPlan } from "@shared/schema";

export default function Pricing() {
  const { t } = useTranslation();

  // Fetch active payment plans
  const { data: paymentPlans = [], isLoading } = useQuery<PaymentPlan[]>({
    queryKey: ['/api/payment-plans/active'],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <a className="flex items-center space-x-2 cursor-pointer">
                <Dumbbell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('landing.appName')}
                </span>
              </a>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-testid="button-back-home"
                >
                  {t('pricing.backToHome')}
                </Button>
              </Link>
              
              <Link href="/login-form">
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-testid="button-signin"
                >
                  {t('landing.signIn')}
                </Button>
              </Link>
              
              <Link href="/register">
                <Button 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  data-testid="button-signup"
                >
                  {t('landing.signUp')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Pricing Content */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t('landing.pricing.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('landing.pricing.subtitle')}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          ) : paymentPlans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">{t('pricing.noPlansAvailable')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paymentPlans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className="relative border-2 hover:border-blue-500 transition-all hover:shadow-lg"
                  data-testid={`card-pricing-plan-${plan.id}`}
                >
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                          ${plan.amount}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {plan.currency}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          / {plan.type}
                        </span>
                      </div>
                    </div>

                    {plan.features && plan.features.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {t('pricing.featuresIncluded')}
                        </h4>
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
