import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';

// Premium cinematic film reel/streaming animation
const cinematicAnimation = {
  "v": "5.7.4",
  "fr": 60,
  "ip": 0,
  "op": 120,
  "w": 400,
  "h": 400,
  "nm": "Cinematic Loader",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "Play Triangle",
      "sr": 1,
      "ks": {
        "o": { "a": 1, "k": [{ "t": 0, "s": [0], "e": [100] }, { "t": 30, "s": [100] }] },
        "r": { "a": 0, "k": 0 },
        "p": { "a": 0, "k": [200, 200, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 1, "k": [{ "t": 0, "s": [80, 80, 100], "e": [100, 100, 100] }, { "t": 40, "s": [100, 100, 100] }] }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "sr",
              "sy": 1,
              "d": 1,
              "pt": { "a": 0, "k": 3 },
              "p": { "a": 0, "k": [10, 0] },
              "r": { "a": 0, "k": 0 },
              "ir": { "a": 0, "k": 0 },
              "is": { "a": 0, "k": 0 },
              "or": { "a": 0, "k": 40 },
              "os": { "a": 0, "k": 0 },
              "ix": 1,
              "nm": "Play"
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [0.18, 1, 0.42, 1] },
              "o": { "a": 0, "k": 100 },
              "r": 1,
              "nm": "Fill"
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 90 },
              "o": { "a": 0, "k": 100 }
            }
          ],
          "nm": "Play Shape"
        }
      ],
      "ip": 0,
      "op": 120,
      "st": 0
    },
    {
      "ddd": 0,
      "ind": 2,
      "ty": 4,
      "nm": "Circle 1",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { "a": 1, "k": [{ "t": 0, "s": [0], "e": [360] }, { "t": 120, "s": [360] }] },
        "p": { "a": 0, "k": [200, 200, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 0, "k": [100, 100, 100] }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "d": 1,
              "s": { "a": 0, "k": [140, 140] },
              "p": { "a": 0, "k": [0, 0] },
              "nm": "Circle"
            },
            {
              "ty": "st",
              "c": { "a": 0, "k": [0.18, 1, 0.42, 1] },
              "o": { "a": 0, "k": 100 },
              "w": { "a": 0, "k": 4 },
              "lc": 2,
              "lj": 1,
              "ml": 4,
              "d": [{ "n": "d", "nm": "dash", "v": { "a": 0, "k": 20 } }, { "n": "g", "nm": "gap", "v": { "a": 0, "k": 15 } }, { "n": "o", "nm": "offset", "v": { "a": 1, "k": [{ "t": 0, "s": [0], "e": [100] }, { "t": 60, "s": [100] }] } }],
              "nm": "Stroke"
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 },
              "o": { "a": 0, "k": 100 }
            }
          ],
          "nm": "Circle Group"
        }
      ],
      "ip": 0,
      "op": 120,
      "st": 0
    },
    {
      "ddd": 0,
      "ind": 3,
      "ty": 4,
      "nm": "Circle 2",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 60 },
        "r": { "a": 1, "k": [{ "t": 0, "s": [0], "e": [-360] }, { "t": 120, "s": [-360] }] },
        "p": { "a": 0, "k": [200, 200, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 0, "k": [100, 100, 100] }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "d": 1,
              "s": { "a": 0, "k": [180, 180] },
              "p": { "a": 0, "k": [0, 0] },
              "nm": "Circle"
            },
            {
              "ty": "st",
              "c": { "a": 0, "k": [0.18, 1, 0.42, 1] },
              "o": { "a": 0, "k": 100 },
              "w": { "a": 0, "k": 2 },
              "lc": 2,
              "lj": 1,
              "ml": 4,
              "d": [{ "n": "d", "nm": "dash", "v": { "a": 0, "k": 10 } }, { "n": "g", "nm": "gap", "v": { "a": 0, "k": 20 } }, { "n": "o", "nm": "offset", "v": { "a": 1, "k": [{ "t": 0, "s": [0], "e": [-80] }, { "t": 60, "s": [-80] }] } }],
              "nm": "Stroke"
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 },
              "o": { "a": 0, "k": 100 }
            }
          ],
          "nm": "Circle Group"
        }
      ],
      "ip": 0,
      "op": 120,
      "st": 0
    },
    {
      "ddd": 0,
      "ind": 4,
      "ty": 4,
      "nm": "Glow",
      "sr": 1,
      "ks": {
        "o": { "a": 1, "k": [{ "t": 0, "s": [30], "e": [60] }, { "t": 60, "s": [60], "e": [30] }, { "t": 120, "s": [30] }] },
        "r": { "a": 0, "k": 0 },
        "p": { "a": 0, "k": [200, 200, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 1, "k": [{ "t": 0, "s": [95, 95, 100], "e": [105, 105, 100] }, { "t": 60, "s": [105, 105, 100], "e": [95, 95, 100] }, { "t": 120, "s": [95, 95, 100] }] }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "el",
              "d": 1,
              "s": { "a": 0, "k": [200, 200] },
              "p": { "a": 0, "k": [0, 0] },
              "nm": "Glow Circle"
            },
            {
              "ty": "st",
              "c": { "a": 0, "k": [0.18, 1, 0.42, 0.3] },
              "o": { "a": 0, "k": 100 },
              "w": { "a": 0, "k": 20 },
              "lc": 2,
              "lj": 1,
              "nm": "Glow Stroke"
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [0, 0] },
              "a": { "a": 0, "k": [0, 0] },
              "s": { "a": 0, "k": [100, 100] },
              "r": { "a": 0, "k": 0 },
              "o": { "a": 0, "k": 100 }
            }
          ],
          "nm": "Glow Group"
        }
      ],
      "ip": 0,
      "op": 120,
      "st": 0
    }
  ],
  "markers": []
};

interface SplashScreenProps {
  onComplete?: () => void;
  minDisplayTime?: number;
}

export const SplashScreen = ({ onComplete, minDisplayTime = 2500 }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 600);
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [minDisplayTime, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isExiting ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ backgroundColor: '#000000' }}
        >
          {/* Ambient glow effect */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(46, 255, 106, 0.08) 0%, transparent 50%)',
            }}
          />
          
          {/* Main content container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center justify-center"
          >
            {/* Lottie Animation */}
            <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56">
              <Lottie
                animationData={cinematicAnimation}
                loop={true}
                autoplay={true}
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            {/* Logo/Brand Name */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-6 text-center"
            >
              <h1 
                className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-wider"
                style={{ 
                  color: '#F97316',
                  textShadow: '0 0 30px rgba(249, 115, 22, 0.5), 0 0 60px rgba(249, 115, 22, 0.3)'
                }}
              >
                UGAWATCH
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-2 text-sm sm:text-base tracking-widest uppercase"
                style={{ color: 'rgba(255, 255, 255, 0.6)' }}
              >
                Stream • Watch • Enjoy
              </motion.p>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              className="mt-8 flex items-center gap-2"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#2eff6a' }}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom gradient fade */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(46, 255, 106, 0.05) 0%, transparent 100%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
