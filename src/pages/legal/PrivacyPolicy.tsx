import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="min-h-screen pt-16 pb-24">
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Privacy Policy</h1>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-6 space-y-6"
        >
          <p className="text-sm text-muted-foreground">Last updated: December 2024</p>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. Information We Collect</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We collect information you provide directly, including your email address and display name when you create an account. We also collect usage data such as watch history and preferences to improve your experience.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. How We Use Your Information</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your information is used to provide and improve our services, personalize your experience, send notifications about new content, and maintain the security of our platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. Data Storage & Security</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use industry-standard security measures to protect your data. Your information is stored securely using Firebase services with encryption at rest and in transit.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. Third-Party Services</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use third-party services including Firebase for authentication and data storage, and TMDB API for movie metadata. These services have their own privacy policies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. Your Rights</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You have the right to access, update, or delete your personal information at any time through your account settings. Contact us if you need assistance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">6. Contact Us</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy, please contact us via our Telegram channel @devmindsatwork or WhatsApp.
            </p>
          </section>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default PrivacyPolicy;
