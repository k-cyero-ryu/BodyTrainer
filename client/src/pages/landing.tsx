import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dumbbell, 
  Users, 
  TrendingUp, 
  Calendar,
  Heart,
  MessageCircle,
  Target,
  Award,
  Check,
  DollarSign
} from "lucide-react";
import type { PaymentPlan } from "@shared/schema";

import heroImage1 from "@assets/stock_images/fitness_training_gym_0c77a198.jpg";
import heroImage2 from "@assets/stock_images/fitness_training_gym_f5a4900d.jpg";
import heroImage3 from "@assets/stock_images/fitness_training_gym_4c80a95b.jpg";

export default function Login() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);

  const changeLanguage = (lng: string) => {
    setLanguage(lng);
    i18n.changeLanguage(lng);
  };

  // Fetch active payment plans
  const { data: paymentPlans = [] } = useQuery<PaymentPlan[]>({
    queryKey: ['/api/payment-plans/active'],
  });

  const trainerFeatures = [
    {
      icon: Users,
      title: t('landing.features.trainer1.title'),
      description: t('landing.features.trainer1.desc'),
    },
    {
      icon: Calendar,
      title: t('landing.features.trainer2.title'),
      description: t('landing.features.trainer2.desc'),
    },
    {
      icon: TrendingUp,
      title: t('landing.features.trainer3.title'),
      description: t('landing.features.trainer3.desc'),
    },
    {
      icon: MessageCircle,
      title: t('landing.features.trainer4.title'),
      description: t('landing.features.trainer4.desc'),
    },
  ];

  const memberFeatures = [
    {
      icon: Target,
      title: t('landing.features.member1.title'),
      description: t('landing.features.member1.desc'),
    },
    {
      icon: Heart,
      title: t('landing.features.member2.title'),
      description: t('landing.features.member2.desc'),
    },
    {
      icon: Award,
      title: t('landing.features.member3.title'),
      description: t('landing.features.member3.desc'),
    },
    {
      icon: MessageCircle,
      title: t('landing.features.member4.title'),
      description: t('landing.features.member4.desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {t('landing.appName')}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={language} onValueChange={changeLanguage}>
                <SelectTrigger className="w-[100px] h-9" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                </SelectContent>
              </Select>
              
              <Link href="/login-form">
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-testid="button-signin-nav"
                >
                  {t('landing.signIn')}
                </Button>
              </Link>
              
              <Link href="/register">
                <Button 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  data-testid="button-signup-nav"
                >
                  {t('landing.signUp')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Carousel */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <Carousel className="w-full" data-testid="carousel-hero">
            <CarouselContent>
              <CarouselItem>
                <div className="relative h-[400px] sm:h-[500px] rounded-2xl overflow-hidden">
                  <img
                    src={heroImage1}
                    alt="Fitness Training"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <h2 className="text-4xl font-bold mb-2">{t('landing.tagline')}</h2>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="relative h-[400px] sm:h-[500px] rounded-2xl overflow-hidden">
                  <img
                    src={heroImage2}
                    alt="Personal Training"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <h2 className="text-4xl font-bold mb-2">{t('landing.features.forTrainers')}</h2>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="relative h-[400px] sm:h-[500px] rounded-2xl overflow-hidden">
                  <img
                    src={heroImage3}
                    alt="Fitness Community"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <h2 className="text-4xl font-bold mb-2">{t('landing.features.forMembers')}</h2>
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>

          {/* Description and CTA Buttons */}
          <div className="mt-12 text-center max-w-3xl mx-auto">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              {t('landing.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login-form">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto text-lg px-8 py-6"
                  data-testid="button-signin-hero"
                >
                  {t('landing.signIn')}
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  data-testid="button-signup-hero"
                >
                  {t('landing.getStarted')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            {t('landing.features.title')}
          </h2>
          
          {/* Trainer Features */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-center mb-8 text-blue-600 dark:text-blue-400">
              {t('landing.features.forTrainers')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {trainerFeatures.map((feature, index) => (
                <Card key={index} className="border-2 hover:border-blue-500 transition-colors" data-testid={`card-trainer-feature-${index}`}>
                  <CardContent className="p-6">
                    <feature.icon className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                      {feature.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Member Features */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center mb-8 text-green-600 dark:text-green-400">
              {t('landing.features.forMembers')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {memberFeatures.map((feature, index) => (
                <Card key={index} className="border-2 hover:border-green-500 transition-colors" data-testid={`card-member-feature-${index}`}>
                  <CardContent className="p-6">
                    <feature.icon className="h-12 w-12 text-green-600 dark:text-green-400 mb-4" />
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                      {feature.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {paymentPlans.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="container mx-auto max-w-7xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              {t('landing.pricing.subtitle')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paymentPlans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className="relative border-2 hover:border-blue-500 transition-all hover:shadow-lg"
                  data-testid={`card-pricing-plan-${plan.id}`}
                >
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
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
                      <div className="space-y-3 mb-6">
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

                    <Link href="/register">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        data-testid={`button-choose-plan-${plan.id}`}
                      >
                        {t('landing.pricing.choosePlan')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {t('landing.cta.subtitle')}
          </p>
          <Link href="/register">
            <Button 
              size="lg"
              className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-gray-100"
              data-testid="button-cta"
            >
              {t('landing.cta.button')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 dark:bg-black text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Dumbbell className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">{t('landing.appName')}</span>
              </div>
              <p className="text-gray-400">
                {t('landing.description')}
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('landing.footer.company')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li>{t('landing.footer.about')}</li>
                <li>{t('landing.footer.contact')}</li>
                <li>{t('landing.footer.support')}</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('landing.footer.contact')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li>{t('landing.footer.contactEmail')}</li>
                <li>{t('landing.footer.contactPhone')}</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} {t('landing.appName')}. {t('landing.footer.rights')}.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
