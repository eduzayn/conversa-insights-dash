import { motion } from "framer-motion";
import React from "react";

interface SmoothLoaderProps {
  text?: string;
}

const SmoothLoader: React.FC<SmoothLoaderProps> = ({ text = "Carregando..." }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
    >
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
        className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-gray-600 font-medium"
      >
        {text}
      </motion.p>
    </motion.div>
  );
};

export default SmoothLoader;