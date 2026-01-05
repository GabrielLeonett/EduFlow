import { Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";



export default function ItemSlider({
  title,
  description,
  image,
  positionX = 100,
  zIndex = "z-0",
  duration = 5000
}) {
  const [x, setX] = useState(positionX);
  const [isVisible, setIsVisible] = useState('opacity-100');
  const [size, setSize] = useState({ width: "400", height: "300" }); // Tamaños iniciales más grandes

  useEffect(() => {
    const timer = setTimeout(() => {
      setX(prevX => {
        const newX = prevX >= 1200 ? -500 : prevX + 200;
        
        // Rangos ajustados con tamaños más grandes
        if (newX > 0 && newX < 300) {
          setIsVisible('opacity-25');
          setSize({ width: "200", height: "150" }); // Tamaño pequeño pero visible
        } else if (newX >= 300 && newX < 600) {
          setIsVisible('opacity-50');
          setSize({ width: "300", height: "225" }); // Tamaño mediano
        } else if (newX >= 600 && newX < 900) {
          setIsVisible('opacity-80');
          setSize({ width: "350", height: "262" }); // Casi tamaño completo
        } else {
          setIsVisible('opacity-100');
          setSize({ width: "400", height: "300" }); // Tamaño máximo
        }
        
        return newX;
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [x, duration]);

  return (
    <motion.div
      className={`absolute top-0 ${zIndex}`}
      style={{ 
        width: `${size.width}px`,
        height: `${size.height}px`
      }}
      animate={{ x }}
      transition={{ type: "spring", stiffness: 50 }}
    >
      <div
        className={`item-slider bg-cover bg-center flex justify-end items-start flex-col ${isVisible} p-8 rounded-lg shadow-lg h-full`}
        style={{
          backgroundImage: `linear-gradient(to bottom, hsla(0, 0%, 19.2%, 0.6), rgba(253, 250, 250, 0.81)), url('/storage/${image}')`
        }}
      >
        <Typography component="h2" variant="h3" className="text-white mb-4 text-4xl">
          {title}
        </Typography>
        <Typography component="p" className="text-white text-xl">
          {description}
        </Typography>
      </div>
    </motion.div>
  );
}