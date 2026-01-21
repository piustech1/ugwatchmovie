import { ArrowLeft, Copyright as CopyrightIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";

const Copyright = () => {
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
              <CopyrightIcon className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Copyright Notice</h1>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-6 space-y-6"
        >
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Application Copyright</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              © 2026 UgaWatch. All rights reserved. The UgaWatch name, logo, and application design are the intellectual property of their respective owners.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Third-Party Content</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All movie and TV show content, including but not limited to titles, posters, descriptions, and video streams, are the property of their respective copyright holders. UgaWatch does not claim ownership of any third-party content.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">TMDB Attribution</h2>
            <div className="p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground leading-relaxed">
                This product uses the TMDB API but is not endorsed or certified by TMDB. All movie metadata, including posters, descriptions, and ratings, are provided by The Movie Database (TMDB).
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">VJ Translations</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Video Jockey (VJ) translations featured in this application are created by independent translators. Copyright for these translations belongs to the respective VJs credited in each video.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Reporting Violations</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you believe your copyrighted work has been used without authorization, please contact us through our Telegram channel @devmindsatwork with the following information:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Description of the copyrighted work</li>
              <li>Location of the infringing content</li>
              <li>Your contact information</li>
              <li>Statement of good faith belief</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Fair Use</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Certain content may be used under fair use doctrine for purposes such as criticism, comment, news reporting, teaching, or research. Such use does not constitute infringement of copyright.
            </p>
          </section>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Copyright;
