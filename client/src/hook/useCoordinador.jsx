import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

export default function useCoordinador(id_pnf) {
  const { user } = useAuth();
  const [isCustom, setIsCustom] = useState(false);
  useEffect(() => {
    if (user.id_pnf) {
      setIsCustom(user.id_pnf === id_pnf);
    }
  }, [user, id_pnf]);
  return { isCustom };
}
