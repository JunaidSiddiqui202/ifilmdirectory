// Micro-animations using Framer Motion for smooth, professional UI interactions

import { motion, type Variants } from 'framer-motion';
import { type ReactNode } from 'react';

// ==================== ANIMATION VARIANTS ====================

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const slideUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export const slideDown: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
};

export const slideLeft: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

export const slideRight: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

// ==================== ANIMATED COMPONENTS ====================

// Fade in animation
export const FadeIn = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => (
    <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fadeIn}
        transition={{ delay }}
    >
        {children}
    </motion.div>
);

// Slide up animation
export const SlideUp = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => (
    <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={slideUp}
        transition={{ delay }}
    >
        {children}
    </motion.div>
);

// Scale in animation
export const ScaleIn = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => (
    <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={scaleIn}
        transition={{ delay }}
    >
        {children}
    </motion.div>
);

// Stagger children animation
export const StaggerContainer = ({ children }: { children: ReactNode }) => (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
        {children}
    </motion.div>
);

export const StaggerItem = ({ children }: { children: ReactNode }) => (
    <motion.div variants={staggerItem}>{children}</motion.div>
);

// ==================== INTERACTIVE ANIMATIONS ====================

// Hover scale animation
export const HoverScale = ({
    children,
    scale = 1.05,
}: {
    children: ReactNode;
    scale?: number;
}) => (
    <motion.div whileHover={{ scale }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
        {children}
    </motion.div>
);

// Tap animation
export const TapScale = ({ children }: { children: ReactNode }) => (
    <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.1 }}>
        {children}
    </motion.div>
);

// Shake animation (for errors)
export const Shake = ({ children, trigger }: { children: ReactNode; trigger: boolean }) => (
    <motion.div
        animate={
            trigger
                ? {
                    x: [0, -10, 10, -10, 10, 0],
                    transition: { duration: 0.4 },
                }
                : {}
        }
    >
        {children}
    </motion.div>
);

// Bounce animation (for success)
export const Bounce = ({ children, trigger }: { children: ReactNode; trigger: boolean }) => (
    <motion.div
        animate={
            trigger
                ? {
                    y: [0, -10, 0],
                    transition: { duration: 0.4 },
                }
                : {}
        }
    >
        {children}
    </motion.div>
);

// ==================== PAGE TRANSITIONS ====================

export const PageTransition = ({ children }: { children: ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
    >
        {children}
    </motion.div>
);

// ==================== CARD ANIMATIONS ====================

export const AnimatedCard = ({
    children,
    delay = 0,
}: {
    children: ReactNode;
    delay?: number;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.3 }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="cursor-pointer"
    >
        {children}
    </motion.div>
);

// ==================== MODAL ANIMATIONS ====================

export const ModalBackdrop = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClick}
        className="fixed inset-0 bg-black/50 z-40"
    >
        {children}
    </motion.div>
);

export const ModalContent = ({ children }: { children: ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative z-50"
        onClick={(e) => e.stopPropagation()}
    >
        {children}
    </motion.div>
);

// ==================== LIST ANIMATIONS ====================

export const AnimatedList = ({ children }: { children: ReactNode }) => (
    <motion.div
        initial="hidden"
        animate="visible"
        variants={{
            visible: {
                transition: {
                    staggerChildren: 0.05,
                },
            },
        }}
    >
        {children}
    </motion.div>
);

export const AnimatedListItem = ({ children }: { children: ReactNode }) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, x: -20 },
            visible: { opacity: 1, x: 0 },
        }}
    >
        {children}
    </motion.div>
);

// ==================== NOTIFICATION ANIMATIONS ====================

export const NotificationSlide = ({ children }: { children: ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ duration: 0.3 }}
    >
        {children}
    </motion.div>
);

// ==================== LOADING ANIMATIONS ====================

export const PulseAnimation = ({ children }: { children: ReactNode }) => (
    <motion.div
        animate={{
            scale: [1, 1.05, 1],
            opacity: [1, 0.8, 1],
        }}
        transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
        }}
    >
        {children}
    </motion.div>
);

export const SpinAnimation = ({ children }: { children: ReactNode }) => (
    <motion.div
        animate={{ rotate: 360 }}
        transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
        }}
    >
        {children}
    </motion.div>
);

// ==================== USAGE EXAMPLES ====================

/*
// Basic animations
<FadeIn delay={0.2}>
  <h1>Welcome!</h1>
</FadeIn>

<SlideUp>
  <p>Content slides up</p>
</SlideUp>

// Interactive
<HoverScale scale={1.1}>
  <button>Hover me!</button>
</HoverScale>

// Lists
<AnimatedList>
  {items.map(item => (
    <AnimatedListItem key={item.id}>
      <ItemCard item={item} />
    </AnimatedListItem>
  ))}
</AnimatedList>

// Modals
<AnimatePresence>
  {isOpen && (
    <ModalBackdrop onClick={close}>
      <ModalContent>
        <div>Modal content</div>
      </ModalContent>
    </ModalBackdrop>
  )}
</AnimatePresence>

// Cards
<AnimatedCard delay={0.1}>
  <JobCard job={job} />
</AnimatedCard>

// Error shake
<Shake trigger={hasError}>
  <input className={hasError ? 'border-red-500' : ''} />
</Shake>
*/

export default {
    FadeIn,
    SlideUp,
    ScaleIn,
    HoverScale,
    TapScale,
    AnimatedCard,
    AnimatedList,
    AnimatedListItem,
    PageTransition,
    ModalBackdrop,
    ModalContent,
    NotificationSlide,
    Shake,
    Bounce,
};
