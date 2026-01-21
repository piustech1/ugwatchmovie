import { ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";

const TermsOfService = () => {
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
              <FileText className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Terms of Service</h1>
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
            <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing or using UgaWatch, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. Use of Service</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You may use our service for personal, non-commercial purposes only. You agree not to misuse the service, attempt unauthorized access, or interfere with its operation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. User Accounts</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. Content</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All content provided through the service is for entertainment purposes. We do not claim ownership of third-party content and provide links to external sources.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The service is provided "as is" without warranties. We are not liable for any damages arising from your use of the service or inability to access it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">6. Changes to Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default TermsOfService;
