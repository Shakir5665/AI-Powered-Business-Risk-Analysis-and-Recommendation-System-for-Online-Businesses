import HeroSection from "../components/landing/HeroSection";
import MetricsSection from "../components/landing/MetricsSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import BenefitsSection from "../components/landing/BenefitsSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import PricingSection from "../components/landing/PricingSection";
import IntegrationSection from "../components/landing/IntegrationSection";
import BlogSection from "../components/landing/BlogSection";
import CTAFooter from "../components/landing/CTAFooter";

const LandingPage = () => {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <MetricsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <BenefitsSection />
      <TestimonialsSection />
      <PricingSection />
      <IntegrationSection />
      <BlogSection />
      <CTAFooter />
    </main>
  );
};

export default LandingPage;
