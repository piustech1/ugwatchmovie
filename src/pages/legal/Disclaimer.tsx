import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";

const Disclaimer = () => {
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
              <AlertTriangle className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Disclaimer</h1>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-6 space-y-6"
        >
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground leading-relaxed">
                <strong>Important:</strong> UgaWatch does not host, store, or upload any video content on its servers. All content is sourced from third-party providers.
              </p>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Content Sources</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              UgaWatch acts as a search engine that indexes content available on the internet. We do not control, verify, or endorse the content provided by third-party sources. All video streams are hosted on external servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">No Infringement Intent</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This application is intended for educational and entertainment purposes only. We respect intellectual property rights and will promptly remove any content upon valid copyright holder requests.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">User Responsibility</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Users are solely responsible for verifying the legality of content consumption in their jurisdiction. We encourage users to support content creators by using official streaming services when available.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">DMCA Compliance</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you believe content linked through our service infringes your copyright, please contact us with details. We will investigate and take appropriate action in accordance with the Digital Millennium Copyright Act (DMCA).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Accuracy of Information</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              While we strive to provide accurate metadata (titles, descriptions, thumbnails) sourced from TMDB, we make no guarantees about the accuracy or completeness of this information.
            </p>
          </section>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Disclaimer;
